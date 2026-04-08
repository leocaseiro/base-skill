import { generateSortRounds } from './build-sort-round';
import type {
  SkipConfig,
  SortNumbersConfig,
  SortNumbersSimpleConfig,
} from './types';

const SIMPLE_DEFAULTS: SortNumbersSimpleConfig = {
  configMode: 'simple',
  direction: 'ascending',
  start: 2,
  step: 2,
  quantity: 5,
  distractors: false,
};

export const resolveSimpleConfig = (
  simple: SortNumbersSimpleConfig,
): SortNumbersConfig => {
  const { direction, start, step, quantity, distractors } = simple;
  const range = { min: start, max: start + (quantity - 1) * step };
  const skip: SkipConfig = { mode: 'by', step, start };

  return {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    configMode: 'simple',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 1,
    direction,
    range,
    quantity,
    skip,
    tileBankMode: distractors ? 'distractors' : 'exact',
    distractors: distractors
      ? { source: 'gaps-only', count: 'all' }
      : { source: 'random', count: 2 },
    rounds: generateSortRounds({
      range,
      quantity,
      skip,
      totalRounds: 1,
    }),
  };
};

export const canConvertToSimple = (
  config: SortNumbersConfig,
): boolean => {
  if (config.skip.mode !== 'by') return false;
  if (typeof config.skip.start !== 'number') return false;
  if (
    config.tileBankMode === 'distractors' &&
    (config.distractors.source !== 'gaps-only' ||
      config.distractors.count !== 'all')
  )
    return false;
  return true;
};

export const advancedToSimple = (
  config: SortNumbersConfig,
): SortNumbersSimpleConfig => {
  if (!canConvertToSimple(config)) return { ...SIMPLE_DEFAULTS };
  const skip = config.skip as {
    mode: 'by';
    step: number;
    start: number;
  };
  return {
    configMode: 'simple',
    direction: config.direction,
    start: skip.start,
    step: skip.step,
    quantity: config.quantity,
    distractors: config.tileBankMode === 'distractors',
  };
};
