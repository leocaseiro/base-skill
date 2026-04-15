import { useAnswerGameContext } from '../useAnswerGameContext';
import { ProgressHUD } from './ProgressHUD';
import { resolveHudFlags } from './resolve-hud-flags';
import type { ProgressHUDProps } from '../types';
import type { GameSkin } from '@/lib/skin';

interface ProgressHUDRootProps {
  skin?: GameSkin;
}

export const ProgressHUDRoot = ({ skin }: ProgressHUDRootProps) => {
  const { config, phase, roundIndex, levelIndex, isLevelMode } =
    useAnswerGameContext();

  const flags = resolveHudFlags(config.hud, isLevelMode);

  const props: ProgressHUDProps = {
    roundIndex,
    totalRounds: isLevelMode ? null : config.totalRounds,
    levelIndex,
    isLevelMode,
    phase,
    ...flags,
  };

  if (skin?.ProgressHUD) {
    const SkinHud = skin.ProgressHUD;
    return <SkinHud {...props} />;
  }

  return <ProgressHUD {...props} />;
};
