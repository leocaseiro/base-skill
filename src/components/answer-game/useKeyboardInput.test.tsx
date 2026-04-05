import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useKeyboardInput } from './useKeyboardInput';
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

const makeTileItems = (): TileItem[] => [
  { id: 't1', label: 'C', value: 'c' },
];

const makeAnswerZones = (): AnswerZone[] => [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const makeConfig = (
  inputMethod: AnswerGameConfig['inputMethod'],
): AnswerGameConfig => ({
  gameId: 'test',
  inputMethod,
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: makeTileItems(),
  initialZones: makeAnswerZones(),
});

const makeWrapper = (inputMethod: AnswerGameConfig['inputMethod']) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={makeConfig(inputMethod)}>
      {children}
    </AnswerGameProvider>
  );
  return Wrapper;
};

describe('useKeyboardInput', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dispatches PLACE_TILE for the matching bank tile when a key is pressed in type mode', () => {
    const { unmount } = renderHook(() => useKeyboardInput(), {
      wrapper: makeWrapper('type'),
    });

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'c', bubbles: true }),
      );
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });

    unmount();
  });

  it('does nothing when config.inputMethod is not "type"', () => {
    const { unmount } = renderHook(() => useKeyboardInput(), {
      wrapper: makeWrapper('drag'),
    });

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'c', bubbles: true }),
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();

    unmount();
  });

  it('does nothing when no bank tile matches the pressed key', () => {
    const { unmount } = renderHook(() => useKeyboardInput(), {
      wrapper: makeWrapper('type'),
    });

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'x', bubbles: true }),
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();

    unmount();
  });

  it('is case-insensitive — pressing uppercase key finds lowercase tile', () => {
    const { unmount } = renderHook(() => useKeyboardInput(), {
      wrapper: makeWrapper('type'),
    });

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'C', bubbles: true }),
      );
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });

    unmount();
  });

  it('fires when target is the data-touch-keyboard input', () => {
    const { unmount } = renderHook(() => useKeyboardInput(), {
      wrapper: makeWrapper('type'),
    });

    const fakeInput = document.createElement('input');
    fakeInput.dataset['touchKeyboard'] = 'true';

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: fakeInput });
      globalThis.dispatchEvent(event);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });

    unmount();
  });
});
