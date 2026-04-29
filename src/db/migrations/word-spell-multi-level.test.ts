import { describe, expect, it } from 'vitest';
import { migrateWordSpellConfig } from './word-spell-multi-level';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

describe('migrateWordSpellConfig', () => {
  it('passes through non-WordSpell docs unchanged', () => {
    const doc = { gameId: 'sort-numbers', config: { foo: 1 } };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });

  it('passes through docs that already have selectedUnits', () => {
    const doc = {
      gameId: 'word-spell',
      config: { selectedUnits: [{ g: 's', p: 's' }] },
    };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });

  it('migrates the simple-config legacy shape', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: ['s', 'm'],
        inputMethod: 'drag',
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: { g: string; p: string }[] };
    };
    // Every (g, /s/) and (g, /m/) unit in L1..L2 must be present
    const expected = [
      ...(GRAPHEMES_BY_LEVEL[1] ?? []),
      ...(GRAPHEMES_BY_LEVEL[2] ?? []),
    ].filter((u) => u.p === 's' || u.p === 'm');
    expect(next.config.selectedUnits).toEqual(expected);
  });

  it('migrates the full-config source.filter legacy shape', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'advanced',
        source: {
          type: 'word-library',
          filter: {
            region: 'aus',
            level: 4,
            phonemesAllowed: ['s'],
          },
        },
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: { g: string; p: string }[] };
    };
    const units = next.config.selectedUnits;
    // Cross-level reach preserved: 's' at L1 AND 'c' at L4 (both teach /s/)
    expect(units).toContainEqual(
      expect.objectContaining({ g: 's', p: 's' }),
    );
    expect(units).toContainEqual(
      expect.objectContaining({ g: 'c', p: 's' }),
    );
  });

  it('returns empty selectedUnits when phonemesAllowed is empty', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: [],
        inputMethod: 'drag',
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: unknown[] };
    };
    expect(next.config.selectedUnits).toEqual([]);
  });

  it('passes through hand-authored full configs (no source) unchanged', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'advanced',
        rounds: [{ word: 'cat' }],
      },
    };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });
});
