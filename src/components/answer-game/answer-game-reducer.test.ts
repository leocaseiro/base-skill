import { describe, expect, it } from 'vitest';
import {
  answerGameReducer,
  makeInitialState,
} from './answer-game-reducer';
import type { AnswerGameConfig, AnswerZone, TileItem } from './types';

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 'T',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

describe('answerGameReducer', () => {
  it('INIT_ROUND sets allTiles and bankTileIds', () => {
    const state = makeInitialState(config);
    const next = answerGameReducer(state, {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    expect(next.allTiles).toEqual(tiles);
    expect(next.bankTileIds).toEqual(['t1', 't2', 't3']);
    expect(next.zones).toEqual(zones);
    expect(next.activeSlotIndex).toBe(0);
  });

  it('PLACE_TILE correct: removes tile from bank and places in zone', () => {
    const state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    const next = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    expect(next.bankTileIds).not.toContain('t1');
    expect(next.zones[0]!.placedTileId).toBe('t1');
    expect(next.zones[0]!.isWrong).toBe(false);
    expect(next.retryCount).toBe(0);
  });

  it('PLACE_TILE wrong: tile stays in bank, zone marked wrong, retryCount incremented', () => {
    const state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    const next = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 0,
    });
    expect(next.bankTileIds).toContain('t2');
    expect(next.zones[0]!.isWrong).toBe(true);
    expect(next.zones[0]!.isLocked).toBe(true);
    expect(next.retryCount).toBe(1);
  });

  it('PLACE_TILE correct: phase transitions to round-complete when all zones filled', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't3',
      zoneIndex: 2,
    });
    expect(state.phase).toBe('round-complete');
  });

  it('REMOVE_TILE returns tile to bank', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'REMOVE_TILE',
      zoneIndex: 0,
    });
    expect(state.bankTileIds).toContain('t1');
    expect(state.zones[0]!.placedTileId).toBeNull();
  });

  it('REMOVE_TILE is a no-op when zone is empty', () => {
    const state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    const next = answerGameReducer(state, {
      type: 'REMOVE_TILE',
      zoneIndex: 0,
    });
    expect(next).toBe(state);
  });

  it('PLACE_TILE correct from bank replaces occupant and returns previous tile to bank', () => {
    const lockManualConfig: AnswerGameConfig = {
      ...config,
      wrongTileBehavior: 'lock-manual',
    };
    let state = answerGameReducer(makeInitialState(lockManualConfig), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 0,
    });
    expect(state.zones[0]!.placedTileId).toBe('t2');
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    expect(state.zones[0]!.placedTileId).toBe('t1');
    expect(state.zones[0]!.isWrong).toBe(false);
    expect(state.bankTileIds).toContain('t2');
    expect(state.bankTileIds).not.toContain('t1');
  });

  it('SWAP_TILES exchanges placed tiles between two occupied zones', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'EJECT_TILE',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 1,
    });
    expect(state.zones[0]!.placedTileId).toBe('t2');
    expect(state.zones[1]!.placedTileId).toBe('t1');
  });

  it('EJECT_TILE clears zone and returns tile to bank', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't2',
      zoneIndex: 0,
    });
    expect(state.zones[0]!.isWrong).toBe(true);
    state = answerGameReducer(state, {
      type: 'EJECT_TILE',
      zoneIndex: 0,
    });
    expect(state.zones[0]!.placedTileId).toBeNull();
    expect(state.zones[0]!.isWrong).toBe(false);
    expect(state.bankTileIds).toContain('t2');
  });

  it('ADVANCE_ROUND resets zones and bank, increments roundIndex', () => {
    let state = answerGameReducer(makeInitialState(config), {
      type: 'INIT_ROUND',
      tiles,
      zones,
    });
    state = answerGameReducer(state, {
      type: 'PLACE_TILE',
      tileId: 't1',
      zoneIndex: 0,
    });
    const newTiles: TileItem[] = [{ id: 'n1', label: 'D', value: 'D' }];
    const newZones: AnswerZone[] = [
      {
        id: 'nz0',
        index: 0,
        expectedValue: 'D',
        placedTileId: null,
        isWrong: false,
        isLocked: false,
      },
    ];
    state = answerGameReducer(state, {
      type: 'ADVANCE_ROUND',
      tiles: newTiles,
      zones: newZones,
    });
    expect(state.roundIndex).toBe(1);
    expect(state.allTiles).toEqual(newTiles);
    expect(state.bankTileIds).toEqual(['n1']);
    expect(state.retryCount).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('COMPLETE_GAME sets phase to game-over', () => {
    const state = makeInitialState(config);
    const next = answerGameReducer(state, { type: 'COMPLETE_GAME' });
    expect(next.phase).toBe('game-over');
  });

  it('SET_DRAG_ACTIVE sets dragActiveTileId', () => {
    const state = makeInitialState(config);
    const next = answerGameReducer(state, {
      type: 'SET_DRAG_ACTIVE',
      tileId: 't1',
    });
    expect(next.dragActiveTileId).toBe('t1');
    const cleared = answerGameReducer(next, {
      type: 'SET_DRAG_ACTIVE',
      tileId: null,
    });
    expect(cleared.dragActiveTileId).toBeNull();
  });
});
