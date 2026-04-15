import { modeToPair, pairToMode } from './pair-to-mode';
import type {
  NumberMatchConfig,
  NumberMatchSimpleConfig,
} from './types';

export const resolveSimpleConfig = (
  simple: NumberMatchSimpleConfig,
): NumberMatchConfig => {
  const mode = pairToMode(simple.from, simple.to);
  const tileBankMode =
    simple.distractorCount > 0 ? 'distractors' : 'exact';

  return {
    gameId: 'number-match',
    component: 'NumberMatch',
    configMode: 'simple',
    mode,
    tileStyle: 'dots',
    tileBankMode,
    distractorCount: simple.distractorCount,
    range: { min: simple.rangeMin, max: simple.rangeMax },
    inputMethod: simple.inputMethod,
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 1,
    rounds: [],
  };
};

export const advancedToSimple = (
  config: NumberMatchConfig,
): NumberMatchSimpleConfig => {
  const { from, to } = modeToPair(config.mode);
  return {
    configMode: 'simple',
    from,
    to,
    rangeMin: config.range.min,
    rangeMax: config.range.max,
    inputMethod: config.inputMethod,
    distractorCount: config.distractorCount ?? 0,
  };
};
