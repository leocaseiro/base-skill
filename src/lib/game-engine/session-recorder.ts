// src/lib/game-engine/session-recorder.ts
import { useEffect, useRef } from 'react';
import type { Move, SessionMeta } from './types';
import type { BaseSkillDatabase } from '@/db/types';
import type { GameEndEvent } from '@/types/game-events';
import { getGameEventBus } from '@/lib/game-event-bus';

const CHUNK_MAX_MOVES = 200;
const CHUNK_MAX_BYTES = 50 * 1024; // 50 KB

function moveToEvent(move: Move) {
  return {
    timestamp: new Date(move.timestamp).toISOString(),
    action: move.type,
    payload: move.args as Record<string, unknown>,
    result: null,
  };
}

export function useSessionRecorder(
  moves: Move[],
  sessionId: string,
  meta: SessionMeta,
  db: BaseSkillDatabase,
  phase: string,
): void {
  const indexCreated = useRef(false);
  const startedAt = useRef(new Date().toISOString());
  const prevMovesLength = useRef(0);

  // Create session_history_index on mount
  useEffect(() => {
    if (indexCreated.current) return;
    indexCreated.current = true;

    void db.session_history_index.upsert({
      sessionId,
      profileId: meta.profileId,
      gameId: meta.gameId,
      startedAt: startedAt.current,
      gradeBand: meta.gradeBand,
      status: 'in-progress',
      seed: meta.seed,
      initialContent: meta.initialContent as unknown as Record<
        string,
        unknown
      >,
      initialState: meta.initialState as unknown as Record<
        string,
        unknown
      >,
      totalChunks: 1,
      totalEvents: 0,
    });
  }, [db, sessionId, meta]);

  // Write moves to session_history chunks on every move addition
  useEffect(() => {
    if (moves.length === 0) return;
    if (moves.length === prevMovesLength.current) return;
    prevMovesLength.current = moves.length;

    const allEvents = moves.map((m) => moveToEvent(m));
    const chunks: (typeof allEvents)[] = [];
    let currentChunk: typeof allEvents = [];
    let currentBytes = 0;

    for (const event of allEvents) {
      const eventBytes = JSON.stringify(event).length;
      if (
        currentChunk.length >= CHUNK_MAX_MOVES ||
        currentBytes + eventBytes > CHUNK_MAX_BYTES
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentBytes = 0;
      }
      currentChunk.push(event);
      currentBytes += eventBytes;
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    const writes = chunks.map((events, chunkIndex) =>
      db.session_history.upsert({
        id: `${sessionId}-chunk-${chunkIndex}`,
        sessionId,
        profileId: meta.profileId,
        gameId: meta.gameId,
        chunkIndex,
        events,
        createdAt: startedAt.current,
      }),
    );

    void Promise.all(writes).then(() => {
      void db.session_history_index
        .findOne(sessionId)
        .exec()
        .then((doc) => {
          if (doc) {
            void doc.incrementalPatch({
              totalEvents: moves.length,
              totalChunks: chunks.length,
            });
          }
        });
    });
  }, [moves, db, sessionId, meta]);

  // Mark completed when game-over
  useEffect(() => {
    if (phase !== 'game-over') return;

    const endedAt = new Date().toISOString();
    const durationMs =
      new Date(endedAt).getTime() -
      new Date(startedAt.current).getTime();

    void db.session_history_index
      .findOne(sessionId)
      .exec()
      .then((doc) => {
        if (!doc || doc.status === 'completed') return;
        void doc.incrementalPatch({
          status: 'completed',
          endedAt,
          duration: Math.round(durationMs / 1000),
        });
      });

    // Emit game:end on event bus
    const bus = getGameEventBus();
    const endEvent: GameEndEvent = {
      type: 'game:end',
      gameId: meta.gameId,
      sessionId,
      profileId: meta.profileId,
      timestamp: Date.now(),
      roundIndex: 0,
      finalScore: 0,
      totalRounds: meta.initialContent.rounds.length,
      correctCount: 0,
      durationMs,
    };
    bus.emit(endEvent);
  }, [phase, db, sessionId, meta]);

  // Flush on visibilitychange (hidden)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void db.session_history_index
          .findOne(sessionId)
          .exec()
          .then((doc) => {
            if (doc && doc.status === 'in-progress') {
              void doc.incrementalPatch({ totalEvents: moves.length });
            }
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility,
      );
    };
  }, [db, sessionId, moves.length]);
}
