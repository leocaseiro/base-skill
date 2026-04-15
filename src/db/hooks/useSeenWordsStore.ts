import { useMemo } from 'react';
import { useRxDB } from './useRxDB';
import type { SeenWordsStore } from '@/data/words';
import { createInMemorySeenWordsStore } from '@/data/words';
import { ANONYMOUS_PROFILE_ID } from '@/db/last-session-game-config';

/**
 * Per-profile seen-words store backed by RxDB. When the database isn't
 * ready yet, returns an in-memory store so the first session plays
 * correctly; subsequent sessions pick up persisted state once the db
 * hydrates.
 */
export const useSeenWordsStore = (): SeenWordsStore => {
  const { db } = useRxDB();
  const profileId = ANONYMOUS_PROFILE_ID;

  const fallback = useMemo(() => createInMemorySeenWordsStore(), []);

  return useMemo<SeenWordsStore>(() => {
    if (!db) return fallback;

    const docId = (signature: string): string =>
      `${profileId}__${signature}`;

    return {
      get: async (signature) => {
        const doc = await db.word_spell_seen_words
          .findOne(docId(signature))
          .exec();
        return new Set(doc?.words);
      },
      addSeen: async (signature, words) => {
        const id = docId(signature);
        const existing = await db.word_spell_seen_words
          .findOne(id)
          .exec();
        const merged = [
          ...new Set([...(existing?.words ?? []), ...words]),
        ];
        const now = new Date().toISOString();
        await (existing
          ? existing.incrementalPatch({
              words: merged,
              updatedAt: now,
            })
          : db.word_spell_seen_words.insert({
              id,
              profileId,
              signature,
              words: merged,
              updatedAt: now,
            }));
      },
      resetSeen: async (signature, words) => {
        const id = docId(signature);
        const existing = await db.word_spell_seen_words
          .findOne(id)
          .exec();
        const now = new Date().toISOString();
        await (existing
          ? existing.incrementalPatch({ words, updatedAt: now })
          : db.word_spell_seen_words.insert({
              id,
              profileId,
              signature,
              words,
              updatedAt: now,
            }));
      },
    };
  }, [db, fallback, profileId]);
};
