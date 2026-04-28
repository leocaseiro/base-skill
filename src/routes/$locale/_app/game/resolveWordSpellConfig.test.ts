import { describe, expect, it } from 'vitest';
import { resolveWordSpellConfig } from './$gameId';

describe('resolveWordSpellConfig', () => {
  it('preserves source and drops explicit rounds for simple-mode saved configs', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'simple',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['s', 't'],
        },
      },
      inputMethod: 'drag',
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.configMode).toBe('simple');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.source?.filter.region).toBe('aus');
    expect(resolved.source?.filter.phonemesRequired).toContain('s');
    expect(resolved.source?.filter.phonemesRequired).toContain('t');
    expect(resolved.source?.filter.graphemesAllowed).toBeDefined();
    expect(resolved.rounds ?? []).toEqual([]);
    expect(resolved.roundsInOrder).toBe(false);
  });

  it('leaves advanced saved configs alone (emoji rounds preserved)', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.rounds).toBeDefined();
    expect(resolved.rounds?.length).toBe(4);
    expect(resolved.source).toBeUndefined();
  });

  it('drops explicit rounds when advanced saved config has a source', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 2 },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source).toEqual(saved.source);
    expect(resolved.rounds ?? []).toEqual([]);
  });

  it('returns emoji-based default when saved is null', () => {
    const resolved = resolveWordSpellConfig(null);
    expect(resolved.rounds?.length).toBe(8);
    expect(resolved.source).toBeUndefined();
  });
});
