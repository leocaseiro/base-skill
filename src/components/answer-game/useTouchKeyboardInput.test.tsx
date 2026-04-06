import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnswerGameProvider config={config}>{children}</AnswerGameProvider>
);

describe('useTouchKeyboardInput', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dispatches PLACE_TILE when a matching key is typed into the hidden input', () => {
    render(<TestHarness />, { wrapper });
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
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId<HTMLInputElement>('hidden');

    fireEvent.input(input, {
      target: { value: 'c' },
      nativeEvent: { data: 'c' },
    });

    expect(input.value).toBe('');
  });

  it('does nothing when no bank tile matches the typed character', () => {
    render(<TestHarness />, { wrapper });
    const input = screen.getByTestId('hidden');

    fireEvent.input(input, {
      target: { value: 'z' },
      nativeEvent: { data: 'z' },
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('is case-insensitive — uppercase input matches lowercase tile value', () => {
    render(<TestHarness />, { wrapper });
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
