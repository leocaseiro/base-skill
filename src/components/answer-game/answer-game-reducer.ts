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
    phase: 'playing',
    roundIndex: 0,
    retryCount: 0,
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

      if (!correct && state.config.wrongTileBehavior === 'reject') {
        return { ...state, retryCount: state.retryCount + 1 };
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
        return {
          ...state,
          zones: newZones,
          bankTileIds: newBankTileIds,
          activeSlotIndex:
            nextActiveSlot === -1
              ? state.activeSlotIndex
              : nextActiveSlot,
          retryCount: state.retryCount,
          phase: allFilledCorrectly ? 'round-complete' : 'playing',
        };
      }

      const lockManual =
        state.config.wrongTileBehavior === 'lock-manual';
      const newZone: AnswerZone = {
        ...zone,
        placedTileId: lockManual ? action.tileId : zone.placedTileId,
        isWrong: true,
        isLocked: true,
      };
      const newZones = state.zones.map((z, i) =>
        i === action.zoneIndex ? newZone : z,
      );
      const newBankTileIds = lockManual
        ? state.bankTileIds.filter((id) => id !== action.tileId)
        : state.bankTileIds;

      return {
        ...state,
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
        bankTileIds: [...state.bankTileIds, zone.placedTileId],
      };
    }

    case 'SWAP_TILES': {
      const fromZone = state.zones[action.fromZoneIndex];
      const toZone = state.zones[action.toZoneIndex];
      if (!fromZone || !toZone) return state;
      return {
        ...state,
        zones: state.zones.map((z, i) => {
          if (i === action.fromZoneIndex)
            return { ...z, placedTileId: toZone.placedTileId };
          if (i === action.toZoneIndex)
            return { ...z, placedTileId: fromZone.placedTileId };
          return z;
        }),
      };
    }

    case 'EJECT_TILE': {
      const zone = state.zones[action.zoneIndex];
      if (!zone) return state;

      if (zone.placedTileId) {
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
          bankTileIds: [...state.bankTileIds, zone.placedTileId],
        };
      }

      if (zone.isWrong || zone.isLocked) {
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

      return state;
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

    case 'COMPLETE_GAME': {
      return { ...state, phase: 'game-over' };
    }

    case 'SET_DRAG_ACTIVE': {
      return { ...state, dragActiveTileId: action.tileId };
    }

    default: {
      return state;
    }
  }
}
