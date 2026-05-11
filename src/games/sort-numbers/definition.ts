import { assign, setup } from 'xstate';
import type {
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { GameDefinition } from '@/lib/game-engine/definition-types';

export interface SortNumbersEngineContext {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  dragActiveTileId: string | null;
  dragHoverZoneIndex: number | null;
  dragHoverBankTileId: string | null;
  retryCount: number;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  isLevelMode: boolean;
  // NOTE (Spec Delta 3): firstActionAt and selectedSlotIds land in PR 1b-bis
  // alongside the timestamp write and selectedSlotIds toggle.
}

interface SortNumbersInput {
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

type SortNumbersEvent =
  | { type: 'INIT_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'RESUME_ROUND'; draft: AnswerGameDraftState }
  | { type: 'PLACE_TILE'; tileId: string; zoneIndex: number }
  | {
      type: 'TYPE_TILE';
      tileId: string;
      value: string;
      zoneIndex: number;
    }
  | { type: 'REMOVE_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_TILES';
      fromZoneIndex: number;
      toZoneIndex: number;
    }
  | { type: 'EJECT_TILE'; zoneIndex: number }
  | {
      type: 'SWAP_SLOT_BANK';
      zoneIndex: number;
      bankTileId: string;
    }
  | { type: 'SET_ACTIVE_SLOT'; zoneIndex: number }
  | { type: 'REJECT_TAP'; tileId: string; zoneIndex: number }
  | { type: 'SELECT_SLOT'; zoneIndex: number }
  | { type: 'SET_DRAG_ACTIVE'; tileId: string | null }
  | { type: 'SET_DRAG_HOVER'; zoneIndex: number | null }
  | { type: 'SET_DRAG_HOVER_BANK'; tileId: string | null }
  | { type: 'ADVANCE_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'ADVANCE_LEVEL'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'COMPLETE_GAME' }
  | {
      type: 'CELEBRATION_DONE';
      skipMethod?: 'play-again' | 'go-home';
    }
  | { type: 'GAME_OVER' };

// findNextActiveSlot is introduced in Task 7 alongside the placeTile,
// removeTile, ejectTile, and typeTile assign-action bodies that use it.

const allFilledCorrectly = (zones: AnswerZone[]): boolean =>
  zones.length > 0 &&
  zones.every((z) => z.placedTileId !== null && !z.isWrong);

const sortNumbersMachine = setup({
  types: {} as {
    context: SortNumbersEngineContext;
    events: SortNumbersEvent;
    input: SortNumbersInput;
  },
  guards: {
    // In-definition guards: real bodies (not overridden by engine).
    allFilledCorrectly: ({ context }) =>
      allFilledCorrectly(context.zones),
    canEject: ({ context, event }) => {
      if (event.type !== 'EJECT_TILE') return false;
      const zone = context.zones[event.zoneIndex];
      if (!zone) return false;
      return zone.isWrong || zone.isLocked;
    },
    // Engine-injected guard placeholders (overridden by useGameEngine.provide).
    isLastRound: () => false,
    isMidLevelRound: () => false,
    isLastRoundOfLevel: () => false,
  },
  actions: {
    // Engine-injected action placeholders (overridden by useGameEngine.provide).
    speak: (_, _params: { lifecycleEvent: string }) => {},
    playSound: (_, _params: { sound: string }) => {},
    completeGame: () => {},
    emit: (_, _params: { event: unknown }) => {},

    initRound: assign(({ event }) => {
      if (event.type !== 'INIT_ROUND') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
        roundIndex: 0,
      } satisfies Partial<SortNumbersEngineContext>;
    }),

    // STUBS — Task 7 fills these in by porting from NumberMatch.
    resumeRound: assign(() => ({})),
    placeTile: assign(() => ({})),
    typeTile: assign(() => ({})),
    removeTile: assign(() => ({})),
    swapTiles: assign(() => ({})),
    ejectTile: assign(() => ({})),
    swapSlotBank: assign(() => ({})),
    setActiveSlot: assign(() => ({})),
    rejectTap: assign(() => ({})),
    selectSlot: assign(() => ({})),
    setDragActive: assign(() => ({})),
    setDragHover: assign(() => ({})),
    setDragHoverBank: assign(() => ({})),
    incrementRoundIndex: assign(() => ({})),
    advanceRoundState: assign(() => ({})),

    // SortNumbers-specific.
    incrementLevelIndex: assign(({ context }) => ({
      levelIndex: context.levelIndex + 1,
    })),
    advanceLevelState: assign(({ event }) => {
      if (event.type !== 'ADVANCE_LEVEL') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
        roundIndex: 0,
      } satisfies Partial<SortNumbersEngineContext>;
    }),
  },
}).createMachine({
  id: 'sort-numbers',
  initial: 'playing',
  context: ({ input }) => ({
    allTiles: [],
    bankTileIds: [],
    zones: [],
    activeSlotIndex: 0,
    dragActiveTileId: null,
    dragHoverZoneIndex: null,
    dragHoverBankTileId: null,
    retryCount: 0,
    roundIndex: 0,
    levelIndex: 0,
    totalRounds: input.totalRounds,
    maxLevels: input.maxLevels,
    wrongTileBehavior: input.wrongTileBehavior,
    isLevelMode: input.maxLevels !== null,
  }),
  on: {
    INIT_ROUND: { actions: 'initRound' },
    RESUME_ROUND: { actions: 'resumeRound' },
    GAME_OVER: { target: '.gameOver' },
    COMPLETE_GAME: { target: '.gameOver' },
  },
  states: {
    playing: {
      always: [
        { guard: 'allFilledCorrectly', target: 'roundComplete' },
      ],
      on: {
        PLACE_TILE: { actions: 'placeTile' },
        TYPE_TILE: { actions: 'typeTile' },
        REMOVE_TILE: { actions: 'removeTile' },
        SWAP_TILES: { actions: 'swapTiles' },
        EJECT_TILE: { guard: 'canEject', actions: 'ejectTile' },
        SWAP_SLOT_BANK: { actions: 'swapSlotBank' },
        SET_ACTIVE_SLOT: { actions: 'setActiveSlot' },
        REJECT_TAP: { actions: 'rejectTap' },
        SELECT_SLOT: { actions: 'selectSlot' },
        SET_DRAG_ACTIVE: { actions: 'setDragActive' },
        SET_DRAG_HOVER: { actions: 'setDragHover' },
        SET_DRAG_HOVER_BANK: { actions: 'setDragHoverBank' },
      },
    },
    roundComplete: {
      entry: [
        { type: 'playSound', params: { sound: 'round-complete' } },
      ],
      after: {
        // TODO(PR 1c): wire from useGameEngine options to restore
        // skin.timing.roundAdvanceDelay and config.timing.roundAdvanceDelay overrides.
        750: [
          { guard: 'isLastRound', target: 'gameOver' },
          { guard: 'isLastRoundOfLevel', target: 'levelComplete' },
          { target: 'waitingForNext' },
        ],
      },
      on: {
        CELEBRATION_DONE: [
          { guard: 'isLastRound', target: 'gameOver' },
          { guard: 'isLastRoundOfLevel', target: 'levelComplete' },
          { target: 'waitingForNext' },
        ],
      },
    },
    levelComplete: {
      entry: [
        { type: 'playSound', params: { sound: 'level-complete' } },
      ],
      on: {
        ADVANCE_LEVEL: {
          actions: ['incrementLevelIndex', 'advanceLevelState'],
          target: 'playing',
        },
      },
    },
    waitingForNext: {
      on: {
        ADVANCE_ROUND: {
          actions: ['incrementRoundIndex', 'advanceRoundState'],
          target: 'playing',
        },
      },
    },
    gameOver: {
      entry: [
        { type: 'playSound', params: { sound: 'game-complete' } },
        { type: 'speak', params: { lifecycleEvent: 'game.over' } },
        'completeGame',
      ],
    },
  },
});

export const sortNumbersDefinition: GameDefinition = {
  id: 'sort-numbers',
  interaction: 'drag-to-slot',
  // PR 1b Spec Delta 4: passthrough; round construction stays in the React
  // component (buildSortRound in SortNumbers.tsx). PR 1c may lift it into
  // definition.ts once all games are migrated.
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  machine: sortNumbersMachine,
};
