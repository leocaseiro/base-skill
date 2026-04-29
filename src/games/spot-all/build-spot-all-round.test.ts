import { describe, expect, it } from 'vitest';
import { buildSpotAllRound } from './build-spot-all-round';
import type { SpotAllConfig } from './types';

const baseConfig: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  totalRounds: 5,
  roundsInOrder: false,
  ttsEnabled: true,
  targetSetIds: ['bdpq'],
  relationshipTypes: [
    'mirror-horizontal',
    'mirror-vertical',
    'rotation-180',
  ],
  correctTileCount: 3,
  distractorCount: 3,
  visualVariationEnabled: true,
};

describe('buildSpotAllRound', () => {
  it('builds a round with requested tile counts', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      targetSetIds: ['bdpq'],
      correctTileCount: 3,
      distractorCount: 3,
      forceTarget: 'b',
    });

    expect(round.tiles).toHaveLength(6);
    expect(round.correctCount).toBe(3);
    expect(round.tiles.filter((tile) => tile.isCorrect)).toHaveLength(
      3,
    );
  });

  it('uses confusable members for distractors', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      forceTarget: 'b',
    });
    const distractorLabels = round.tiles
      .filter((tile) => !tile.isCorrect)
      .map((tile) => tile.label);
    for (const label of distractorLabels) {
      expect(['d', 'p', 'q']).toContain(label);
    }
  });

  it('gives each correct tile visual variation', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      forceTarget: 'b',
    });
    const variationKeys = round.tiles
      .filter((tile) => tile.isCorrect)
      .map(
        (tile) =>
          `${tile.visualVariation?.fontFamily}|${tile.visualVariation?.fontSizePx}|${tile.visualVariation?.color}`,
      );
    expect(new Set(variationKeys).size).toBe(3);
  });

  it('maps mirror relationships to CSS transforms', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      relationshipTypes: ['mirror-horizontal'],
      forceTarget: 'b',
      distractorCount: 1,
    });
    const distractor = round.tiles.find((tile) => !tile.isCorrect);
    expect(distractor?.transform).toBe('scaleX(-1)');
  });

  it('supports transposition labels', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      targetSetIds: ['oa-ao'],
      relationshipTypes: ['transposition'],
      forceTarget: 'oa',
      correctTileCount: 1,
      distractorCount: 1,
    });
    const distractor = round.tiles.find((tile) => !tile.isCorrect);
    expect(distractor?.label).toBe('ao');
  });

  it('falls back to random symbols when no confusables are found', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      forceTarget: '~',
      correctTileCount: 2,
      distractorCount: 2,
    });
    const distractors = round.tiles.filter((tile) => !tile.isCorrect);
    expect(distractors).toHaveLength(2);
  });

  it('caps distractors to available confusables', () => {
    const round = buildSpotAllRound({
      ...baseConfig,
      forceTarget: '15',
      targetSetIds: ['15-51'],
      relationshipTypes: ['transposition'],
      correctTileCount: 1,
      distractorCount: 10,
    });
    expect(round.tiles.filter((tile) => !tile.isCorrect)).toHaveLength(
      1,
    );
  });
});
