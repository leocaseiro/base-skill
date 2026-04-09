import { fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useTouchKeyboardInput } from './useTouchKeyboardInput';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const mockDispatch = vi.fn();

vi.mock('./useAnswerGameDispatch', () => ({
  useAnswerGameDispatch: () => mockDispatch,
}));

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'c' },
  { id: 't2', label: 'A', value: 'a' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'a',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'type',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: tiles,
  initialZones: zones,
};

// Renders the hook and a real <input> connected to the ref so we can fire input events.
const TestHarness = () => {
  const { hiddenInputRef } = useTouchKeyboardInput();
  return <input ref={hiddenInputRef} data-testid="hidden" />;
};

const makeWrapper = (cfg: AnswerGameConfig) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={cfg}>{children}</AnswerGameProvider>
  );
  return Wrapper;
};

describe('useTouchKeyboardInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches PLACE_TILE when a matching key is typed into the hidden input', () => {
    render(<TestHarness />, { wrapper: makeWrapper(config) });
    const input = screen.getByTestId('hidden');

    fireEvent.input(input, {
      target: { value: 'c' },
      nativeEvent: { data: 'c' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });

  it('clears the input value after each key', () => {
    render(<TestHarness />, { wrapper: makeWrapper(config) });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    fireEvent.input(input, {
      target: { value: 'c' },
      nativeEvent: { data: 'c' },
    });

    expect(input.value).toBe('');
  });

  it('dispatches TYPE_TILE when no bank tile matches the typed character', () => {
    render(<TestHarness />, { wrapper: makeWrapper(config) });
    const input = screen.getByTestId('hidden');

    fireEvent.input(input, {
      target: { value: 'z' },
      nativeEvent: { data: 'z' },
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TYPE_TILE',
        value: 'z',
        zoneIndex: 0,
      }),
    );
  });

  it('is case-insensitive — uppercase input matches lowercase tile value', () => {
    render(<TestHarness />, { wrapper: makeWrapper(config) });
    const input = screen.getByTestId('hidden');

    fireEvent.input(input, {
      target: { value: 'C' },
      nativeEvent: { data: 'C' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
  });
});

describe('useTouchKeyboardInput — numeric debounce', () => {
  const numericTiles: TileItem[] = [
    { id: 'n1', label: '3', value: '3' },
    { id: 'n2', label: '12', value: '12' },
    { id: 'n3', label: '7', value: '7' },
  ];

  const numericZones: AnswerZone[] = [
    {
      id: 'z0',
      index: 0,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z1',
      index: 1,
      expectedValue: '7',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 2,
      expectedValue: '12',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ];

  const numericConfig: AnswerGameConfig = {
    gameId: 'sort',
    inputMethod: 'type',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: false,
    touchKeyboardInputMode: 'numeric',
    initialTiles: numericTiles,
    initialZones: numericZones,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces numeric input and matches multi-digit numbers', () => {
    render(<TestHarness />, { wrapper: makeWrapper(numericConfig) });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    // Simulate typing "1" then "2" in quick succession
    input.value = '1';
    fireEvent.input(input);

    // No dispatch yet — waiting for debounce
    expect(mockDispatch).not.toHaveBeenCalled();

    input.value = '12';
    fireEvent.input(input);

    // Still waiting
    expect(mockDispatch).not.toHaveBeenCalled();

    // Advance past the debounce timeout (400ms)
    vi.advanceTimersByTime(400);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 'n2',
      zoneIndex: 0,
    });
  });

  it('matches single-digit numbers after debounce', () => {
    render(<TestHarness />, { wrapper: makeWrapper(numericConfig) });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    input.value = '3';
    fireEvent.input(input);

    expect(mockDispatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 'n1',
      zoneIndex: 0,
    });
  });

  it('clears input after debounce fires', () => {
    render(<TestHarness />, { wrapper: makeWrapper(numericConfig) });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    input.value = '7';
    fireEvent.input(input);
    vi.advanceTimersByTime(400);

    expect(input.value).toBe('');
  });

  it('dispatches TYPE_TILE when no tile matches the debounced numeric value', () => {
    render(<TestHarness />, { wrapper: makeWrapper(numericConfig) });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    input.value = '99';
    fireEvent.input(input);
    vi.advanceTimersByTime(400);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TYPE_TILE',
        value: '99',
        zoneIndex: 0,
      }),
    );
  });
});
