// src/lib/game-engine/config-loader.ts
import type { GradeBand, ResolvedGameConfig } from './types';
import type { GameConfigOverridesDoc } from '@/db/schemas/game_config_overrides';
import type { BaseSkillDatabase } from '@/db/types';

function applyOverride(
  config: ResolvedGameConfig,
  override: GameConfigOverridesDoc,
): ResolvedGameConfig {
  const result = { ...config };

  if (override.retries !== null && override.retries !== undefined) {
    result.maxRetries = override.retries;
  }
  if (
    override.timerDuration !== null &&
    override.timerDuration !== undefined
  ) {
    result.timerDurationSeconds = override.timerDuration;
    result.timerVisible = override.timerDuration > 0;
  }
  if (
    override.difficulty !== null &&
    override.difficulty !== undefined
  ) {
    result.difficulty = override.difficulty;
  }

  return result;
}

export async function loadGameConfig(
  gameId: string,
  profileId: string,
  gradeBand: GradeBand,
  db: BaseSkillDatabase,
  defaultConfig: ResolvedGameConfig,
): Promise<ResolvedGameConfig> {
  const allOverrides = await db.game_config_overrides
    .find({ selector: { profileId } })
    .exec();

  // Priority: game → grade-band → global → default
  const gameOverride = allOverrides.find(
    (o) => o.scope === 'game' && o.scopeValue === gameId,
  );
  const gradeBandOverride = allOverrides.find(
    (o) => o.scope === 'grade-band' && o.scopeValue === gradeBand,
  );
  const globalOverride = allOverrides.find((o) => o.scope === 'global');

  let result = { ...defaultConfig };

  if (globalOverride) {
    result = applyOverride(result, globalOverride);
  }
  if (gradeBandOverride) {
    result = applyOverride(result, gradeBandOverride);
  }
  if (gameOverride) {
    result = applyOverride(result, gameOverride);
  }

  return result;
}
