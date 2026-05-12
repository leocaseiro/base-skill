import { useEffect, useLayoutEffect, useRef } from 'react';
import type {
  AnswerGameDraftState,
  AnswerGameState,
} from '@/components/answer-game/types';
import type { BaseSkillDatabase } from '@/db/types';

const buildDraft = (
  state: AnswerGameState,
  engineRoundIndex?: number,
): AnswerGameDraftState | null => {
  if (
    state.phase === 'game-over' ||
    state.phase === 'round-complete' ||
    state.phase === 'level-complete'
  )
    return null;
  const draft: AnswerGameDraftState = {
    allTiles: state.allTiles,
    bankTileIds: state.bankTileIds,
    zones: state.zones,
    activeSlotIndex: state.activeSlotIndex,
    phase: state.phase,
    roundIndex: state.roundIndex,
    retryCount: state.retryCount,
    levelIndex: state.levelIndex,
  };
  if (engineRoundIndex !== undefined) {
    draft.engineRoundIndex = engineRoundIndex;
  }
  return draft;
};

/**
 * Persists AnswerGameState snapshots to session_history_index.draftState.
 * - Debounced 500 ms on every state change.
 * - Flushes immediately on visibilitychange → hidden.
 * - Writes null during celebration phases (round-complete, level-complete,
 *   game-over) so a tab-close-then-resume during the celebration window
 *   does not replay the celebration on the next mount.
 * - No-op when sessionId or db is null.
 * - When `engineRoundIndex` is provided, persists the engine's accumulated
 *   roundIndex separately from the reducer's per-level value. This unblocks
 *   correct resume in SortNumbers level mode where the two diverge.
 *   (review #3)
 */
export const useAnswerGameDraftSync = (
  state: AnswerGameState,
  sessionId: string | null,
  db: BaseSkillDatabase | null,
  engineRoundIndex?: number,
): void => {
  // Refs so event-listener callbacks always read the latest values
  const latestRef = useRef({ state, sessionId, db, engineRoundIndex });
  useLayoutEffect(() => {
    latestRef.current = { state, sessionId, db, engineRoundIndex };
  });

  // Debounced write: resets on every state/sessionId/db change
  useEffect(() => {
    if (!sessionId || !db) return;

    const timer = setTimeout(async () => {
      const {
        state: s,
        db: d,
        sessionId: sid,
        engineRoundIndex: eri,
      } = latestRef.current;
      if (!d || !sid) return;

      try {
        const doc = await d.session_history_index.findOne(sid).exec();
        if (!doc) return;

        const draft = buildDraft(s, eri);
        await doc.incrementalPatch({
          draftState: draft as unknown as Record<
            string,
            unknown
          > | null,
        });
      } catch (error) {
        // Persistence is best-effort: a closed RxDB collection, quota
        // failure, or race during navigation must not crash the React
        // tree. Log to console in dev so regressions are visible; in
        // production the failure is silently dropped — the next state
        // change will retry.
        if (import.meta.env.DEV) {
          console.warn(
            '[useAnswerGameDraftSync] debounced draft write failed',
            error,
          );
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state, sessionId, db, engineRoundIndex]);

  // Immediate flush on tab hidden
  useEffect(() => {
    const flush = async () => {
      if (document.visibilityState !== 'hidden') return;
      const {
        state: s,
        db: d,
        sessionId: sid,
        engineRoundIndex: eri,
      } = latestRef.current;
      if (!d || !sid) return;

      try {
        const doc = await d.session_history_index.findOne(sid).exec();
        if (!doc) return;

        const draft = buildDraft(s, eri);
        await doc.incrementalPatch({
          draftState: draft as unknown as Record<
            string,
            unknown
          > | null,
        });
      } catch (error) {
        // Best-effort flush on tab hide. Throwing here would surface as
        // an unhandled rejection during page unload; absorb instead.
        if (import.meta.env.DEV) {
          console.warn(
            '[useAnswerGameDraftSync] visibility flush failed',
            error,
          );
        }
      }
    };

    document.addEventListener('visibilitychange', flush);
    return () =>
      document.removeEventListener('visibilitychange', flush);
  }, []);
};
