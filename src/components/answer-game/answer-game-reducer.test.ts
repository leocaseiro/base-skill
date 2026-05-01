import { describe, expect, it } from 'vitest';
import {
  answerGameReducer,
  makeInitialState,
} from './answer-game-reducer';
import type {
  AnswerGameConfig,
  AnswerGameState,
  AnswerZone,
  TileItem,
} from './types';

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

  it('PLACE_TILE wrong (lock-auto-eject): tile placed in slot, removed from bank, zone marked wrong', () => {
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
    expect(next.zones[0]!.placedTileId).toBe('t2');
    expect(next.bankTileIds).not.toContain('t2');
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
    // tile is visible in the slot while wrong (content displayed in red)
    expect(state.zones[0]!.placedTileId).toBe('t2');
    expect(state.zones[0]!.isWrong).toBe(true);
    expect(state.bankTileIds).not.toContain('t2');
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

  describe('EJECT_TILE', () => {
    it('does NOT eject a zone that is not wrong (correct tile placed after stale timer)', () => {
      const state = makeInitialState({
        gameId: 'test',
        inputMethod: 'drag',
        wrongTileBehavior: 'lock-auto-eject',
        tileBankMode: 'exact',
        totalRounds: 1,
        ttsEnabled: false,
      });
      const stateWithCorrectTile: AnswerGameState = {
        ...state,
        allTiles: [{ id: 't1', label: 'c', value: 'c' }],
        bankTileIds: [],
        zones: [
          {
            id: 'z0',
            index: 0,
            expectedValue: 'c',
            placedTileId: 't1',
            isWrong: false,
            isLocked: false,
          },
        ],
      };

      const result = answerGameReducer(stateWithCorrectTile, {
        type: 'EJECT_TILE',
        zoneIndex: 0,
      });

      expect(result.zones[0]!.placedTileId).toBe('t1');
      expect(result.bankTileIds).not.toContain('t1');
    });

    it('still ejects a zone that is wrong', () => {
      const state = makeInitialState({
        gameId: 'test',
        inputMethod: 'drag',
        wrongTileBehavior: 'lock-manual',
        tileBankMode: 'exact',
        totalRounds: 1,
        ttsEnabled: false,
      });
      const stateWithWrongTile: AnswerGameState = {
        ...state,
        allTiles: [{ id: 't1', label: 'a', value: 'a' }],
        bankTileIds: [],
        zones: [
          {
            id: 'z0',
            index: 0,
            expectedValue: 'c',
            placedTileId: 't1',
            isWrong: true,
            isLocked: true,
          },
        ],
      };

      const result = answerGameReducer(stateWithWrongTile, {
        type: 'EJECT_TILE',
        zoneIndex: 0,
      });

      expect(result.zones[0]!.placedTileId).toBeNull();
      expect(result.bankTileIds).toContain('t1');
    });
  });

  describe('level mode', () => {
    const levelConfig: AnswerGameConfig = {
      gameId: 'test',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 1,
      ttsEnabled: true,
      levelMode: {
        generateNextLevel: () => ({ tiles: [], zones: [] }),
      },
    };

    it('makeInitialState sets isLevelMode true when levelMode is present', () => {
      const state = makeInitialState(levelConfig);
      expect(state.isLevelMode).toBe(true);
      expect(state.levelIndex).toBe(0);
    });

    it('makeInitialState sets isLevelMode false when levelMode is absent', () => {
      const state = makeInitialState(config);
      expect(state.isLevelMode).toBe(false);
      expect(state.levelIndex).toBe(0);
    });

    it('completing all zones in level mode transitions to level-complete (not game-over)', () => {
      let state = answerGameReducer(makeInitialState(levelConfig), {
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
      expect(state.phase).toBe('level-complete');
    });

    it('completing all zones with maxLevels reached transitions to game-over', () => {
      const cappedConfig: AnswerGameConfig = {
        ...levelConfig,
        levelMode: {
          maxLevels: 1,
          generateNextLevel: () => ({ tiles: [], zones: [] }),
        },
      };
      let state = answerGameReducer(makeInitialState(cappedConfig), {
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
      expect(state.phase).toBe('game-over');
    });

    it('ADVANCE_LEVEL increments levelIndex and resets round state', () => {
      let state = makeInitialState(levelConfig);
      state = answerGameReducer(state, {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });
      state = { ...state, phase: 'level-complete' as const };
      const newTiles: TileItem[] = [
        { id: 'n1', label: 'D', value: 'D' },
      ];
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
        type: 'ADVANCE_LEVEL',
        tiles: newTiles,
        zones: newZones,
      });
      expect(state.levelIndex).toBe(1);
      expect(state.allTiles).toEqual(newTiles);
      expect(state.bankTileIds).toEqual(['n1']);
      expect(state.phase).toBe('playing');
      expect(state.roundIndex).toBe(0);
    });

    it('ADVANCE_LEVEL does NOT reset retryCount', () => {
      let state = makeInitialState(levelConfig);
      state = answerGameReducer(state, {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });
      state = answerGameReducer(state, {
        type: 'PLACE_TILE',
        tileId: 't2',
        zoneIndex: 0,
      });
      expect(state.retryCount).toBe(1);
      state = { ...state, phase: 'level-complete' as const };
      const newTiles: TileItem[] = [
        { id: 'n1', label: 'D', value: 'D' },
      ];
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
        type: 'ADVANCE_LEVEL',
        tiles: newTiles,
        zones: newZones,
      });
      expect(state.retryCount).toBe(1);
    });

    it('SWAP_TILES completing all zones in level mode transitions to level-complete', () => {
      const swapConfig: AnswerGameConfig = {
        ...levelConfig,
        wrongTileBehavior: 'lock-manual',
      };
      const twoTiles: TileItem[] = [
        { id: 's1', label: 'X', value: 'X' },
        { id: 's2', label: 'Y', value: 'Y' },
      ];
      const twoZones: AnswerZone[] = [
        {
          id: 'sz0',
          index: 0,
          expectedValue: 'X',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'sz1',
          index: 1,
          expectedValue: 'Y',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ];
      let state = answerGameReducer(makeInitialState(swapConfig), {
        type: 'INIT_ROUND',
        tiles: twoTiles,
        zones: twoZones,
      });
      // Place tiles in swapped positions
      state = answerGameReducer(state, {
        type: 'PLACE_TILE',
        tileId: 's2',
        zoneIndex: 0,
      }); // wrong
      state = answerGameReducer(state, {
        type: 'PLACE_TILE',
        tileId: 's1',
        zoneIndex: 1,
      }); // wrong
      expect(state.phase).toBe('playing');
      // Swap to correct positions
      state = answerGameReducer(state, {
        type: 'SWAP_TILES',
        fromZoneIndex: 0,
        toZoneIndex: 1,
      });
      expect(state.phase).toBe('level-complete');
    });
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

  it('SET_DRAG_HOVER sets dragHoverZoneIndex', () => {
    const state = makeInitialState(config);
    const next = answerGameReducer(state, {
      type: 'SET_DRAG_HOVER',
      zoneIndex: 2,
    });
    expect(next.dragHoverZoneIndex).toBe(2);
  });

  it('SET_DRAG_HOVER with null clears dragHoverZoneIndex', () => {
    let state = makeInitialState(config);
    state = answerGameReducer(state, {
      type: 'SET_DRAG_HOVER',
      zoneIndex: 1,
    });
    const next = answerGameReducer(state, {
      type: 'SET_DRAG_HOVER',
      zoneIndex: null,
    });
    expect(next.dragHoverZoneIndex).toBeNull();
  });

  it('SET_DRAG_ACTIVE clearing to null also clears dragHoverZoneIndex', () => {
    let state = makeInitialState(config);
    state = answerGameReducer(state, {
      type: 'SET_DRAG_HOVER',
      zoneIndex: 1,
    });
    state = answerGameReducer(state, {
      type: 'SET_DRAG_ACTIVE',
      tileId: null,
    });
    expect(state.dragHoverZoneIndex).toBeNull();
  });

  describe('TYPE_TILE (free-typing virtual tiles)', () => {
    const lockManualConfig: AnswerGameConfig = {
      ...config,
      wrongTileBehavior: 'lock-manual',
    };

    it('creates a virtual tile and places it as wrong/locked when value does not match', () => {
      let state = answerGameReducer(
        makeInitialState(lockManualConfig),
        {
          type: 'INIT_ROUND',
          tiles,
          zones,
        },
      );
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-abc',
        value: 'P',
        zoneIndex: 0,
      });
      expect(state.zones[0]!.placedTileId).toBe('typed-abc');
      expect(state.zones[0]!.isWrong).toBe(true);
      expect(state.zones[0]!.isLocked).toBe(true);
      expect(state.allTiles).toContainEqual({
        id: 'typed-abc',
        label: 'P',
        value: 'P',
      });
      // Virtual tile should NOT be in bankTileIds
      expect(state.bankTileIds).not.toContain('typed-abc');
      expect(state.retryCount).toBe(1);
    });

    it('creates a virtual tile as correct when value matches zone', () => {
      let state = answerGameReducer(
        makeInitialState(lockManualConfig),
        {
          type: 'INIT_ROUND',
          tiles,
          zones,
        },
      );
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-correct',
        value: 'C',
        zoneIndex: 0,
      });
      expect(state.zones[0]!.placedTileId).toBe('typed-correct');
      expect(state.zones[0]!.isWrong).toBe(false);
      expect(state.zones[0]!.isLocked).toBe(false);
      expect(state.activeSlotIndex).toBe(1);
    });

    it('replaces a wrong locked tile when typing over it', () => {
      let state = answerGameReducer(
        makeInitialState(lockManualConfig),
        {
          type: 'INIT_ROUND',
          tiles,
          zones,
        },
      );
      // Place a wrong tile first
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-1',
        value: 'X',
        zoneIndex: 0,
      });
      // Type again on the locked wrong slot — should replace
      const next = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-2',
        value: 'Y',
        zoneIndex: 0,
      });
      expect(next.zones[0]?.placedTileId).toBe('typed-2');
      // Old virtual tile cleaned up
      expect(
        next.allTiles.find((t) => t.id === 'typed-1'),
      ).toBeUndefined();
      expect(
        next.allTiles.find((t) => t.id === 'typed-2'),
      ).toBeDefined();
    });

    it('with reject behavior: increments retryCount but does not place', () => {
      const rejectConfig: AnswerGameConfig = {
        ...config,
        wrongTileBehavior: 'reject',
      };
      let state = answerGameReducer(makeInitialState(rejectConfig), {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-rej',
        value: 'Z',
        zoneIndex: 0,
      });
      expect(state.zones[0]!.placedTileId).toBeNull();
      expect(state.retryCount).toBe(1);
    });

    it('REMOVE_TILE on virtual tile: removes from allTiles, does NOT add to bank', () => {
      let state = answerGameReducer(
        makeInitialState(lockManualConfig),
        {
          type: 'INIT_ROUND',
          tiles,
          zones,
        },
      );
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-rm',
        value: 'X',
        zoneIndex: 0,
      });
      const allTilesBefore = state.allTiles.length;
      state = answerGameReducer(state, {
        type: 'REMOVE_TILE',
        zoneIndex: 0,
      });
      expect(state.zones[0]!.placedTileId).toBeNull();
      expect(state.allTiles.length).toBe(allTilesBefore - 1);
      expect(
        state.allTiles.find((t) => t.id === 'typed-rm'),
      ).toBeUndefined();
      expect(state.bankTileIds).not.toContain('typed-rm');
    });

    it('EJECT_TILE on virtual tile: removes from allTiles, does NOT add to bank', () => {
      const autoEjectConfig: AnswerGameConfig = {
        ...config,
        wrongTileBehavior: 'lock-auto-eject',
      };
      let state = answerGameReducer(makeInitialState(autoEjectConfig), {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });
      state = answerGameReducer(state, {
        type: 'TYPE_TILE',
        tileId: 'typed-ej',
        value: 'X',
        zoneIndex: 0,
      });
      state = answerGameReducer(state, {
        type: 'EJECT_TILE',
        zoneIndex: 0,
      });
      expect(state.zones[0]!.placedTileId).toBeNull();
      expect(
        state.allTiles.find((t) => t.id === 'typed-ej'),
      ).toBeUndefined();
      expect(state.bankTileIds).not.toContain('typed-ej');
    });
  });

  describe('RESUME_ROUND', () => {
    const midRoundDraft = {
      allTiles: [
        { id: 't-c', label: 'C', value: 'C' },
        { id: 't-a', label: 'A', value: 'A' },
        { id: 't-t', label: 'T', value: 'T' },
      ],
      bankTileIds: ['t-t'],
      zones: [
        {
          id: 'z0',
          index: 0,
          expectedValue: 'C',
          placedTileId: 't-c',
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'z1',
          index: 1,
          expectedValue: 'A',
          placedTileId: 't-a',
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
      ],
      activeSlotIndex: 2,
      phase: 'playing' as const,
      roundIndex: 3,
      retryCount: 2,
      levelIndex: 1,
    };

    it('replaces round state from the draft snapshot', () => {
      const state = makeInitialState(config);
      const next = answerGameReducer(state, {
        type: 'RESUME_ROUND',
        draft: midRoundDraft,
      });
      expect(next.allTiles).toEqual(midRoundDraft.allTiles);
      expect(next.bankTileIds).toEqual(midRoundDraft.bankTileIds);
      expect(next.zones).toEqual(midRoundDraft.zones);
      expect(next.activeSlotIndex).toBe(2);
      expect(next.phase).toBe('playing');
    });

    it('preserves progress counters that INIT_ROUND would reset', () => {
      // This is the whole point of the new action — a resumed session must
      // not drop `roundIndex`, `retryCount`, or `levelIndex` on re-dispatch.
      const state = makeInitialState(config);
      const next = answerGameReducer(state, {
        type: 'RESUME_ROUND',
        draft: midRoundDraft,
      });
      expect(next.roundIndex).toBe(3);
      expect(next.retryCount).toBe(2);
      expect(next.levelIndex).toBe(1);
    });

    it('keeps the existing config and clears transient drag state', () => {
      const state: AnswerGameState = {
        ...makeInitialState(config),
        dragActiveTileId: 't-dragging',
        dragHoverZoneIndex: 1,
        dragHoverBankTileId: 't-hover',
      };
      const next = answerGameReducer(state, {
        type: 'RESUME_ROUND',
        draft: midRoundDraft,
      });
      expect(next.config).toBe(config);
      expect(next.dragActiveTileId).toBeNull();
      expect(next.dragHoverZoneIndex).toBeNull();
      expect(next.dragHoverBankTileId).toBeNull();
    });
  });

  describe('REJECT_TAP', () => {
    it('increments retryCount without mutating zones or bank', () => {
      const state = answerGameReducer(makeInitialState(config), {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });

      const next = answerGameReducer(state, {
        type: 'REJECT_TAP',
        tileId: 't2',
        zoneIndex: 0,
      });

      expect(next.retryCount).toBe(state.retryCount + 1);
      expect(next.zones).toEqual(state.zones);
      expect(next.bankTileIds).toEqual(state.bankTileIds);
      expect(next.activeSlotIndex).toBe(state.activeSlotIndex);
      expect(next.phase).toBe('playing');
    });

    it('preserves existing retryCount accumulation', () => {
      let state = answerGameReducer(makeInitialState(config), {
        type: 'INIT_ROUND',
        tiles,
        zones,
      });
      state = answerGameReducer(state, {
        type: 'REJECT_TAP',
        tileId: 't2',
        zoneIndex: 0,
      });
      state = answerGameReducer(state, {
        type: 'REJECT_TAP',
        tileId: 't2',
        zoneIndex: 0,
      });

      expect(state.retryCount).toBe(2);
    });
  });
});
