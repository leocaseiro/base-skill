import { useEffect, useState } from 'react';
import type { CollectionName } from '@/db/types';
import { getOrCreateDatabase } from '@/db/create-database';

export interface StorageSnapshot {
  localStorage: { key: string; size: number; preview: string }[];
  collections: {
    name: string;
    count: number;
    docs: Record<string, unknown>[];
  }[];
  loading: boolean;
  error: string | null;
}

const docToJson = (doc: unknown): Record<string, unknown> => {
  if (
    typeof doc === 'object' &&
    doc !== null &&
    typeof (doc as { toJSON?: () => unknown }).toJSON === 'function'
  ) {
    const json = (doc as { toJSON: () => unknown }).toJSON();
    return json as Record<string, unknown>;
  }
  return doc as Record<string, unknown>;
};

const TRACKED_COLLECTIONS: CollectionName[] = [
  'custom_games',
  'saved_game_configs',
  'session_history_index',
  'session_history',
  'word_spell_seen_words',
  'settings',
  'bookmarks',
];

const readLocalStorage = (): StorageSnapshot['localStorage'] => {
  if (typeof localStorage === 'undefined') return [];
  const entries: StorageSnapshot['localStorage'] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    entries.push({
      key,
      size: value.length,
      preview: value.length > 80 ? `${value.slice(0, 77)}...` : value,
    });
  }
  return entries.toSorted((a, b) => a.key.localeCompare(b.key));
};

const initialSnapshot = (enabled: boolean): StorageSnapshot => ({
  localStorage: enabled ? readLocalStorage() : [],
  collections: [],
  loading: enabled && typeof indexedDB !== 'undefined',
  error: null,
});

export const useStorageSnapshot = (
  enabled: boolean,
): StorageSnapshot => {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(() =>
    initialSnapshot(enabled),
  );

  useEffect(() => {
    if (!enabled) return;
    if (typeof indexedDB === 'undefined') return;
    const abort = new AbortController();
    void (async () => {
      try {
        const db = await getOrCreateDatabase();
        const collections = await Promise.all(
          TRACKED_COLLECTIONS.map(async (name) => {
            const collection = db[name];
            const docs = await collection.find().exec();
            return {
              name,
              count: docs.length,
              docs: docs.map((d) => docToJson(d)),
            };
          }),
        );
        if (abort.signal.aborted) return;
        setSnapshot({
          localStorage: readLocalStorage(),
          collections,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (abort.signal.aborted) return;
        setSnapshot({
          localStorage: readLocalStorage(),
          collections: [],
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
    return () => {
      abort.abort();
    };
  }, [enabled]);

  return snapshot;
};
