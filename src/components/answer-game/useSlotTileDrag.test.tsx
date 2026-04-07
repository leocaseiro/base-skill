import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSlotTileDrag } from './useSlotTileDrag';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

// Capture the options passed to draggable so tests can invoke the callbacks.
type DraggableDropArgs = {
  location: {
    current: {
      dropTargets: { data: Record<string, unknown> }[];
    };
  };
};

type DraggableOptions = {
  element: HTMLElement;
  getInitialData?: () => Record<string, unknown>;
  onDragStart?: () => void;
  onDrop?: (args: DraggableDropArgs) => void;
};

let capturedDraggableOptions: DraggableOptions | null = null;

const mockCleanup = () => {};

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: vi.fn().mockImplementation((opts: DraggableOptions) => {
    capturedDraggableOptions = opts;
    return mockCleanup;
  }),
}));

const mockDispatch = vi.fn();

vi.mock('./useAnswerGameDispatch', () => ({
  useAnswerGameDispatch: () => mockDispatch,
}));

// useTouchDrag uses pointer events — mock it to simplify unit tests here.
vi.mock('./useTouchDrag', () => ({
  useTouchDrag: () => ({
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerCancel: vi.fn(),
  }),
}));

// Test component that attaches the dragRef to an actual button element so the
// useEffect inside useSlotTileDrag can find element !== null and register the
// draggable adapter.
const SlotTileDragHarness = ({
  tileId,
  zoneIndex,
  onDrop,
}: {
  tileId: string | null;
  zoneIndex: number;
  onDrop: (id: string, idx: number) => void;
  children?: ReactNode;
}) => {
  const { dragRef } = useSlotTileDrag({
    tileId,
    label: 'A',
    zoneIndex,
    onDrop,
  });
  return (
    <button type="button" ref={dragRef} data-testid="drag-tile">
      A
    </button>
  );
};

describe('useSlotTileDrag', () => {
  it('registers draggable on mount when tileId is provided', () => {
    capturedDraggableOptions = null;
    render(
      <SlotTileDragHarness
        tileId="tile-1"
        zoneIndex={0}
        onDrop={vi.fn()}
      />,
    );
    expect(capturedDraggableOptions).not.toBeNull();
  });

  describe('HTML5 onDrop — no drop targets', () => {
    it('dispatches REMOVE_TILE for the correct zoneIndex and does not call onDrop', () => {
      capturedDraggableOptions = null;
      mockDispatch.mockClear();
      const mockOnDrop = vi.fn();

      render(
        <SlotTileDragHarness
          tileId="tile-1"
          zoneIndex={0}
          onDrop={mockOnDrop}
        />,
      );

      expect(capturedDraggableOptions).not.toBeNull();

      (
        capturedDraggableOptions as unknown as DraggableOptions
      ).onDrop?.({
        location: { current: { dropTargets: [] } },
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_TILE',
        zoneIndex: 0,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
      expect(mockOnDrop).not.toHaveBeenCalled();
    });
  });

  describe('HTML5 onDrop — drop target with no zoneIndex', () => {
    it('dispatches REMOVE_TILE but does not call onDrop when target lacks zoneIndex', () => {
      capturedDraggableOptions = null;
      mockDispatch.mockClear();
      const mockOnDrop = vi.fn();

      render(
        <SlotTileDragHarness
          tileId="tile-1"
          zoneIndex={0}
          onDrop={mockOnDrop}
        />,
      );

      expect(capturedDraggableOptions).not.toBeNull();

      (
        capturedDraggableOptions as unknown as DraggableOptions
      ).onDrop?.({
        location: {
          current: {
            dropTargets: [{ data: { someOtherKey: 'value' } }],
          },
        },
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_TILE',
        zoneIndex: 0,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
      expect(mockOnDrop).not.toHaveBeenCalled();
    });
  });

  describe('HTML5 onDrop — confirmed drop on valid target', () => {
    it('dispatches SET_DRAG_ACTIVE and calls onDrop — caller owns REMOVE_TILE/SWAP_TILES', () => {
      capturedDraggableOptions = null;
      mockDispatch.mockClear();
      const mockOnDrop = vi.fn();

      render(
        <SlotTileDragHarness
          tileId="tile-1"
          zoneIndex={0}
          onDrop={mockOnDrop}
        />,
      );

      expect(capturedDraggableOptions).not.toBeNull();

      (
        capturedDraggableOptions as unknown as DraggableOptions
      ).onDrop?.({
        location: {
          current: {
            dropTargets: [{ data: { zoneIndex: 2 } }],
          },
        },
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DRAG_ACTIVE',
        tileId: null,
      });
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REMOVE_TILE' }),
      );
      expect(mockOnDrop).toHaveBeenCalledOnce();
      expect(mockOnDrop).toHaveBeenCalledWith('tile-1', 2);
    });
  });
});
