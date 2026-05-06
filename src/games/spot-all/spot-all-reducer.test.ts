import { describe, expect, it } from 'vitest';
import {
  ROUND_ADVANCE_MS,
  WRONG_COOLDOWN_MS,
  createInitialSpotAllState,
  spotAllReducer,
} from './spot-all-reducer';
import type { SpotAllRound } from './types';

const round = (overrides?: Partial<SpotAllRound>): SpotAllRound => ({
  target: 'b',
  correctCount: 2,
  tiles: [
    { id: 'c1', label: 'b', isCorrect: true },
    { id: 'c2', label: 'b', isCorrect: true },
    { id: 'd1', label: 'd', isCorrect: false },
  ],
  ...overrides,
});

describe('createInitialSpotAllState', () => {
  it('seeds rounds, picks the first round tiles, sets phase=playing', () => {
    const r = round();
    const state = createInitialSpotAllState([r]);
    expect(state.roundIndex).toBe(0);
    expect(state.tiles).toEqual(r.tiles);
    expect(state.selectedIds.size).toBe(0);
    expect(state.wrongCooldownIds.size).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.retryCount).toBe(0);
  });
});

describe('spotAllReducer · TAP_TILE', () => {
  it('selects an unselected correct tile', () => {
    const s = createInitialSpotAllState([round()]);
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    expect(next.selectedIds.has('c1')).toBe(true);
    expect(next.phase).toBe('playing');
  });

  it('deselects an already-selected correct tile', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    expect(next.selectedIds.has('c1')).toBe(false);
  });

  it('transitions phase=round-complete when last correct tile is selected', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    expect(next.phase).toBe('round-complete');
  });

  it('puts a wrong tile in wrongCooldownIds and increments retryCount, no selection change', () => {
    const s = createInitialSpotAllState([round()]);
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next.wrongCooldownIds.has('d1')).toBe(true);
    expect(next.selectedIds.has('d1')).toBe(false);
    expect(next.retryCount).toBe(1);
  });

  it('ignores TAP_TILE on a tile in cooldown', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next).toBe(s); // unchanged reference
  });

  it('ignores TAP_TILE when phase is not playing', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    // phase=round-complete now
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next).toBe(s);
  });
});

describe('spotAllReducer · CLEAR_WRONG_COOLDOWN', () => {
  it('removes a tile from wrongCooldownIds', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    const next = spotAllReducer(s, {
      type: 'CLEAR_WRONG_COOLDOWN',
      tileId: 'd1',
    });
    expect(next.wrongCooldownIds.has('d1')).toBe(false);
  });
});

describe('spotAllReducer · ADVANCE_ROUND', () => {
  it('moves to the next round, resets selection + cooldown', () => {
    const r1 = round();
    const r2 = round({ target: 'd' });
    let s = createInitialSpotAllState([r1, r2]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    const next = spotAllReducer(s, { type: 'ADVANCE_ROUND' });
    expect(next.roundIndex).toBe(1);
    expect(next.tiles).toEqual(r2.tiles);
    expect(next.selectedIds.size).toBe(0);
    expect(next.wrongCooldownIds.size).toBe(0);
    expect(next.phase).toBe('playing');
  });

  it('transitions to game-over when no next round exists', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    const next = spotAllReducer(s, { type: 'ADVANCE_ROUND' });
    expect(next.phase).toBe('game-over');
  });
});

describe('exported timing constants', () => {
  it('exposes WRONG_COOLDOWN_MS=600 and ROUND_ADVANCE_MS=750', () => {
    expect(WRONG_COOLDOWN_MS).toBe(600);
    expect(ROUND_ADVANCE_MS).toBe(750);
  });
});
