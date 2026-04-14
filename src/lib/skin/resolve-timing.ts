import type { GameSkin, GameSkinTiming } from './game-skin';

export const DEFAULT_SKIN_TIMING: Required<GameSkinTiming> = {
  roundAdvanceDelay: 750,
  autoEjectDelay: 1000,
  levelCompleteDelay: 750,
};

/**
 * Resolve an engine timing value with precedence:
 *   configTiming (teacher override) → skin.timing → DEFAULT_SKIN_TIMING.
 */
export function resolveTiming(
  key: keyof GameSkinTiming,
  skin: GameSkin,
  configTiming?: GameSkinTiming,
): number {
  return (
    configTiming?.[key] ??
    skin.timing?.[key] ??
    DEFAULT_SKIN_TIMING[key]
  );
}
