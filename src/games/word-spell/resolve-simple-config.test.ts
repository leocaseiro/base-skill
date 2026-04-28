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
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    expect(allowed.has('s')).toBe(true);
    expect(allowed.has('a')).toBe(true);
    expect(allowed.has('i')).toBe(true);
    expect(allowed.has('p')).toBe(true);
    expect(allowed.has('sh')).toBe(true);
    expect(allowed.has('ai')).toBe(false);
  });

  it('derives phonemesRequired (Y filter) from selected unit phonemes', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [{ g: 'sh', p: 'ʃ' }],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.phonemesRequired).toEqual(['ʃ']);
    expect(full.source?.filter.phonemesAllowed).toBeUndefined();
  });

  it('dedupes phonemes when multiple units share a phoneme', () => {
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
    expect(full.source?.filter.phonemesRequired).toEqual(['k']);
  });

  it('falls back to L1 default when selectedUnits is empty', () => {
    const simple = {
      configMode: 'simple',
      selectedUnits: [],
      region: 'aus',
      inputMethod: 'drag',
    } as WordSpellSimpleConfig;
    const full = resolveSimpleConfig(simple);
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    expect(allowed.has('s')).toBe(true);
    expect(allowed.has('m')).toBe(false);
    expect(full.source?.filter.phonemesRequired).toEqual([]);
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
    expect(full.source?.filter.phonemesRequired).toContain('s');
    expect(full.source?.filter.phonemesRequired).toContain('m');
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    expect(allowed.has('s')).toBe(true);
    expect(allowed.has('a')).toBe(true);
    expect(allowed.has('m')).toBe(true);
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
