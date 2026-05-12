import { assign, setup } from 'xstate';
import type {
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { GameDefinition } from '@/lib/game-engine/definition-types';

export interface WordSpellEngineContext {
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
  // NOTE (Spec Delta 3): firstActionAt and selectedSlotIds are introduced
  // in PR 1b-bis alongside the timestamp write and selectedSlotIds toggle.
  // PR 1b does not include them.
}

interface WordSpellInput {
  totalRounds: number;
  maxLevels: number | null;
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

type WordSpellEvent =
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
  | {
      type: 'CELEBRATION_DONE';
      skipMethod?: 'play-again' | 'go-home';
    }
  | { type: 'GAME_OVER' };

const findNextActiveSlot = (
  zones: AnswerZone[],
  afterIndex: number,
  fallback: number,
): number => {
  const nextEmpty = zones.findIndex(
    (z, i) => i > afterIndex && z.placedTileId === null,
  );
  if (nextEmpty !== -1) return nextEmpty;
  const anyEmpty = zones.findIndex((z) => z.placedTileId === null);
  if (anyEmpty !== -1) return anyEmpty;
  const anyWrong = zones.findIndex((z) => z.isWrong);
  if (anyWrong !== -1) return anyWrong;
  return fallback;
};

const allFilledCorrectly = (zones: AnswerZone[]): boolean =>
  zones.length > 0 &&
  zones.every((z) => z.placedTileId !== null && !z.isWrong);

const wordSpellMachine = setup({
  types: {} as {
    context: WordSpellEngineContext;
    events: WordSpellEvent;
    input: WordSpellInput;
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
      } satisfies Partial<WordSpellEngineContext>;
    }),

    resumeRound: assign(({ event }) => {
      if (event.type !== 'RESUME_ROUND') return {};
      const { draft } = event;
      // (review #3) Prefer engine's accumulated roundIndex when present.
      // WordSpell has no level mode today so the two values match, but
      // mirroring the SortNumbers contract keeps the resume path uniform
      // and forward-compatible.
      const accumulatedRoundIndex =
        draft.engineRoundIndex ?? draft.roundIndex;
      return {
        allTiles: draft.allTiles,
        bankTileIds: draft.bankTileIds,
        zones: draft.zones,
        activeSlotIndex: draft.activeSlotIndex,
        roundIndex: accumulatedRoundIndex,
        retryCount: draft.retryCount,
        levelIndex: draft.levelIndex,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    placeTile: assign(({ context, event }) => {
      if (event.type !== 'PLACE_TILE') return {};
      const tile = context.allTiles.find((t) => t.id === event.tileId);
      const zone = context.zones[event.zoneIndex];
      if (!tile || !zone) return {};

      const correct = tile.value === zone.expectedValue;
      const dragActiveTileId =
        context.dragActiveTileId === event.tileId
          ? null
          : context.dragActiveTileId;

      if (!correct && context.wrongTileBehavior === 'reject') {
        return {
          dragActiveTileId,
          retryCount: context.retryCount + 1,
        } satisfies Partial<WordSpellEngineContext>;
      }

      if (correct) {
        const previousId = zone.placedTileId;
        const prevIsVirtual = previousId?.startsWith('typed-');
        let newBankTileIds = context.bankTileIds.filter(
          (id) => id !== event.tileId,
        );
        if (
          previousId !== null &&
          previousId !== event.tileId &&
          !prevIsVirtual
        ) {
          newBankTileIds = [...newBankTileIds, previousId];
        }
        const newAllTiles = prevIsVirtual
          ? context.allTiles.filter((t) => t.id !== previousId)
          : context.allTiles;
        const newZone: AnswerZone = {
          ...zone,
          placedTileId: event.tileId,
          isWrong: false,
          isLocked: false,
        };
        const newZones = context.zones.map((z, i) =>
          i === event.zoneIndex ? newZone : z,
        );
        return {
          allTiles: newAllTiles,
          dragActiveTileId,
          zones: newZones,
          bankTileIds: newBankTileIds,
          activeSlotIndex: findNextActiveSlot(
            newZones,
            event.zoneIndex,
            context.activeSlotIndex,
          ),
        } satisfies Partial<WordSpellEngineContext>;
      }

      // Wrong, with lock-manual or lock-auto-eject.
      const previousId = zone.placedTileId;
      const prevIsVirtual = previousId?.startsWith('typed-');
      const newZone: AnswerZone = {
        ...zone,
        placedTileId: event.tileId,
        isWrong: true,
        isLocked: true,
      };
      const newZones = context.zones.map((z, i) =>
        i === event.zoneIndex ? newZone : z,
      );
      let newBankTileIds = context.bankTileIds.filter(
        (id) => id !== event.tileId,
      );
      if (
        previousId !== null &&
        previousId !== event.tileId &&
        !prevIsVirtual
      ) {
        newBankTileIds = [...newBankTileIds, previousId];
      }
      const newAllTiles = prevIsVirtual
        ? context.allTiles.filter((t) => t.id !== previousId)
        : context.allTiles;

      return {
        allTiles: newAllTiles,
        dragActiveTileId,
        zones: newZones,
        bankTileIds: newBankTileIds,
        retryCount: context.retryCount + 1,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    typeTile: assign(({ context, event }) => {
      if (event.type !== 'TYPE_TILE') return {};
      const zone = context.zones[event.zoneIndex];
      if (!zone) return {};
      if (zone.isLocked && !zone.isWrong) return {};

      const virtualTile: TileItem = {
        id: event.tileId,
        label: event.value,
        value: event.value,
      };
      const correct =
        event.value.toLowerCase() === zone.expectedValue.toLowerCase();

      if (!correct && context.wrongTileBehavior === 'reject') {
        return {
          retryCount: context.retryCount + 1,
        } satisfies Partial<WordSpellEngineContext>;
      }

      const previousId = zone.placedTileId;
      const prevIsVirtual = previousId?.startsWith('typed-');
      const baseTiles = prevIsVirtual
        ? context.allTiles.filter((t) => t.id !== previousId)
        : context.allTiles;
      let baseBankTileIds = context.bankTileIds;
      if (previousId && !prevIsVirtual) {
        baseBankTileIds = [...baseBankTileIds, previousId];
      }

      const newAllTiles = [...baseTiles, virtualTile];
      const newZone: AnswerZone = {
        ...zone,
        placedTileId: event.tileId,
        isWrong: !correct,
        isLocked: !correct,
      };
      const newZones = context.zones.map((z, i) =>
        i === event.zoneIndex ? newZone : z,
      );

      if (correct) {
        return {
          allTiles: newAllTiles,
          bankTileIds: baseBankTileIds,
          zones: newZones,
          activeSlotIndex: findNextActiveSlot(
            newZones,
            event.zoneIndex,
            context.activeSlotIndex,
          ),
        } satisfies Partial<WordSpellEngineContext>;
      }

      return {
        allTiles: newAllTiles,
        bankTileIds: baseBankTileIds,
        zones: newZones,
        retryCount: context.retryCount + 1,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    removeTile: assign(({ context, event }) => {
      if (event.type !== 'REMOVE_TILE') return {};
      const zone = context.zones[event.zoneIndex];
      if (!zone?.placedTileId) return {};
      const removedTileId = zone.placedTileId;
      const isVirtual = removedTileId.startsWith('typed-');
      return {
        dragActiveTileId:
          context.dragActiveTileId === removedTileId
            ? null
            : context.dragActiveTileId,
        allTiles: isVirtual
          ? context.allTiles.filter((t) => t.id !== removedTileId)
          : context.allTiles,
        zones: context.zones.map((z, i) =>
          i === event.zoneIndex
            ? {
                ...z,
                placedTileId: null,
                isWrong: false,
                isLocked: false,
              }
            : z,
        ),
        bankTileIds: isVirtual
          ? context.bankTileIds
          : [...context.bankTileIds, removedTileId],
        activeSlotIndex: event.zoneIndex,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    swapTiles: assign(({ context, event }) => {
      if (event.type !== 'SWAP_TILES') return {};
      const fromZone = context.zones[event.fromZoneIndex];
      const toZone = context.zones[event.toZoneIndex];
      if (!fromZone || !toZone) return {};

      const tileNowInFrom = toZone.placedTileId
        ? context.allTiles.find((t) => t.id === toZone.placedTileId)
        : null;
      const tileNowInTo = fromZone.placedTileId
        ? context.allTiles.find((t) => t.id === fromZone.placedTileId)
        : null;
      const fromCorrect = tileNowInFrom
        ? tileNowInFrom.value === fromZone.expectedValue
        : true;
      const toCorrect = tileNowInTo
        ? tileNowInTo.value === toZone.expectedValue
        : true;
      const shouldLock =
        context.wrongTileBehavior === 'lock-manual' ||
        context.wrongTileBehavior === 'lock-auto-eject';

      const newZones = context.zones.map((z, i) => {
        if (i === event.fromZoneIndex) {
          return {
            ...z,
            placedTileId: toZone.placedTileId,
            isWrong: toZone.placedTileId !== null && !fromCorrect,
            isLocked:
              toZone.placedTileId !== null &&
              !fromCorrect &&
              shouldLock,
          };
        }
        if (i === event.toZoneIndex) {
          return {
            ...z,
            placedTileId: fromZone.placedTileId,
            isWrong: fromZone.placedTileId !== null && !toCorrect,
            isLocked:
              fromZone.placedTileId !== null &&
              !toCorrect &&
              shouldLock,
          };
        }
        return z;
      });

      const dragActiveTileId =
        context.dragActiveTileId === fromZone.placedTileId
          ? null
          : context.dragActiveTileId;

      return {
        dragActiveTileId,
        zones: newZones,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    ejectTile: assign(({ context, event }) => {
      if (event.type !== 'EJECT_TILE') return {};
      const zone = context.zones[event.zoneIndex];
      if (!zone) return {};

      if (zone.placedTileId) {
        const ejectedTileId = zone.placedTileId;
        const isVirtual = ejectedTileId.startsWith('typed-');
        return {
          dragActiveTileId:
            context.dragActiveTileId === ejectedTileId
              ? null
              : context.dragActiveTileId,
          allTiles: isVirtual
            ? context.allTiles.filter((t) => t.id !== ejectedTileId)
            : context.allTiles,
          zones: context.zones.map((z, i) =>
            i === event.zoneIndex
              ? {
                  ...z,
                  placedTileId: null,
                  isWrong: false,
                  isLocked: false,
                }
              : z,
          ),
          bankTileIds: isVirtual
            ? context.bankTileIds
            : [...context.bankTileIds, ejectedTileId],
          activeSlotIndex: event.zoneIndex,
        } satisfies Partial<WordSpellEngineContext>;
      }

      return {
        zones: context.zones.map((z, i) =>
          i === event.zoneIndex
            ? {
                ...z,
                placedTileId: null,
                isWrong: false,
                isLocked: false,
              }
            : z,
        ),
        activeSlotIndex: event.zoneIndex,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    swapSlotBank: assign(({ context, event }) => {
      if (event.type !== 'SWAP_SLOT_BANK') return {};
      const zone = context.zones[event.zoneIndex];
      if (!zone?.placedTileId) return {};
      if (!context.bankTileIds.includes(event.bankTileId)) return {};

      const slotTileId = zone.placedTileId;
      const newBankTileIds = [
        ...context.bankTileIds.filter((id) => id !== event.bankTileId),
        slotTileId,
      ];
      const newZones = context.zones.map((z, i) =>
        i === event.zoneIndex
          ? {
              ...z,
              placedTileId: event.bankTileId,
              isWrong: false,
              isLocked: false,
            }
          : z,
      );
      return {
        bankTileIds: newBankTileIds,
        zones: newZones,
        dragActiveTileId: null,
        dragHoverBankTileId: null,
      } satisfies Partial<WordSpellEngineContext>;
    }),

    setActiveSlot: assign(({ context, event }) => {
      if (event.type !== 'SET_ACTIVE_SLOT') return {};
      const clamped = Math.max(
        0,
        Math.min(event.zoneIndex, context.zones.length - 1),
      );
      return { activeSlotIndex: clamped };
    }),

    rejectTap: assign(({ context }) => ({
      retryCount: context.retryCount + 1,
    })),

    selectSlot: assign(() => ({})), // PR 1b-bis placeholder (no-op in PR 1b)

    setDragActive: assign(({ context, event }) => {
      if (event.type !== 'SET_DRAG_ACTIVE') return {};
      return {
        dragActiveTileId: event.tileId,
        dragHoverZoneIndex:
          event.tileId === null ? null : context.dragHoverZoneIndex,
        dragHoverBankTileId:
          event.tileId === null ? null : context.dragHoverBankTileId,
      };
    }),

    setDragHover: assign(({ event }) => {
      if (event.type !== 'SET_DRAG_HOVER') return {};
      return { dragHoverZoneIndex: event.zoneIndex };
    }),

    setDragHoverBank: assign(({ event }) => {
      if (event.type !== 'SET_DRAG_HOVER_BANK') return {};
      return { dragHoverBankTileId: event.tileId };
    }),

    incrementRoundIndex: assign(({ context }) => ({
      roundIndex: context.roundIndex + 1,
    })),

    advanceRoundState: assign(({ event }) => {
      if (event.type !== 'ADVANCE_ROUND') return {};
      return {
        allTiles: event.tiles,
        bankTileIds: event.tiles.map((t) => t.id),
        zones: event.zones,
        activeSlotIndex: 0,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
        retryCount: 0,
      } satisfies Partial<WordSpellEngineContext>;
    }),
  },
}).createMachine({
  id: 'word-spell',
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
    // Root-level GAME_OVER is defense-in-depth: any state can fall through
    // to gameOver. INIT_ROUND / RESUME_ROUND used to live here too, but a
    // stray dispatch from celebration phases (`roundComplete` /
    // `waitingForNext` / `gameOver`) would silently reset `roundIndex` to
    // 0. Scope them to `playing` instead — the AnswerGameProvider mount
    // effect only fires once when the machine is in its initial `playing`
    // state, so the legitimate paths still work. (review #2)
    GAME_OVER: { target: '.gameOver' },
  },
  states: {
    playing: {
      always: [
        { guard: 'allFilledCorrectly', target: 'roundComplete' },
      ],
      on: {
        INIT_ROUND: { actions: 'initRound' },
        RESUME_ROUND: { actions: 'resumeRound' },
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
          { target: 'waitingForNext' },
        ],
      },
      on: {
        CELEBRATION_DONE: [
          { guard: 'isLastRound', target: 'gameOver' },
          { target: 'waitingForNext' },
        ],
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

export const wordSpellDefinition: GameDefinition = {
  id: 'word-spell',
  interaction: 'drag-to-slot',
  // PR 1a Spec Delta 6 continues: passthrough; round construction stays in
  // the React component (buildSentenceGapRound / buildTilesAndZones in
  // WordSpell.tsx). PR 1c lifts it into definition.ts.
  buildRound: (ctx) => ({ roundIndex: ctx.roundIndex }),
  machine: wordSpellMachine,
};
