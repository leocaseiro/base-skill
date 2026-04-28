import type { WordSpellConfig, WordSpellSimpleConfig } from './types';

export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => ({
  gameId: 'word-spell',
  component: 'WordSpell',
  configMode: 'simple',
  mode: 'recall',
  tileUnit: 'letter',
  inputMethod: simple.inputMethod,
  wrongTileBehavior: 'lock-manual',
  ttsEnabled: true,
  roundsInOrder: false,
  totalRounds: 4,
  tileBankMode: 'exact',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      level: simple.level,
      phonemesAllowed: simple.phonemesAllowed,
    },
  },
});

export const advancedToSimple = (
  config: WordSpellConfig,
): WordSpellSimpleConfig => {
  const filter = config.source?.filter;
  return {
    configMode: 'simple',
    level: filter?.level ?? 1,
    phonemesAllowed: filter?.phonemesAllowed ?? [],
    inputMethod: config.inputMethod,
  };
};
