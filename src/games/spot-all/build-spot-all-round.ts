import { nanoid } from 'nanoid';
import { pickVariation } from './visual-variation/pick-variation';
import type { SpotAllConfig, SpotAllRound, SpotAllTile } from './types';
import type { DistractorSourceContext } from '@/lib/distractors/types';
import { composeDistractors } from '@/lib/distractors/compose';
import { listSources } from '@/lib/distractors/registry';

export interface BuildSpotAllRoundOptions {
  rng?: () => number;
  forceTarget?: string;
}

const pickTarget = (
  config: SpotAllConfig,
  rng: () => number,
  forceTarget?: string,
): string => {
  if (forceTarget) return forceTarget;

  const pairChars = config.selectedConfusablePairs.flatMap(
    (p) => p.pair,
  );
  const reversibleChars = config.selectedReversibleChars;
  const pool = [...new Set([...pairChars, ...reversibleChars])];
  if (pool.length === 0) return 'b';
  return pool[Math.floor(rng() * pool.length)]!;
};

export const buildSpotAllRound = (
  config: SpotAllConfig,
  options: BuildSpotAllRoundOptions = {},
): SpotAllRound => {
  const rng = options.rng ?? Math.random;
  const target = pickTarget(config, rng, options.forceTarget);

  const ctx: DistractorSourceContext = {
    selectedConfusablePairs: config.selectedConfusablePairs,
    selectedReversibleChars: config.selectedReversibleChars,
  };

  const candidates = composeDistractors(
    listSources(),
    target,
    ctx,
    config.distractorCount,
    rng,
  );

  const distractorTiles: SpotAllTile[] = candidates.map((c) => ({
    id: nanoid(),
    label: c.label,
    isCorrect: false,
    transform: c.transform,
    visualVariation: config.visualVariationEnabled
      ? pickVariation(rng, config.enabledFontIds)
      : undefined,
  }));

  const correctTiles: SpotAllTile[] = Array.from(
    { length: config.correctTileCount },
    () => ({
      id: nanoid(),
      label: target,
      isCorrect: true,
      visualVariation: config.visualVariationEnabled
        ? pickVariation(rng, config.enabledFontIds)
        : undefined,
    }),
  );

  const tiles = shuffle([...correctTiles, ...distractorTiles], rng);
  return { target, tiles, correctCount: correctTiles.length };
};

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};
