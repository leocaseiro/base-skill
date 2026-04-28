import { defaultSelection, unitLevel } from './level-unit-selection';
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL, cumulativeGraphemes } from '@/data/words';

const uniquePhonemes = (
  units: readonly LevelGraphemeUnit[],
): string[] => [...new Set(units.map((u) => u.p))];

const maxLevelOf = (units: readonly LevelGraphemeUnit[]): number => {
  if (units.length === 0) return 1;
  let max = 1;
  for (const u of units) {
    const lvl = unitLevel(u);
    if (lvl !== undefined && lvl > max) max = lvl;
  }
  return max;
};

const cumulativeGraphemeForms = (level: number): string[] => [
  ...new Set(cumulativeGraphemes(level).map((u) => u.g)),
];

const unitsFromLegacy = (
  raw: Record<string, unknown>,
): LevelGraphemeUnit[] => {
  if (
    typeof raw.level !== 'number' ||
    !Array.isArray(raw.phonemesAllowed)
  )
    return defaultSelection();
  const out: LevelGraphemeUnit[] = [];
  for (let lvl = 1; lvl <= raw.level; lvl++) {
    for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
      if ((raw.phonemesAllowed as string[]).includes(u.p)) out.push(u);
    }
  }
  return out.length > 0 ? out : defaultSelection();
};

export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => {
  const raw = simple as unknown as Record<string, unknown>;
  const units = Array.isArray(raw.selectedUnits)
    ? (raw.selectedUnits as LevelGraphemeUnit[])
    : unitsFromLegacy(raw);
  const region =
    typeof raw.region === 'string' ? (raw.region as 'aus') : 'aus';

  const maxLevel = maxLevelOf(units);
  const graphemesAllowed = cumulativeGraphemeForms(maxLevel);
  const phonemesRequired = uniquePhonemes(units);

  return {
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
        region,
        graphemesAllowed,
        phonemesRequired,
      },
    },
  };
};

export const advancedToSimple = (
  config: WordSpellConfig,
): WordSpellSimpleConfig => {
  const filter = config.source?.filter;
  const region = filter?.region ?? 'aus';

  if (
    typeof filter?.level === 'number' &&
    Array.isArray(filter.phonemesAllowed)
  ) {
    const out: LevelGraphemeUnit[] = [];
    for (let lvl = 1; lvl <= filter.level; lvl++) {
      for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
        if (filter.phonemesAllowed.includes(u.p)) {
          out.push(u);
        }
      }
    }
    return {
      configMode: 'simple',
      selectedUnits: out,
      region,
      inputMethod: config.inputMethod,
    };
  }

  return {
    configMode: 'simple',
    selectedUnits: defaultSelection(),
    region,
    inputMethod: config.inputMethod,
  };
};
