import type { BaseSkillDatabase } from './types';
import type { WordSpellConfig } from '@/games/word-spell/types';
import { DEFAULT_RECALL_CONFIG } from '@/routes/$locale/_app/game/$gameId';

/**
 * Idempotently seeds the "The Floor is Lava" custom-game row for a
 * profile on first call. Guards against re-seeding via a per-profile
 * flag on `app_meta` and against multi-tab / partial-failure races
 * via a deterministic primary key.
 *
 * Behaviour:
 *  - First call for a profile: inserts the row and sets
 *    `app_meta.theFloorIsLavaSeeded[profileId] = true`.
 *  - Subsequent calls: early-return on the flag — no-op.
 *  - If the user deletes the row later, the flag stays set so the
 *    seeder does not silently re-create it.
 *  - Concurrent callers race on the RxDB primary key; duplicate-key
 *    inserts are swallowed and the flag is still set (idempotent).
 */
export const seedTheFloorIsLavaIfNeeded = async (
  db: BaseSkillDatabase,
  profileId: string,
): Promise<void> => {
  const meta = await db.app_meta.findOne('singleton').exec();
  if (meta?.theFloorIsLavaSeeded?.[profileId]) return;

  const cfg: WordSpellConfig = {
    ...DEFAULT_RECALL_CONFIG,
    skin: 'dragon-cave',
  };

  try {
    await db.custom_games.insert({
      // Deterministic id — duplicate inserts (multi-tab race, refresh
      // mid-seed, partial failure on the flag write) reject at the
      // RxDB primary-key layer instead of producing duplicate rows.
      id: `seed:tfil:${profileId}`,
      profileId,
      gameId: 'word-spell',
      name: 'The Floor is Lava',
      // CustomGameDoc.config is typed as `Record<string, unknown>` (it stores
      // any game's config blob). WordSpellConfig is an interface without an
      // index signature, so TS won't auto-widen it. Cast via `unknown` to
      // satisfy the doc shape; the runtime payload is identical.
      config: cfg as unknown as Record<string, unknown>,
      color: 'amber',
      cover: {
        kind: 'image',
        // Placeholder cover lands in Task 12 (public/skins/word-spell/
        // dragon-cave/cover-placeholder.png). The path is resolved
        // against BASE_URL so the Storybook PR-preview deploy
        // (BASE_URL=./) still finds the asset.
        src: `${import.meta.env.BASE_URL}skins/word-spell/dragon-cave/cover-placeholder.png`,
        alt: 'A dragon perched on a cliff above bubbling lava',
        background: 'amber-glow',
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // RxDB rejects on duplicate primary key — that is the race-safety
    // we want from the deterministic id. Swallow it and continue so
    // we still set the per-profile flag. Rethrow anything else.
    if (!isDuplicateKeyError(error)) throw error;
  }

  await meta?.incrementalPatch({
    theFloorIsLavaSeeded: {
      ...meta.theFloorIsLavaSeeded,
      [profileId]: true,
    },
  });
};

const isDuplicateKeyError = (err: unknown): boolean => {
  // RxDB wraps storage-layer 409s in an `RxError` with `code === 'CONFLICT'`
  // (see node_modules/rxdb/dist/cjs/rx-storage-helper.js → throwIfIsStorageWriteError).
  // We accept either the wrapped RxError shape or a raw 409 status from a
  // lower-level storage adapter that bypasses the wrapper.
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; status?: number };
  return e.code === 'CONFLICT' || e.status === 409;
};
