// src/lib/game-engine/session-finder.ts
import type {
  GameEngineState,
  Move,
  MoveLog,
  MoveType,
  ResolvedContent,
} from './types';
import type { BaseSkillDatabase } from '@/db/types';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function findInProgressSession(
  profileId: string,
  gameId: string,
  db: BaseSkillDatabase,
): Promise<MoveLog | null> {
  const index = await db.session_history_index
    .findOne({
      selector: { profileId, gameId, status: 'in-progress' },
    })
    .exec();

  if (!index) return null;

  // Check staleness
  const ageMs = Date.now() - new Date(index.startedAt).getTime();
  if (ageMs > STALE_THRESHOLD_MS) {
    await index.incrementalPatch({ status: 'abandoned' });
    return null;
  }

  // Load all chunks sorted by chunkIndex
  const chunks = await db.session_history
    .find({ selector: { sessionId: index.sessionId } })
    .exec();

  const allEvents = chunks
    .toSorted((a, b) => a.chunkIndex - b.chunkIndex)
    .flatMap(
      (c) =>
        c.events as Array<{
          timestamp: string;
          action: string;
          payload: Record<string, string | number | boolean> | null;
          result: null;
        }>,
    );

  const moves: Move[] = allEvents.map((e) => ({
    type: e.action as MoveType,
    args: (e.payload ?? {}) as unknown as Record<
      string,
      string | number | boolean
    >,
    timestamp: new Date(e.timestamp).getTime(),
  }));

  return {
    gameId: index.gameId,
    sessionId: index.sessionId,
    profileId: index.profileId,
    seed: index.seed,
    initialContent: index.initialContent as unknown as ResolvedContent,
    initialState: index.initialState as unknown as GameEngineState,
    moves,
  };
}
