export { classicSkin } from './classic-skin';
export type {
  GameSkin,
  GameSkinCelebrationOverlayProps,
  GameSkinLevelCompleteOverlayProps,
  GameSkinTileSnapshot,
  GameSkinTiming,
  GameSkinZoneSnapshot,
} from './game-skin';
export {
  getRegisteredSkins,
  registerSkin,
  resolveSkin,
} from './registry';
export { DEFAULT_SKIN_TIMING, resolveTiming } from './resolve-timing';
export { useGameSkin } from './useGameSkin';
