import { describe, expect, it } from 'vitest';
import {
  createInitialSpotAllState,
  spotAllReducer,
} from './spot-all-reducer';
import type { SpotAllRound } from './types';

const roundA: SpotAllRound = {
  target: 'b',
  correctCount: 2,
  tiles: [
    { id: 'a1', label: 'b', isCorrect: true },
    { id: 'a2', label: 'b', isCorrect: true },
    { id: 'a3', label: 'd', isCorrect: false },
  ],
};

const roundB: SpotAllRound = {
  target: 'p',
  correctCount: 1,
  tiles: [
    { id: 'b1', label: 'p', isCorrect: true },
    { id: 'b2', label: 'q', isCorrect: false },
  ],
};

describe('spotAllReducer', () => {
  it('completes a round for exact correct selection', () => {
    let state = createInitialSpotAllState([roundA, roundB]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a2',
    });
    state = spotAllReducer(state, { type: 'SUBMIT' });
    expect(state.phase).toBe('round-complete');
    expect(state.feedback).toBe('correct');
  });

  it('marks mixed selections as incorrect', () => {
    let state = createInitialSpotAllState([roundA, roundB]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a3',
    });
    state = spotAllReducer(state, { type: 'SUBMIT' });
    expect(state.phase).toBe('playing');
    expect(state.feedback).toBe('incorrect');
  });

  it('deselects a tile when toggled twice', () => {
    let state = createInitialSpotAllState([roundA, roundB]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    expect(state.selectedIds.size).toBe(0);
  });

  it('advances round and resets selection', () => {
    let state = createInitialSpotAllState([roundA, roundB]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a2',
    });
    state = spotAllReducer(state, { type: 'SUBMIT' });
    state = spotAllReducer(state, { type: 'ADVANCE_ROUND' });

    expect(state.roundIndex).toBe(1);
    expect(state.selectedIds.size).toBe(0);
    expect(state.tiles.map((tile) => tile.id)).toEqual(['b1', 'b2']);
  });

  it('treats empty submit as incorrect', () => {
    const state = spotAllReducer(createInitialSpotAllState([roundA]), {
      type: 'SUBMIT',
    });
    expect(state.feedback).toBe('incorrect');
    expect(state.phase).toBe('playing');
  });

  it('treats extra picks as incorrect', () => {
    let state = createInitialSpotAllState([roundA]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a2',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a3',
    });
    state = spotAllReducer(state, { type: 'SUBMIT' });

    expect(state.feedback).toBe('incorrect');
    expect(state.phase).toBe('playing');
  });

  it('completes game when advancing from last round', () => {
    let state = createInitialSpotAllState([roundA]);
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a1',
    });
    state = spotAllReducer(state, {
      type: 'TOGGLE_TILE',
      tileId: 'a2',
    });
    state = spotAllReducer(state, { type: 'SUBMIT' });
    state = spotAllReducer(state, { type: 'ADVANCE_ROUND' });
    expect(state.phase).toBe('game-over');
  });
});
