import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

describe('resolveSimpleConfig', () => {
  it('resolves recall mode + region from selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: L1,
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.mode).toBe('recall');
    expect(full.source?.filter.region).toBe('aus');
  });

  it('derives cumulative graphemesAllowed from maxLevel of selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [{ g: 'sh', p: 'ʃ' }],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    const allowed = full.source?.filter.graphemesAllowed ?? [];
    const hasG = (g: string) => allowed.some((u) => u.g === g);
    expect(hasG('s')).toBe(true);
    expect(hasG('a')).toBe(true);
    expect(hasG('i')).toBe(true);
    expect(hasG('p')).toBe(true);
    expect(hasG('sh')).toBe(true);
    expect(hasG('ai')).toBe(false);
  });

  it('derives graphemesRequired (Y filter) from selected unit pairs', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [{ g: 'sh', p: 'ʃ' }],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.graphemesRequired).toEqual([
      { g: 'sh', p: 'ʃ' },
    ]);
    expect(full.source?.filter.phonemesRequired).toBeUndefined();
    expect(full.source?.filter.phonemesAllowed).toBeUndefined();
  });

  it('keeps each (g, p) pair distinct even when phoneme is shared', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [
        { g: 'c', p: 'k' },
        { g: 'k', p: 'k' },
        { g: 'ck', p: 'k' },
      ],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.graphemesRequired).toEqual([
      { g: 'c', p: 'k' },
      { g: 'k', p: 'k' },
      { g: 'ck', p: 'k' },
    ]);
  });

  it('dedupes when the same (g, p) pair appears twice', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [
        { g: 'c', p: 'k' },
        { g: 'c', p: 'k' },
      ],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.graphemesRequired).toEqual([
      { g: 'c', p: 'k' },
    ]);
  });

  it('falls back to L1 default when selectedUnits is empty', () => {
    const simple = {
      configMode: 'simple',
      selectedUnits: [],
      region: 'aus',
      inputMethod: 'drag',
    } as WordSpellSimpleConfig;
    const full = resolveSimpleConfig(simple);
    const allowed = full.source?.filter.graphemesAllowed ?? [];
    const hasG = (g: string) => allowed.some((u) => u.g === g);
    expect(hasG('s')).toBe(true);
    expect(hasG('m')).toBe(false);
    expect(full.source?.filter.graphemesRequired).toEqual([]);
  });

  it('handles legacy { level, phonemesAllowed } shape via fallback', () => {
    const legacy = {
      configMode: 'simple',
      level: 2,
      phonemesAllowed: ['s', 'm'],
      region: 'aus',
      inputMethod: 'drag',
    } as unknown as WordSpellSimpleConfig;
    const full = resolveSimpleConfig(legacy);
    const required = full.source?.filter.graphemesRequired ?? [];
    expect(required.some((u) => u.p === 's')).toBe(true);
    expect(required.some((u) => u.p === 'm')).toBe(true);
    const allowed = full.source?.filter.graphemesAllowed ?? [];
    const hasG = (g: string) => allowed.some((u) => u.g === g);
    expect(hasG('s')).toBe(true);
    expect(hasG('a')).toBe(true);
    expect(hasG('m')).toBe(true);
  });
});

describe('resolveSimpleConfig pair-based required filter', () => {
  it('emits graphemesRequired so soft-c (c, /s/) does not pull in L1 s-words', async () => {
    const { filterWords } = await import('@/data/words');
    const L4 = GRAPHEMES_BY_LEVEL[4] ?? [];
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [...L4],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    const result = await filterWords(full.source!.filter);
    const l1Only = result.hits.filter((h) =>
      h.graphemes?.every((g) =>
        L1.some((u) => u.g === g.g && u.p === g.p),
      ),
    );
    expect(
      l1Only.map((h) => h.word),
      'L4-only selection must not return pure-L1 words',
    ).toEqual([]);
  });
});

describe('advancedToSimple', () => {
  it('populates selectedUnits from source.filter.{level, phonemesAllowed}', () => {
    const config = {
      gameId: 'word-spell',
      component: 'WordSpell',
      mode: 'recall',
      tileUnit: 'letter',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-manual',
      ttsEnabled: true,
      roundsInOrder: false,
      totalRounds: 4,
      tileBankMode: 'exact',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 1,
          phonemesAllowed: ['s'],
        },
      },
    } as WordSpellConfig;
    const simple = advancedToSimple(config);
    expect(simple.region).toBe('aus');
    expect(simple.selectedUnits).toEqual([{ g: 's', p: 's' }]);
  });

  it('falls back to L1 default when no source is present', () => {
    const config = {
      gameId: 'word-spell',
      component: 'WordSpell',
      mode: 'recall',
      tileUnit: 'letter',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-manual',
      ttsEnabled: true,
      roundsInOrder: false,
      totalRounds: 4,
      tileBankMode: 'exact',
    } as WordSpellConfig;
    const simple = advancedToSimple(config);
    expect(simple.selectedUnits).toEqual(L1);
  });
});
