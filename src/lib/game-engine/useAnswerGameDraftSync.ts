import { useEffect, useRef } from 'react';
import type {
  AnswerGameDraftState,
  AnswerGameState,
} from '@/components/answer-game/types';
import type { BaseSkillDatabase } from '@/db/types';

const buildDraft = (
  state: AnswerGameState,
): AnswerGameDraftState | null => {
  if (state.phase === 'game-over') return null;
  return {
    allTiles: state.allTiles,
    bankTileIds: state.bankTileIds,
    zones: state.zones,
    activeSlotIndex: state.activeSlotIndex,
    phase: state.phase,
    roundIndex: state.roundIndex,
    retryCount: state.retryCount,
  };
};

/**
 * Persists AnswerGameState snapshots to session_history_index.draftState.
 * - Debounced 500 ms on every state change.
 * - Flushes immediately on visibilitychange → hidden.
 * - Writes null when phase === 'game-over' (clears draft on completion).
 * - No-op when sessionId or db is null.
 */
export const useAnswerGameDraftSync = (
  state: AnswerGameState,
  sessionId: string | null,
  db: BaseSkillDatabase | null,
): void => {
  // Refs so event-listener callbacks always read the latest values
  const latestRef = useRef({ state, sessionId, db });
  latestRef.current = { state, sessionId, db };

  // Debounced write: resets on every state/sessionId/db change
  useEffect(() => {
    if (!sessionId || !db) return;

    const timer = setTimeout(async () => {
      const { state: s, db: d, sessionId: sid } = latestRef.current;
      if (!d || !sid) return;

      const doc = await d.session_history_index.findOne(sid).exec();
      if (!doc) return;

      const draft = buildDraft(s);
      await doc.incrementalPatch({
        draftState: draft as unknown as Record<
          string,
          unknown
        > | null,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [state, sessionId, db]); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate flush on tab hidden
  useEffect(() => {
    const flush = async () => {
      if (document.visibilityState !== 'hidden') return;
      const { state: s, db: d, sessionId: sid } = latestRef.current;
      if (!d || !sid) return;

      const doc = await d.session_history_index.findOne(sid).exec();
      if (!doc) return;

      const draft = buildDraft(s);
      await doc.incrementalPatch({
        draftState: draft as unknown as Record<
          string,
          unknown
        > | null,
      });
    };

    document.addEventListener('visibilitychange', flush);
    return () =>
      document.removeEventListener('visibilitychange', flush);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
