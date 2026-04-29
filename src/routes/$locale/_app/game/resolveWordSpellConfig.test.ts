import { describe, expect, it } from 'vitest';
import { resolveWordSpellConfig } from './$gameId';

describe('resolveWordSpellConfig — mode-driven defaults', () => {
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

  it('returns library-sourced recall when saved is null', () => {
    const resolved = resolveWordSpellConfig(null);
    expect(resolved.mode).toBe('recall');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.rounds).toBeUndefined();
  });

  it('returns library-sourced recall for an advanced saved config without mode', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.mode).toBe('recall');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.rounds).toBeUndefined();
  });

  it('preserves picture mode + emoji rounds when saved.mode === "picture"', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.mode).toBe('picture');
    expect(resolved.rounds?.length).toBe(8);
    expect(resolved.source).toBeUndefined();
  });

  it('drops explicit rounds when advanced saved config explicitly sets recall + source', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'recall',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: [
            { g: 's', p: 's' },
            { g: 'a', p: 'æ' },
            { g: 't', p: 't' },
            { g: 'p', p: 'p' },
            { g: 'i', p: 'ɪ' },
            { g: 'n', p: 'n' },
          ],
          phonemesRequired: ['s'],
        },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source).toEqual(saved.source);
    expect(resolved.rounds ?? []).toEqual([]);
  });

  it('drops source when picture mode is explicitly chosen', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      source: {
        type: 'word-library',
        filter: { region: 'aus', graphemesAllowed: [{ g: 's', p: 's' }] },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source).toBeUndefined();
    expect(resolved.rounds?.length).toBeGreaterThan(0);
  });
});
