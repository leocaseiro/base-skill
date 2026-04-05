import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDraggableTile } from './useDraggableTile';

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: vi.fn().mockReturnValue(() => {}),
}));

const mockPlaceInNextSlot = vi.fn();
const mockSpeakTile = vi.fn();

vi.mock('./useAutoNextSlot', () => ({
  useAutoNextSlot: () => ({ placeInNextSlot: mockPlaceInNextSlot }),
}));

vi.mock('./useGameTTS', () => ({
  useGameTTS: () => ({
    speakTile: mockSpeakTile,
    speakPrompt: vi.fn(),
  }),
}));

vi.mock('./useAnswerGameContext', () => ({
  useAnswerGameContext: () => ({
    config: {
      inputMethod: 'drag',
      ttsEnabled: true,
      totalRounds: 1,
      gameId: 'test',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
    },
    zones: [],
    allTiles: [],
    bankTileIds: [],
    activeSlotIndex: 0,
    roundIndex: 0,
    retryCount: 0,
    phase: 'playing',
    dragActiveTileId: null,
  }),
}));

vi.mock('./useAnswerGameDispatch', () => ({
  useAnswerGameDispatch: () => vi.fn(),
}));

const mockPlaceTile = vi.fn();

vi.mock('./useTileEvaluation', () => ({
  useTileEvaluation: () => ({ placeTile: mockPlaceTile }),
}));

describe('useDraggableTile', () => {
  const tile = { id: 't1', label: 'C', value: 'c' };

  it('returns a ref, handleClick, and touch handlers', () => {
    const { result } = renderHook(() => useDraggableTile(tile));
    expect(result.current.ref).toBeDefined();
    expect(typeof result.current.handleClick).toBe('function');
    expect(typeof result.current.onPointerDown).toBe('function');
    expect(typeof result.current.onPointerMove).toBe('function');
    expect(typeof result.current.onPointerUp).toBe('function');
    expect(typeof result.current.onPointerCancel).toBe('function');
  });

  it('handleClick does not throw', () => {
    const { result } = renderHook(() => useDraggableTile(tile));
    expect(() => act(() => result.current.handleClick())).not.toThrow();
  });

  it('handleClick calls speakTile with tile label', () => {
    mockSpeakTile.mockClear();
    const { result } = renderHook(() => useDraggableTile(tile));
    act(() => result.current.handleClick());
    expect(mockSpeakTile).toHaveBeenCalledWith(tile.label);
  });

  it('handleClick calls placeInNextSlot with tile id', () => {
    mockPlaceInNextSlot.mockClear();
    const { result } = renderHook(() => useDraggableTile(tile));
    act(() => result.current.handleClick());
    expect(mockPlaceInNextSlot).toHaveBeenCalledWith(tile.id);
  });
});
