import type { HudConfig } from '../types';

export interface ResolvedHudFlags {
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}

export const resolveHudFlags = (
  config: HudConfig | undefined,
  isLevelMode: boolean,
): ResolvedHudFlags => {
  const defaults: ResolvedHudFlags = isLevelMode
    ? { showDots: true, showFraction: false, showLevel: true }
    : { showDots: true, showFraction: true, showLevel: false };

  return {
    showDots: config?.showDots ?? defaults.showDots,
    showFraction: config?.showFraction ?? defaults.showFraction,
    showLevel: config?.showLevel ?? defaults.showLevel,
  };
};
