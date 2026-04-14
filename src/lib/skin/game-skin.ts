import type { ComponentType, ReactNode } from 'react';

export interface GameSkinTiming {
  /** ms between round-complete and ADVANCE_ROUND. Default: 750 */
  roundAdvanceDelay?: number;
  /** ms between wrong-tile lock and EJECT_TILE. Default: 1000 */
  autoEjectDelay?: number;
  /** ms between level-complete and LevelCompleteOverlay. Default: 750 */
  levelCompleteDelay?: number;
}

export interface GameSkinZoneSnapshot {
  isLocked: boolean;
  isWrong: boolean;
  placedTileId: string | null;
}

export interface GameSkinTileSnapshot {
  id: string;
  label: string;
  value: string;
}

export interface GameSkinCelebrationOverlayProps {
  retryCount: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export interface GameSkinLevelCompleteOverlayProps {
  level: number;
  onNextLevel: () => void;
  onDone: () => void;
}

export interface GameSkin {
  /** Unique identifier, e.g. 'dino-eggs' */
  id: string;
  /** Display name for UI */
  name: string;

  /** CSS custom property overrides applied on the game container */
  tokens: Record<string, string>;

  /** When true, engine suppresses default correct/wrong sound effects. */
  suppressDefaultSounds?: boolean;

  /** Timing overrides for engine delays. */
  timing?: GameSkinTiming;

  // ── Event Callbacks (fire-and-forget) ─────────────────────────
  onCorrectPlace?: (zoneIndex: number, tileValue: string) => void;
  onWrongPlace?: (zoneIndex: number, tileValue: string) => void;
  onTileEjected?: (zoneIndex: number) => void;
  onDragStart?: (tileId: string) => void;
  onDragOverZone?: (zoneIndex: number) => void;
  onRoundComplete?: (roundIndex: number) => void;
  onLevelComplete?: (levelIndex: number) => void;
  onGameOver?: (retryCount: number) => void;

  // ── Optional Render Slots ────────────────────────────────────
  SceneBackground?: ComponentType;
  CelebrationOverlay?: ComponentType<GameSkinCelebrationOverlayProps>;
  RoundCompleteEffect?: ComponentType<{ visible: boolean }>;
  LevelCompleteOverlay?: ComponentType<GameSkinLevelCompleteOverlayProps>;
  slotDecoration?: (
    zone: GameSkinZoneSnapshot,
    index: number,
  ) => ReactNode | null;
  tileDecoration?: (tile: GameSkinTileSnapshot) => ReactNode | null;
}
