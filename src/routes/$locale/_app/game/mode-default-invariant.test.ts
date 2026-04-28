import { describe, expect, it } from 'vitest';
import { resolveWordSpellConfig } from './$gameId';
import type { WordSpellConfig } from '@/games/word-spell/types';

const assertRecallInvariant = (cfg: WordSpellConfig) => {
  expect(cfg.mode).toBe('recall');
  expect(cfg.source).toBeDefined();
  expect(cfg.source?.type).toBe('word-library');
  expect(cfg.rounds).toBeUndefined();
};

const assertPictureInvariant = (cfg: WordSpellConfig) => {
  expect(cfg.mode).toBe('picture');
  expect(cfg.rounds).toBeDefined();
  expect(cfg.rounds!.length).toBeGreaterThan(0);
  expect(cfg.source).toBeUndefined();
};

describe('mode-default invariant', () => {
  it('null saved config → recall + library, no emoji', () => {
    assertRecallInvariant(resolveWordSpellConfig(null));
  });

  it('saved with only mode=recall → recall + library', () => {
    assertRecallInvariant(
      resolveWordSpellConfig({
        component: 'WordSpell',
        configMode: 'advanced',
        mode: 'recall',
      }),
    );
  });

  it('saved with only mode=picture → picture + rounds, no source', () => {
    assertPictureInvariant(
      resolveWordSpellConfig({
        component: 'WordSpell',
        configMode: 'advanced',
        mode: 'picture',
      }),
    );
  });

  it('saved with mode=recall + leaked rounds → rounds dropped', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'recall',
      rounds: [{ word: 'cat', emoji: '🐱' }],
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: ['s'],
          phonemesRequired: ['s'],
        },
      },
    });
    assertRecallInvariant(cfg);
  });

  it('saved with mode=picture + leaked source → source dropped', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      source: {
        type: 'word-library',
        filter: { region: 'aus', graphemesAllowed: ['s'] },
      },
      rounds: [{ word: 'cat', emoji: '🐱' }],
    });
    assertPictureInvariant(cfg);
  });

  it('simple-mode saved config always resolves to recall + library', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'simple',
      selectedUnits: [{ g: 's', p: 's' }],
      region: 'aus',
      inputMethod: 'drag',
    });
    assertRecallInvariant(cfg);
  });
});
