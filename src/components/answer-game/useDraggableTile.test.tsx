import { act, render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useDraggableTile } from './useDraggableTile';
import type { AnswerGameConfig } from './types';
import { playSound } from '@/lib/audio/AudioFeedback';

const mockDraggable = vi.fn().mockReturnValue(() => {});
const mockDropTargetForElements = vi.fn().mockReturnValue(() => {});

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: (...args: unknown[]) => mockDraggable(...args),
  dropTargetForElements: (...args: unknown[]) =>
    mockDropTargetForElements(...args),
}));

const mockPlaceInNextSlot = vi.fn().mockReturnValue({
  placed: true,
  zoneIndex: 0,
  rejected: false,
});
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

let mockWrongTileBehavior = 'lock-auto-eject';

vi.mock('./useAnswerGameContext', () => ({
  useAnswerGameContext: () => ({
    config: {
      inputMethod: 'drag',
      ttsEnabled: true,
      totalRounds: 1,
      gameId: 'test',
      wrongTileBehavior: mockWrongTileBehavior,
      tileBankMode: 'exact',
    },
    zones: [
      {
        id: 'z0',
        index: 0,
        expectedValue: 'C',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ],
    allTiles: [
      { id: 't1', label: 'C', value: 'C' },
      { id: 't2', label: 'X', value: 'X' },
    ],
    bankTileIds: ['t1', 't2'],
    activeSlotIndex: 0,
    roundIndex: 0,
    retryCount: 0,
    phase: 'playing',
    dragActiveTileId: null,
  }),
}));

const mockDispatch = vi.fn();

vi.mock('./useAnswerGameDispatch', () => ({
  useAnswerGameDispatch: () => mockDispatch,
}));

const mockPlaceTile = vi.fn();

vi.mock('./useTileEvaluation', () => ({
  useTileEvaluation: () => ({ placeTile: mockPlaceTile }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const mockTriggerShake = vi.fn();
vi.mock('./Slot/slot-animations', () => ({
  triggerShake: (...args: unknown[]) => mockTriggerShake(...args),
}));

vi.mock('@/lib/skin', () => ({
  resolveSkin: () => ({ suppressDefaultSounds: false }),
}));

const mockEmit = vi.fn();
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: mockEmit, subscribe: vi.fn() }),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      tapForgivenessThreshold: 17,
      tapForgivenessTimeMs: 150,
    },
    update: vi.fn(),
  }),
}));

// Capture the options passed to useTouchDrag so tests can invoke the touch
// callbacks directly without simulating real pointer events.
type CapturedTouchDragOptions = {
  onDrop?: (tileId: string, zoneIndex: number) => void;
  onDropOnBank?: () => void;
  onDropOnBankTile?: (bankTileId: string) => void;
  onTapFallback?: () => void;
  tapForgivenessThreshold?: number;
};

let capturedTouchDragOptions: CapturedTouchDragOptions | null = null;

vi.mock('./useTouchDrag', () => ({
  useTouchDrag: vi
    .fn()
    .mockImplementation((opts: CapturedTouchDragOptions) => {
      capturedTouchDragOptions = opts;
      return {
        onPointerDown: vi.fn(),
        onPointerMove: vi.fn(),
        onPointerUp: vi.fn(),
        onPointerCancel: vi.fn(),
      };
    }),
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

  beforeEach(() => {
    capturedTouchDragOptions = null;
    mockPlaceInNextSlot.mockClear().mockReturnValue({
      placed: true,
      zoneIndex: 0,
      rejected: false,
    });
    mockSpeakTile.mockClear();
    mockDispatch.mockClear();
    mockEmit.mockClear();
    mockTriggerShake.mockClear();
    mockPlaceTile.mockReset();
    vi.mocked(playSound).mockClear();
    mockWrongTileBehavior = 'lock-auto-eject';
  });

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

  describe('touch drag — onDropOnBank', () => {
    it('clears drag state when bank tile is released back onto the bank', () => {
      capturedTouchDragOptions = null;
      mockDispatch.mockClear();

      renderHook(() => useDraggableTile(tile));

      expect(capturedTouchDragOptions).not.toBeNull();
      const opts =
        capturedTouchDragOptions as unknown as CapturedTouchDragOptions;
      expect(opts.onDropOnBank).toBeDefined();
      act(() => opts.onDropOnBank?.());

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
    });
  });

  describe('touch drag — onDropOnBankTile', () => {
    it('clears drag state when bank tile is dropped onto another bank tile hole', () => {
      capturedTouchDragOptions = null;
      mockDispatch.mockClear();

      renderHook(() => useDraggableTile(tile));

      expect(capturedTouchDragOptions).not.toBeNull();
      const opts =
        capturedTouchDragOptions as unknown as CapturedTouchDragOptions;
      expect(opts.onDropOnBankTile).toBeDefined();
      act(() => opts.onDropOnBankTile?.('other-tile'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
    });
  });

  describe('handleClick reject path', () => {
    it('does not speak or place when tile is already shaking', () => {
      const shakeTile = { id: 't1', label: 'C', value: 'C' };
      const { result } = renderHook(() => useDraggableTile(shakeTile));

      const button = document.createElement('button');
      button.dataset.shaking = 'true';
      Object.defineProperty(result.current.ref, 'current', {
        value: button,
        writable: true,
      });

      act(() => result.current.handleClick());

      expect(mockSpeakTile).not.toHaveBeenCalled();
      expect(mockPlaceInNextSlot).not.toHaveBeenCalled();
    });

    it('dispatches REJECT_TAP and plays wrong sound on rejection', () => {
      mockPlaceInNextSlot.mockReturnValue({
        placed: false,
        zoneIndex: 0,
        rejected: true,
      });

      const rejectTile = { id: 't2', label: 'X', value: 'X' };
      const { result } = renderHook(() => useDraggableTile(rejectTile));

      const button = document.createElement('button');
      Object.defineProperty(result.current.ref, 'current', {
        value: button,
        writable: true,
      });

      act(() => result.current.handleClick());

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REJECT_TAP',
        tileId: 't2',
        zoneIndex: 0,
      });
      expect(playSound).toHaveBeenCalledWith('wrong', 0.8);
    });

    it('emits game:evaluate with expected field on rejection', () => {
      mockPlaceInNextSlot.mockReturnValue({
        placed: false,
        zoneIndex: 0,
        rejected: true,
      });

      const rejectTile = { id: 't2', label: 'X', value: 'X' };
      const { result } = renderHook(() => useDraggableTile(rejectTile));

      const button = document.createElement('button');
      Object.defineProperty(result.current.ref, 'current', {
        value: button,
        writable: true,
      });

      act(() => result.current.handleClick());

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game:evaluate',
          answer: 't2',
          correct: false,
          expected: 'C',
          zoneIndex: 0,
        }),
      );
    });

    it('does not dispatch REJECT_TAP on successful placement', () => {
      const okTile = { id: 't1', label: 'C', value: 'C' };
      const { result } = renderHook(() => useDraggableTile(okTile));

      act(() => result.current.handleClick());

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REJECT_TAP' }),
      );
    });
  });

  describe('touch drag reject path', () => {
    it('calls triggerShake on bank tile when drag-drop is rejected in reject mode', () => {
      const rafSpy = vi
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          cb(0);
          return 0;
        });
      try {
        mockWrongTileBehavior = 'reject';
        mockPlaceTile.mockReturnValue({ correct: false });

        const rejectTile = { id: 't2', label: 'X', value: 'X' };
        const { result } = renderHook(() =>
          useDraggableTile(rejectTile),
        );

        const button = document.createElement('button');
        Object.defineProperty(result.current.ref, 'current', {
          value: button,
          writable: true,
        });

        const onDrop = capturedTouchDragOptions?.onDrop;
        expect(onDrop).toBeDefined();
        act(() => onDrop?.('t2', 0));

        expect(mockTriggerShake).toHaveBeenCalledWith(button);
      } finally {
        rafSpy.mockRestore();
        mockWrongTileBehavior = 'lock-auto-eject';
      }
    });

    it('does not shake when wrong tile is dropped in lock-auto-eject mode', () => {
      mockPlaceTile.mockReturnValue({ correct: false });

      const rejectTile = { id: 't2', label: 'X', value: 'X' };
      renderHook(() => useDraggableTile(rejectTile));

      const onDrop = capturedTouchDragOptions?.onDrop;
      act(() => onDrop?.('t2', 0));

      expect(mockTriggerShake).not.toHaveBeenCalled();
    });
  });

  describe('touch drag — tap forgiveness', () => {
    it('passes tapForgivenessThreshold from settings to useTouchDrag', () => {
      capturedTouchDragOptions = null;
      renderHook(() => useDraggableTile(tile));

      expect(capturedTouchDragOptions).not.toBeNull();
      const opts =
        capturedTouchDragOptions as unknown as CapturedTouchDragOptions;
      expect(opts.tapForgivenessThreshold).toBe(17);
    });

    it('onTapFallback clears drag state and places tile in next slot', () => {
      capturedTouchDragOptions = null;
      mockDispatch.mockClear();
      mockPlaceInNextSlot.mockClear();

      renderHook(() => useDraggableTile(tile));

      expect(capturedTouchDragOptions).not.toBeNull();
      const opts =
        capturedTouchDragOptions as unknown as CapturedTouchDragOptions;
      expect(opts.onTapFallback).toBeDefined();
      act(() => opts.onTapFallback?.());

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
      expect(mockPlaceInNextSlot).toHaveBeenCalledWith(tile.id);
    });
  });
});
