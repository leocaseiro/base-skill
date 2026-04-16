import { isLastSessionConfigId } from './last-session-game-config';
import type { BaseSkillDatabase } from './types';

/**
 * One-shot migration: copy every non-last-session doc from
 * saved_game_configs into custom_games, then delete it from the source.
 *
 * Idempotent — safe to call on every boot. The flag on app_meta short-
 * circuits subsequent runs; upsert-then-delete makes the flag-unset case
 * safe to retry after a crash.
 */
export async function migrateCustomGames(
  db: BaseSkillDatabase,
): Promise<void> {
  const meta = await db.app_meta.findOne('singleton').exec();
  if (!meta) return; // ensureAppMetaSingleton should have created this — skip quietly
  if (meta.customGamesMigrated === true) return;

  const sourceDocs = await db.saved_game_configs.find().exec();
  const migratable = sourceDocs.filter(
    (d) => !isLastSessionConfigId(d.id),
  );

  for (const source of migratable) {
    await db.custom_games.upsert({
      id: source.id,
      profileId: source.profileId,
      gameId: source.gameId,
      name: source.name,
      config: source.config,
      createdAt: source.createdAt,
      color: source.color,
      ...(source.cover ? { cover: source.cover } : {}),
    });
  }

  for (const source of migratable) {
    await source.remove();
  }

  await meta.incrementalPatch({ customGamesMigrated: true });
}
