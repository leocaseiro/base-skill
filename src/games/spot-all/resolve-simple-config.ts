import type { SpotAllConfig, SpotAllSimpleConfig } from './types';

export const resolveSimpleConfig = (
  simple: SpotAllSimpleConfig,
): SpotAllConfig => {
  switch (simple.difficulty) {
    case 'easy': {
      return {
        gameId: 'spot-all',
        component: 'SpotAll',
        configMode: 'simple',
        totalRounds: 4,
        roundsInOrder: false,
        ttsEnabled: true,
        targetSetIds: ['bdpq'],
        relationshipTypes: ['mirror-horizontal', 'mirror-vertical'],
        correctTileCount: 4,
        distractorCount: 2,
        visualVariationEnabled: true,
      };
    }
    case 'hard': {
      return {
        gameId: 'spot-all',
        component: 'SpotAll',
        configMode: 'simple',
        totalRounds: 8,
        roundsInOrder: false,
        ttsEnabled: true,
        targetSetIds: ['bdpq', 'il1', '69', '3e', 'oa-ao', '15-51'],
        relationshipTypes: [
          'mirror-horizontal',
          'mirror-vertical',
          'rotation-180',
          'visual-similarity',
          'transposition',
        ],
        correctTileCount: 5,
        distractorCount: 7,
        visualVariationEnabled: true,
      };
    }
    default: {
      return {
        gameId: 'spot-all',
        component: 'SpotAll',
        configMode: 'simple',
        totalRounds: 6,
        roundsInOrder: false,
        ttsEnabled: true,
        targetSetIds: ['bdpq', 'il1', '69', '3e'],
        relationshipTypes: [
          'mirror-horizontal',
          'mirror-vertical',
          'rotation-180',
          'visual-similarity',
        ],
        correctTileCount: 4,
        distractorCount: 4,
        visualVariationEnabled: true,
      };
    }
  }
};
