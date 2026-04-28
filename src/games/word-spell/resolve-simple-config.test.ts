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

  it('derives phonemesAllowed and graphemesAllowed from selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [
        { g: 's', p: 's' },
        { g: 'a', p: 'æ' },
      ],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.phonemesAllowed).toEqual(['s', 'æ']);
    expect(full.source?.filter.graphemesAllowed).toEqual(['s', 'a']);
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
