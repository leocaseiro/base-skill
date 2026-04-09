import type {
  AnswerGameAction,
  AnswerGameConfig,
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
        let newBankTileIds = state.bankTileIds.filter(
          (id) => id !== action.tileId,
        );
        if (previousId !== null && previousId !== action.tileId) {
          // Bank tile dropped on an occupied slot: previous occupant returns to bank.
          newBankTileIds = [...newBankTileIds, previousId];
        }
        const newZone: AnswerZone = {
          ...zone,
          placedTileId: action.tileId,
          isWrong: false,
          isLocked: false,
        };
        const newZones = state.zones.map((z, i) =>
          i === action.zoneIndex ? newZone : z,
        );
        const nextActiveSlot = newZones.findIndex(
          (z, i) => i > action.zoneIndex && z.placedTileId === null,
        );
        const allFilledCorrectly = newZones.every(
          (z) => z.placedTileId !== null && !z.isWrong,
        );
        const isLastRound =
          state.roundIndex >= state.config.totalRounds - 1;
        return {
          ...state,
          dragActiveTileId,
          zones: newZones,
          bankTileIds: newBankTileIds,
          activeSlotIndex:
            nextActiveSlot === -1
              ? state.activeSlotIndex
              : nextActiveSlot,
          retryCount: state.retryCount,
          phase: allFilledCorrectly
            ? isLastRound
              ? 'game-over'
              : 'round-complete'
            : 'playing',
        };
      }

      const shouldLock =
        state.config.wrongTileBehavior === 'lock-manual' ||
        state.config.wrongTileBehavior === 'lock-auto-eject';
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
        zone.placedTileId &&
        zone.placedTileId !== action.tileId
      ) {
        newBankTileIds = [...newBankTileIds, zone.placedTileId];
      }

      return {
        ...state,
        dragActiveTileId,
        zones: newZones,
        bankTileIds: newBankTileIds,
        activeSlotIndex: state.activeSlotIndex,
        retryCount: state.retryCount + 1,
        phase: 'playing',
      };
    }

    case 'REMOVE_TILE': {
      const zone = state.zones[action.zoneIndex];
      if (!zone?.placedTileId) return state;
      const removedTileId = zone.placedTileId;
      return {
        ...state,
        dragActiveTileId:
          state.dragActiveTileId === removedTileId
            ? null
            : state.dragActiveTileId,
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
        bankTileIds: [...state.bankTileIds, removedTileId],
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
      const isLastRound =
        state.roundIndex >= state.config.totalRounds - 1;

      return {
        ...state,
        dragActiveTileId,
        zones: newZones,
        phase: allFilledCorrectly
          ? isLastRound
            ? 'game-over'
            : 'round-complete'
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
        return {
          ...state,
          // If the ejected tile was mid-drag, clear drag state so the bank
          // hole disappears immediately rather than waiting for the drag to end.
          dragActiveTileId:
            state.dragActiveTileId === ejectedTileId
              ? null
              : state.dragActiveTileId,
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
          bankTileIds: [...state.bankTileIds, ejectedTileId],
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
        retryCount: 0,
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

    default: {
      return state;
    }
  }
}
