import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const buildSelectedUnits = (
  level: number,
  phonemesAllowed: readonly string[],
): LevelGraphemeUnit[] => {
  const out: LevelGraphemeUnit[] = [];
  for (let lvl = 1; lvl <= level; lvl++) {
    for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
      if (phonemesAllowed.includes(u.p)) out.push(u);
    }
  }
  return out;
};

export const migrateWordSpellConfig = (
  doc: Record<string, unknown>,
): Record<string, unknown> => {
  if (doc.gameId !== 'word-spell') return doc;

  const config = doc.config as Record<string, unknown> | undefined;
  if (!config) return doc;
  if (Array.isArray(config.selectedUnits)) return doc;

  if (
    config.configMode === 'simple' &&
    typeof config.level === 'number' &&
    Array.isArray(config.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          config.level,
          config.phonemesAllowed as string[],
        ),
      },
    };
  }

  const source = config.source as
    | { filter?: { level?: number; phonemesAllowed?: string[] } }
    | undefined;
  if (
    source?.filter &&
    typeof source.filter.level === 'number' &&
    Array.isArray(source.filter.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          source.filter.level,
          source.filter.phonemesAllowed,
        ),
      },
    };
  }

  return doc;
};
