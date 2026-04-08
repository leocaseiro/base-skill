import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useDraggableTile } from './useDraggableTile';
import type { AnswerGameConfig } from './types';

const mockDraggable = vi.fn().mockReturnValue(() => {});
const mockDropTargetForElements = vi.fn().mockReturnValue(() => {});

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: (...args: unknown[]) => mockDraggable(...args),
  dropTargetForElements: (...args: unknown[]) =>
    mockDropTargetForElements(...args),
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

const providerConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const hostTile = { id: 't1', label: 'C', value: 'c' };

const DraggableHost = () => {
  const { ref } = useDraggableTile(hostTile);
  return (
    <button ref={ref} type="button">
      drag me
    </button>
  );
};

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

  it('registers draggable and bank swap drop target when the button mounts', () => {
    mockDraggable.mockClear();
    mockDropTargetForElements.mockClear();
    render(
      <AnswerGameProvider config={providerConfig}>
        <DraggableHost />
      </AnswerGameProvider>,
    );
    expect(mockDraggable).toHaveBeenCalledTimes(1);
    expect(mockDropTargetForElements).toHaveBeenCalledTimes(1);
    const dropArgs = mockDropTargetForElements.mock.calls[0]?.[0] as {
      onDragEnter: () => void;
    };
    expect(typeof dropArgs.onDragEnter).toBe('function');
  });
});
