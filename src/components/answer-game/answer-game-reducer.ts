import type {
  AnswerGameAction,
  AnswerGameConfig,
  AnswerGamePhase,
  AnswerGameState,
  AnswerZone,
  TileItem,
} from './types';

export function makeInitialState(
  config: AnswerGameConfig,
): AnswerGameState {
  return {
    config,
    allTiles: [],
    bankTileIds: [],
    zones: [],
    activeSlotIndex: 0,
    dragActiveTileId: null,
    dragHoverZoneIndex: null,
    dragHoverBankTileId: null,
    phase: 'playing',
    roundIndex: 0,
    retryCount: 0,
    levelIndex: 0,
    isLevelMode: config.levelMode !== undefined,
  };
}

/**
 * Find the best next activeSlotIndex after a placement or removal.
 * Priority: first empty slot after `afterIndex`, then first empty slot
 * anywhere, then first wrong slot anywhere. Returns `fallback` when every
 * slot is correctly filled.
 */
function findNextActiveSlot(
  zones: AnswerZone[],
  afterIndex: number,
  fallback: number,
): number {
  // 1. First empty slot after the current action
  const nextEmpty = zones.findIndex(
    (z, i) => i > afterIndex && z.placedTileId === null,
  );
  if (nextEmpty !== -1) return nextEmpty;

  // 2. First empty slot anywhere (wraps around)
  const anyEmpty = zones.findIndex((z) => z.placedTileId === null);
  if (anyEmpty !== -1) return anyEmpty;

  // 3. First wrong slot anywhere (so user can retype)
  const anyWrong = zones.findIndex((z) => z.isWrong);
  if (anyWrong !== -1) return anyWrong;

  return fallback;
}

function resolveCompletionPhase(
  state: AnswerGameState,
): AnswerGamePhase {
  const isLastRound = state.roundIndex >= state.config.totalRounds - 1;
  if (!isLastRound) return 'round-complete';
  if (!state.isLevelMode) return 'game-over';
  const maxLevels = state.config.levelMode?.maxLevels;
  if (maxLevels && state.levelIndex + 1 >= maxLevels)
    return 'game-over';
  return 'level-complete';
}

export function answerGameReducer(
  state: AnswerGameState,
  action: AnswerGameAction,
): AnswerGameState {
  switch (action.type) {
    case 'INIT_ROUND': {
      return {
        ...state,
        allTiles: action.tiles,
        bankTileIds: action.tiles.map((t: TileItem) => t.id),
        zones: action.zones,
        activeSlotIndex: 0,
        phase: 'playing',
        roundIndex: 0,
        retryCount: 0,
      };
    }

    case 'RESUME_ROUND': {
      const { draft } = action;
      return {
        ...state,
        allTiles: draft.allTiles,
        bankTileIds: draft.bankTileIds,
        zones: draft.zones,
        activeSlotIndex: draft.activeSlotIndex,
        phase: draft.phase,
        roundIndex: draft.roundIndex,
        retryCount: draft.retryCount,
        levelIndex: draft.levelIndex,
        dragActiveTileId: null,
        dragHoverZoneIndex: null,
        dragHoverBankTileId: null,
      };
    }

    case 'REJECT_TAP': {
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };
    }

    case 'PLACE_TILE': {
      const tile = state.allTiles.find((t) => t.id === action.tileId);
      const zone = state.zones[action.zoneIndex];
      if (!tile || !zone) return state;

      const correct = tile.value === zone.expectedValue;

      // A tile placement always ends any active drag for that tile.
      const dragActiveTileId =
        state.dragActiveTileId === action.tileId
          ? null
          : state.dragActiveTileId;

      if (!correct && state.config.wrongTileBehavior === 'reject') {
        return {
          ...state,
          dragActiveTileId,
          retryCount: state.retryCount + 1,
        };
      }

      if (correct) {
        const previousId = zone.placedTileId;
        const prevIsVirtual = previousId?.startsWith('typed-');
        let newBankTileIds = state.bankTileIds.filter(
          (id) => id !== action.tileId,
        );
        if (
          previousId !== null &&
          previousId !== action.tileId && // Virtual tiles are discarded; real tiles return to the bank.
          !prevIsVirtual
        ) {
          newBankTileIds = [...newBankTileIds, previousId];
        }
        // Remove displaced virtual tile from allTiles
        const newAllTiles = prevIsVirtual
          ? state.allTiles.filter((t) => t.id !== previousId)
          : state.allTiles;
        const newZone: AnswerZone = {
          ...zone,
          placedTileId: action.tileId,
          isWrong: false,
          isLocked: false,
        };
        const newZones =
          newAllTiles === state.allTiles
            ? state.zones.map((z, i) =>
                i === action.zoneIndex ? newZone : z,
              )
            : state.zones.map((z, i) =>
                i === action.zoneIndex ? newZone : z,
              );
        const allFilledCorrectly = newZones.every(
          (z) => z.placedTileId !== null && !z.isWrong,
        );
        return {
          ...state,
          allTiles: newAllTiles,
          dragActiveTileId,
          zones: newZones,
          bankTileIds: newBankTileIds,
          activeSlotIndex: findNextActiveSlot(
            newZones,
            action.zoneIndex,
            state.activeSlotIndex,
          ),
          retryCount: state.retryCount,
          phase: allFilledCorrectly
            ? resolveCompletionPhase(state)
            : 'playing',
        };
      }

      const shouldLock =
        state.config.wrongTileBehavior === 'lock-manual' ||
        state.config.wrongTileBehavior === 'lock-auto-eject';
      const previousId = zone.placedTileId;
      const prevIsVirtual = previousId?.startsWith('typed-');
      const newZone: AnswerZone = {
        ...zone,
        placedTileId: shouldLock ? action.tileId : zone.placedTileId,
        isWrong: true,
        isLocked: true,
      };
      const newZones = state.zones.map((z, i) =>
        i === action.zoneIndex ? newZone : z,
      );
      let newBankTileIds = shouldLock
        ? state.bankTileIds.filter((id) => id !== action.tileId)
        : state.bankTileIds;
      if (
        shouldLock &&
        previousId &&
        previousId !== action.tileId && // Virtual tiles are discarded; real tiles return to the bank.
        !prevIsVirtual
      ) {
        newBankTileIds = [...newBankTileIds, previousId];
      }
      // Remove displaced virtual tile from allTiles
      const newAllTiles =
        shouldLock && prevIsVirtual
          ? state.allTiles.filter((t) => t.id !== previousId)
          : state.allTiles;

      return {
        ...state,
        allTiles: newAllTiles,
        dragActiveTileId,
        zones: newZones,
        bankTileIds: newBankTileIds,
        activeSlotIndex: state.activeSlotIndex,
        retryCount: state.retryCount + 1,
        phase: 'playing',
      };
    }

    case 'TYPE_TILE': {
      const zone = state.zones[action.zoneIndex];
      if (!zone) return state;
      // Allow typing over wrong locked tiles to replace them;
      // only block correctly-locked tiles (shouldn't exist, but be safe).
      if (zone.isLocked && !zone.isWrong) return state;

      const virtualTile: TileItem = {
        id: action.tileId,
        label: action.value,
        value: action.value,
      };
      const correct =
        action.value.toLowerCase() === zone.expectedValue.toLowerCase();

      if (!correct && state.config.wrongTileBehavior === 'reject') {
        return {
          ...state,
          retryCount: state.retryCount + 1,
        };
      }

      // Clean up the previous wrong virtual tile being replaced
      const previousId = zone.placedTileId;
      const prevIsVirtual = previousId?.startsWith('typed-');
      const baseTiles = prevIsVirtual
        ? state.allTiles.filter((t) => t.id !== previousId)
        : state.allTiles;
      // If replacing a real (non-virtual) tile, return it to the bank
      let baseBankTileIds = state.bankTileIds;
      if (previousId && !prevIsVirtual) {
        baseBankTileIds = [...baseBankTileIds, previousId];
      }

      const newAllTiles = [...baseTiles, virtualTile];
      const newZone: AnswerZone = {
        ...zone,
        placedTileId: action.tileId,
        isWrong: !correct,
        isLocked: !correct,
      };
      const newZones = state.zones.map((z, i) =>
        i === action.zoneIndex ? newZone : z,
      );

      if (correct) {
        const allFilledCorrectly = newZones.every(
          (z) => z.placedTileId !== null && !z.isWrong,
        );
        return {
          ...state,
          allTiles: newAllTiles,
          bankTileIds: baseBankTileIds,
          zones: newZones,
          activeSlotIndex: findNextActiveSlot(
            newZones,
            action.zoneIndex,
            state.activeSlotIndex,
          ),
          phase: allFilledCorrectly
            ? resolveCompletionPhase(state)
            : 'playing',
        };
      }

      return {
        ...state,
        allTiles: newAllTiles,
        bankTileIds: baseBankTileIds,
        zones: newZones,
        activeSlotIndex: state.activeSlotIndex,
        retryCount: state.retryCount + 1,
        phase: 'playing',
      };
    }

    case 'REMOVE_TILE': {
      const zone = state.zones[action.zoneIndex];
      if (!zone?.placedTileId) return state;
      const removedTileId = zone.placedTileId;
      // Virtual tiles (created by TYPE_TILE) are removed from allTiles
      // and NOT returned to the bank.
      const isVirtual = removedTileId.startsWith('typed-');
      return {
        ...state,
        dragActiveTileId:
          state.dragActiveTileId === removedTileId
            ? null
            : state.dragActiveTileId,
        allTiles: isVirtual
          ? state.allTiles.filter((t) => t.id !== removedTileId)
          : state.allTiles,
        zones: state.zones.map((z, i) =>
          i === action.zoneIndex
            ? {
                ...z,
                placedTileId: null,
                isWrong: false,
                isLocked: false,
              }
            : z,
        ),
        bankTileIds: isVirtual
          ? state.bankTileIds
          : [...state.bankTileIds, removedTileId],
        // Move cursor to the cleared slot so the user can retype
        activeSlotIndex: action.zoneIndex,
      };
    }

    case 'SWAP_TILES': {
      const fromZone = state.zones[action.fromZoneIndex];
      const toZone = state.zones[action.toZoneIndex];
      if (!fromZone || !toZone) return state;

      // After the swap: fromZone gets toZone's tile, toZone gets fromZone's tile.
      // Either zone may become empty (null) when moving a tile to an empty slot.
      const tileNowInFrom = toZone.placedTileId
        ? state.allTiles.find((t) => t.id === toZone.placedTileId)
        : null;
      const tileNowInTo = fromZone.placedTileId
        ? state.allTiles.find((t) => t.id === fromZone.placedTileId)
        : null;
      // An empty zone is never wrong.
      const fromCorrect = tileNowInFrom
        ? tileNowInFrom.value === fromZone.expectedValue
        : true;
      const toCorrect = tileNowInTo
        ? tileNowInTo.value === toZone.expectedValue
        : true;
      const shouldLock =
        state.config.wrongTileBehavior === 'lock-manual' ||
        state.config.wrongTileBehavior === 'lock-auto-eject';

      const newZones = state.zones.map((z, i) => {
        if (i === action.fromZoneIndex)
          return {
            ...z,
            placedTileId: toZone.placedTileId,
            isWrong: toZone.placedTileId !== null && !fromCorrect,
            isLocked:
              toZone.placedTileId !== null &&
              !fromCorrect &&
              shouldLock,
          };
        if (i === action.toZoneIndex)
          return {
            ...z,
            placedTileId: fromZone.placedTileId,
            isWrong: fromZone.placedTileId !== null && !toCorrect,
            isLocked:
              fromZone.placedTileId !== null &&
              !toCorrect &&
              shouldLock,
          };
        return z;
      });

      // Clear drag state for the tile that just finished dragging.
      const dragActiveTileId =
        state.dragActiveTileId === fromZone.placedTileId
          ? null
          : state.dragActiveTileId;

      const allFilledCorrectly = newZones.every(
        (z) => z.placedTileId !== null && !z.isWrong,
      );

      return {
        ...state,
        dragActiveTileId,
        zones: newZones,
        phase: allFilledCorrectly
          ? resolveCompletionPhase(state)
          : 'playing',
      };
    }

    case 'EJECT_TILE': {
      const zone = state.zones[action.zoneIndex];
      if (!zone) return state;

      // Guard: never eject a correctly-placed tile (isWrong=false, isLocked=false)
      if (!zone.isWrong && !zone.isLocked) return state;

      if (zone.placedTileId) {
        const ejectedTileId = zone.placedTileId;
        const isVirtual = ejectedTileId.startsWith('typed-');
        return {
          ...state,
          // If the ejected tile was mid-drag, clear drag state so the bank
          // hole disappears immediately rather than waiting for the drag to end.
          dragActiveTileId:
            state.dragActiveTileId === ejectedTileId
              ? null
              : state.dragActiveTileId,
          allTiles: isVirtual
            ? state.allTiles.filter((t) => t.id !== ejectedTileId)
            : state.allTiles,
          zones: state.zones.map((z, i) =>
            i === action.zoneIndex
              ? {
                  ...z,
                  placedTileId: null,
                  isWrong: false,
                  isLocked: false,
                }
              : z,
          ),
          bankTileIds: isVirtual
            ? state.bankTileIds
            : [...state.bankTileIds, ejectedTileId],
          // Move cursor to the ejected slot
          activeSlotIndex: action.zoneIndex,
        };
      }

      return {
        ...state,
        zones: state.zones.map((z, i) =>
          i === action.zoneIndex
            ? {
                ...z,
                placedTileId: null,
                isWrong: false,
                isLocked: false,
              }
            : z,
        ),
        // Move cursor to the ejected slot
        activeSlotIndex: action.zoneIndex,
      };
    }

    case 'ADVANCE_ROUND': {
      return {
        ...state,
        allTiles: action.tiles,
        bankTileIds: action.tiles.map((t: TileItem) => t.id),
        zones: action.zones,
        activeSlotIndex: 0,
        phase: 'playing',
        roundIndex: state.roundIndex + 1,
        retryCount: 0,
      };
    }

    case 'ADVANCE_LEVEL': {
      return {
        ...state,
        allTiles: action.tiles,
        bankTileIds: action.tiles.map((t: TileItem) => t.id),
        zones: action.zones,
        activeSlotIndex: 0,
        phase: 'playing',
        roundIndex: 0,
        levelIndex: state.levelIndex + 1,
      };
    }

    case 'COMPLETE_GAME': {
      return { ...state, phase: 'game-over' };
    }

    case 'SET_DRAG_ACTIVE': {
      return {
        ...state,
        dragActiveTileId: action.tileId,
        dragHoverZoneIndex:
          action.tileId === null ? null : state.dragHoverZoneIndex,
        dragHoverBankTileId:
          action.tileId === null ? null : state.dragHoverBankTileId,
      };
    }

    case 'SET_DRAG_HOVER': {
      return { ...state, dragHoverZoneIndex: action.zoneIndex };
    }

    case 'SET_DRAG_HOVER_BANK': {
      return { ...state, dragHoverBankTileId: action.tileId };
    }

    case 'SWAP_SLOT_BANK': {
      const zone = state.zones[action.zoneIndex];
      if (!zone?.placedTileId) return state;
      if (!state.bankTileIds.includes(action.bankTileId)) return state;

      const slotTileId = zone.placedTileId;
      const newBankTileIds = [
        ...state.bankTileIds.filter((id) => id !== action.bankTileId),
        slotTileId,
      ];
      const newZones = state.zones.map((z, i) =>
        i === action.zoneIndex
          ? {
              ...z,
              placedTileId: action.bankTileId,
              isWrong: false,
              isLocked: false,
            }
          : z,
      );
      return {
        ...state,
        bankTileIds: newBankTileIds,
        zones: newZones,
        dragActiveTileId: null,
        dragHoverBankTileId: null,
      };
    }

    case 'SET_ACTIVE_SLOT': {
      const clamped = Math.max(
        0,
        Math.min(action.zoneIndex, state.zones.length - 1),
      );
      return { ...state, activeSlotIndex: clamped };
    }

    default: {
      return state;
    }
  }
}
