// src/lib/game-engine/move-log.test.ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMoveLog } from './move-log';
import type { Move } from './types';

function makeMove(type: Move['type'], args: Move['args'] = {}): Move {
  return { type, args, timestamp: Date.now() };
}

describe('useMoveLog', () => {
  it('starts with empty moves array', () => {
    const { result } = renderHook(() => useMoveLog(3));
    expect(result.current.moves).toEqual([]);
  });

  it('canUndo is false when moves is empty', () => {
    const { result } = renderHook(() => useMoveLog(3));
    expect(result.current.canUndo).toBe(false);
  });

  it('canUndo is false when maxUndoDepth is 0', () => {
    const { result } = renderHook(() => useMoveLog(0));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(false);
  });

  it('canUndo is true after appending a move with non-zero depth', () => {
    const { result } = renderHook(() => useMoveLog(3));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(true);
  });

  it('canUndo is true after appending a move with null depth (unlimited)', () => {
    const { result } = renderHook(() => useMoveLog(null));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
    });
    expect(result.current.canUndo).toBe(true);
  });

  it('appends moves in order', () => {
    const { result } = renderHook(() => useMoveLog(3));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      result.current.appendMove(makeMove('REQUEST_HINT', {}));
    });
    expect(result.current.moves).toHaveLength(2);
    expect(result.current.moves[0]?.type).toBe('SUBMIT_ANSWER');
    expect(result.current.moves[1]?.type).toBe('REQUEST_HINT');
  });

  it('accepts UNDO move within allowed depth', () => {
    const { result } = renderHook(() => useMoveLog(2));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      ); // index 0
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      ); // index 1
      // UNDO to step 0: undoDepth = moves.length(2) - targetStep(0) = 2 (allowed, maxUndoDepth=2)
      result.current.appendMove(makeMove('UNDO', { targetStep: 0 }));
    });
    expect(result.current.moves).toHaveLength(3);
    expect(result.current.moves[2]?.type).toBe('UNDO');
  });

  it('rejects UNDO move when maxUndoDepth is 0 (returns false)', () => {
    const { result } = renderHook(() => useMoveLog(0));
    let accepted = true;
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      accepted = result.current.appendMove(
        makeMove('UNDO', { targetStep: 0 }),
      );
    });
    expect(accepted).toBe(false);
    expect(result.current.moves).toHaveLength(1); // UNDO not appended
  });

  it('rejects UNDO move that exceeds maxUndoDepth', () => {
    const { result } = renderHook(() => useMoveLog(1)); // only 1 undo allowed
    let accepted = true;
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      ); // index 0
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      ); // index 1
      // UNDO to step 0: undoDepth = 2 - 0 = 2 > maxUndoDepth(1) → reject
      accepted = result.current.appendMove(
        makeMove('UNDO', { targetStep: 0 }),
      );
    });
    expect(accepted).toBe(false);
    expect(result.current.moves).toHaveLength(2);
  });

  it('allows unlimited UNDO when maxUndoDepth is null', () => {
    const { result } = renderHook(() => useMoveLog(null));
    act(() => {
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'A' }),
      );
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'B' }),
      );
      result.current.appendMove(
        makeMove('SUBMIT_ANSWER', { answer: 'C' }),
      );
      result.current.appendMove(makeMove('UNDO', { targetStep: 0 })); // undo all 3
    });
    expect(result.current.moves).toHaveLength(4);
  });
});
