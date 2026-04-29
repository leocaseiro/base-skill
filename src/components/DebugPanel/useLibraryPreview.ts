import { useEffect, useState } from 'react';
import type { WordFilter } from '@/data/words';
import { filterSignature, filterWords } from '@/data/words';

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

  const signature = filter ? filterSignature(filter) : null;

  useEffect(() => {
    if (!enabled || !filter) return;
    const abort = new AbortController();
    setState((prev) =>
      prev.loading ? prev : { ...prev, loading: true },
    );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature replaces filter object identity, matching useFilteredWords pattern
  }, [enabled, signature]);

  return state;
};
