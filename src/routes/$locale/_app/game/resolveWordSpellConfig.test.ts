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
    const required = resolved.source?.filter.graphemesRequired ?? [];
    expect(required.some((u) => u.p === 's')).toBe(true);
    expect(required.some((u) => u.p === 't')).toBe(true);
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

  it('returns library-sourced picture mode with hasVisual when saved.mode === "picture"', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.mode).toBe('picture');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.source?.filter.hasVisual).toBe(true);
    expect(resolved.rounds).toBeUndefined();
    expect(resolved.totalRounds).toBe(4);
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

  it('regression: re-derives source.filter from selectedUnits when saved has stale L1 filter', () => {
    const saved = {
      component: 'WordSpell',
      inputMethod: 'drag',
      mode: 'recall',
      selectedUnits: [
        { g: 'sh', p: 'ʃ' },
        { g: 'ch', p: 'tʃ' },
        { g: 'th', p: 'θ' },
        { g: 'th', p: 'ð' },
        { g: 'qu', p: 'kw' },
        { g: 'ng', p: 'ŋ' },
        { g: 'wh', p: 'w' },
        { g: 'ph', p: 'f' },
        { g: 'g', p: 'dʒ' },
        { g: 'c', p: 's' },
      ],
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
          phonemesRequired: ['s', 'æ', 't', 'p', 'ɪ', 'n'],
        },
      },
    };

    const resolved = resolveWordSpellConfig(saved);

    const required = resolved.source?.filter.graphemesRequired ?? [];
    expect(required.some((u) => u.g === 'sh' && u.p === 'ʃ')).toBe(
      true,
    );
    expect(required.some((u) => u.g === 'c' && u.p === 's')).toBe(true);

    expect(resolved.source?.filter.phonemesRequired).toBeUndefined();

    const allowed = resolved.source?.filter.graphemesAllowed ?? [];
    expect(allowed.some((u) => u.g === 'sh' && u.p === 'ʃ')).toBe(true);

    // selectedUnits must survive the round-trip so the picker can read them back.
    expect(resolved.selectedUnits).toEqual(saved.selectedUnits);
  });

  it('advanced mode with selectedUnits re-derives source.filter but preserves totalRounds', () => {
    const units = [
      { g: 'sh', p: 'ʃ' },
      { g: 'ch', p: 'tʃ' },
    ];
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'recall',
      inputMethod: 'drag',
      totalRounds: 8,
      selectedUnits: units,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: [{ g: 's', p: 's' }],
          phonemesRequired: ['s'],
        },
      },
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.totalRounds).toBe(8);
    expect(resolved.configMode).toBe('advanced');

    const required = resolved.source?.filter.graphemesRequired ?? [];
    expect(required.some((u) => u.g === 'sh' && u.p === 'ʃ')).toBe(
      true,
    );
    expect(required.some((u) => u.g === 'ch' && u.p === 'tʃ')).toBe(
      true,
    );

    expect(resolved.source?.filter.phonemesRequired).toBeUndefined();

    expect(resolved.selectedUnits).toEqual(units);
  });

  it('uses source with hasVisual when picture mode is chosen, dropping any leaked source', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: [{ g: 's', p: 's' }],
        },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source?.filter.hasVisual).toBe(true);
    expect(resolved.rounds).toBeUndefined();
  });
});
