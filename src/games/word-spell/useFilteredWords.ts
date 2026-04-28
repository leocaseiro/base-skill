import { useEffect, useState } from 'react';
import type { WordFilter, WordHit } from '@/data/words';
import { filterWords } from '@/data/words';

interface State {
  hits: WordHit[];
  isLoading: boolean;
}

export const useFilteredWords = (filter: WordFilter): State => {
  const [state, setState] = useState<State>({
    hits: [],
    isLoading: true,
  });

  // Stable signature — re-runs effect only when meaningful inputs change.
  // JSON.stringify is fine here because filters are small (≤ 50 keys).
  const signature = JSON.stringify(filter);

  useEffect(() => {
    const cancellation = { isCancelled: false as boolean };
    setState((prev) =>
      prev.isLoading ? prev : { ...prev, isLoading: true },
    );

    void (async () => {
      const result = await filterWords(filter);
      if (cancellation.isCancelled) return;
      setState({ hits: result.hits, isLoading: false });
    })();

    return () => {
      cancellation.isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature replaces filter object identity
  }, [signature]);

  return state;
};
