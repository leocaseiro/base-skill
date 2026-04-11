import { useEffect, useState } from 'react';
import type { WordSpellConfig, WordSpellRound } from './types';
import type { Region } from '@/data/words';
import { filterWords, toWordSpellRound } from '@/data/words';

interface LibraryRoundsState {
  rounds: WordSpellRound[];
  isLoading: boolean;
  usedFallback?: { from: Region; to: 'aus' };
}

const initialStateFor = (
  config: WordSpellConfig,
): LibraryRoundsState => {
  if (config.source) return { rounds: [], isLoading: true };
  return { rounds: config.rounds ?? [], isLoading: false };
};

export const useLibraryRounds = (
  config: WordSpellConfig,
): LibraryRoundsState => {
  const [state, setState] = useState<LibraryRoundsState>(() =>
    initialStateFor(config),
  );

  useEffect(() => {
    if (config.rounds && config.rounds.length > 0) {
      const explicit = config.rounds;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state when config transitions to explicit rounds; bail-out updater is a no-op when already in sync
      setState((prev) =>
        prev.rounds === explicit &&
        !prev.isLoading &&
        prev.usedFallback === undefined
          ? prev
          : { rounds: explicit, isLoading: false },
      );
      return;
    }

    const source = config.source;
    if (!source) {
      setState((prev) =>
        prev.rounds.length === 0 &&
        !prev.isLoading &&
        prev.usedFallback === undefined
          ? prev
          : { rounds: [], isLoading: false },
      );
      return;
    }

    const cancellation = { isCancelled: false };

    setState((prev) =>
      prev.isLoading ? prev : { ...prev, isLoading: true },
    );

    void (async () => {
      const result = await filterWords(source.filter);
      if (cancellation.isCancelled) return;
      const limit = source.limit ?? config.totalRounds;
      const picked = result.hits
        .slice(0, limit)
        .map((hit) => toWordSpellRound(hit));
      setState({
        rounds: picked,
        isLoading: false,
        usedFallback: result.usedFallback,
      });
    })();

    return () => {
      cancellation.isCancelled = true;
    };
  }, [config.rounds, config.source, config.totalRounds]);

  return state;
};
