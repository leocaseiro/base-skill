import { useEffect, useState } from 'react';
import type { WordFilter } from '@/data/words';
import { filterWords } from '@/data/words';

export interface LibraryPreview {
  loading: boolean;
  error: string | null;
  hitCount: number;
  hits: { word: string; level?: number }[];
  usedFallback: { from: string; to: string } | null;
}

const EMPTY: LibraryPreview = {
  loading: false,
  error: null,
  hitCount: 0,
  hits: [],
  usedFallback: null,
};

export const useLibraryPreview = (
  enabled: boolean,
  filter: WordFilter | null,
): LibraryPreview => {
  const [state, setState] = useState<LibraryPreview>(() =>
    enabled && filter ? { ...EMPTY, loading: true } : EMPTY,
  );

  useEffect(() => {
    if (!enabled || !filter) return;
    const abort = new AbortController();
    void (async () => {
      try {
        const result = await filterWords(filter);
        if (abort.signal.aborted) return;
        setState({
          loading: false,
          error: null,
          hitCount: result.hits.length,
          hits: result.hits.map((h) => ({
            word: h.word,
            level: h.level,
          })),
          usedFallback: result.usedFallback ?? null,
        });
      } catch (error) {
        if (abort.signal.aborted) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : String(error),
          hitCount: 0,
          hits: [],
          usedFallback: null,
        });
      }
    })();
    return () => {
      abort.abort();
    };
  }, [enabled, filter]);

  return state;
};
