import { describe, expect, it } from 'vitest';
import { buildSpotAllRound } from './build-spot-all-round';
import type { SpotAllConfig } from './types';
import { seededRandom } from '@/lib/seeded-random';

const baseConfig = (
  overrides: Partial<SpotAllConfig> = {},
): SpotAllConfig => ({
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
    { pair: ['b', 'p'], type: 'mirror-vertical' },
  ],
  selectedReversibleChars: [],
  correctTileCount: 3,
  distractorCount: 2,
  totalRounds: 1,
  visualVariationEnabled: false,
  enabledFontIds: [],
  roundsInOrder: false,
  ttsEnabled: true,
  ...overrides,
});

describe('buildSpotAllRound', () => {
  it('produces correctTileCount + distractorCount tiles', () => {
    const r = buildSpotAllRound(baseConfig(), {
      rng: seededRandom('s1'),
      forceTarget: 'b',
    });
    expect(r.tiles).toHaveLength(5);
    expect(r.correctCount).toBe(3);
  });

  it('confusable distractors render WITHOUT a CSS transform', () => {
    const r = buildSpotAllRound(baseConfig(), {
      rng: seededRandom('s1'),
      forceTarget: 'b',
    });
    const distractors = r.tiles.filter((t) => !t.isCorrect);
    expect(distractors.every((t) => t.transform === undefined)).toBe(
      true,
    );
    expect(distractors.every((t) => t.label !== 'b')).toBe(true);
  });

  it('reversible distractors render the TARGET character with the reversal CSS transform', () => {
    const r = buildSpotAllRound(
      baseConfig({
        selectedConfusablePairs: [],
        selectedReversibleChars: ['2'],
        distractorCount: 1,
      }),
      { rng: seededRandom('s1'), forceTarget: '2' },
    );
    const distractor = r.tiles.find((t) => !t.isCorrect);
    expect(distractor?.label).toBe('2');
    expect(distractor?.transform).toBe('scaleX(-1)');
  });

  it('applies visualVariation to BOTH correct and distractor tiles when enabled', () => {
    const r = buildSpotAllRound(
      baseConfig({
        visualVariationEnabled: true,
        enabledFontIds: ['andika', 'nunito'],
      }),
      { rng: seededRandom('s1') },
    );
    expect(r.tiles.every((t) => t.visualVariation !== undefined)).toBe(
      true,
    );
  });

  it('guarantees at least 1 correct tile even when correctTileCount is 0', () => {
    const r = buildSpotAllRound(baseConfig({ correctTileCount: 0 }), {
      rng: seededRandom('s1'),
      forceTarget: 'b',
    });
    expect(
      r.tiles.filter((t) => t.isCorrect).length,
    ).toBeGreaterThanOrEqual(1);
    expect(r.correctCount).toBeGreaterThanOrEqual(1);
  });

  it('is deterministic when rng is seeded', () => {
    const a = buildSpotAllRound(baseConfig(), {
      rng: seededRandom('seed-X'),
      forceTarget: 'b',
    });
    const b = buildSpotAllRound(baseConfig(), {
      rng: seededRandom('seed-X'),
      forceTarget: 'b',
    });
    expect(a.tiles.map((t) => t.label)).toEqual(
      b.tiles.map((t) => t.label),
    );
  });
});
