export interface AnswerGameConfig {
  gameId: string;
  /** @default 'drag' */
  inputMethod: 'drag' | 'type' | 'both';
  /** @default 'lock-auto-eject' */
  wrongTileBehavior: 'reject' | 'lock-manual' | 'lock-auto-eject';
  tileBankMode: 'exact' | 'distractors';
  distractorCount?: number;
  /** Total number of rounds in this session */
  totalRounds: number;
  /**
   * When `true`, rounds follow the order of `rounds` in config.
   * When `false` or omitted, order is shuffled once per session (again after Play again).
   */
  roundsInOrder?: boolean;
  /** Whether TTS is enabled for this profile */
  ttsEnabled: boolean;
  /**
   * Controls the OS keyboard type shown on touch devices in type/both mode.
   * @default 'text'
   */
  touchKeyboardInputMode?: 'text' | 'numeric' | 'none';
  /** When set, `AnswerGameProvider` dispatches `INIT_ROUND` on mount / game change */
  initialTiles?: TileItem[];
  initialZones?: AnswerZone[];
}

export interface TileItem {
  id: string;
  /** Display label shown on the tile (e.g. "A", "cat", "3") */
  label: string;
  /** Semantic value used for evaluation — matches `AnswerZone.expectedValue` */
  value: string;
}

export interface AnswerZone {
  id: string;
  index: number;
  /** Correct tile value for this slot; matched against `TileItem.value` */
  expectedValue: string;
  placedTileId: string | null;
  isWrong: boolean;
  isLocked: boolean;
}

export type AnswerGamePhase =
  | 'playing'
  | 'round-complete'
  | 'game-over';

export interface AnswerGameState {
  config: AnswerGameConfig;
  /** Full tile list for the current round — never mutated mid-round */
  allTiles: TileItem[];
  /** IDs of tiles currently visible in the choice bank */
  bankTileIds: string[];
  zones: AnswerZone[];
  /** Index of next slot to fill in auto-next-slot mode */
  activeSlotIndex: number;
  dragActiveTileId: string | null;
  phase: AnswerGamePhase;
  roundIndex: number;
  retryCount: number;
}

export type AnswerGameAction =
  | { type: 'INIT_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'PLACE_TILE'; tileId: string; zoneIndex: number }
  | { type: 'REMOVE_TILE'; zoneIndex: number }
  | { type: 'SWAP_TILES'; fromZoneIndex: number; toZoneIndex: number }
  | { type: 'EJECT_TILE'; zoneIndex: number }
  | { type: 'ADVANCE_ROUND'; tiles: TileItem[]; zones: AnswerZone[] }
  | { type: 'COMPLETE_GAME' }
  | { type: 'SET_DRAG_ACTIVE'; tileId: string | null };

/**
 * Snapshot of AnswerGameState persisted to session_history_index.draftState.
 * Excludes config (reconstructable from initialContent/initialState),
 * dragActiveTileId (transient), and 'game-over' phase (cleared on completion).
 */
export interface AnswerGameDraftState {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  phase: 'playing' | 'round-complete';
  roundIndex: number;
  retryCount: number;
}
