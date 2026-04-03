import { describe, expect, it } from 'vitest';
import { filterCatalog, paginateCatalog } from './catalog-utils';
import { GAME_CATALOG } from './registry';

describe('filterCatalog', () => {
  it('returns all entries with empty filter', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(GAME_CATALOG.length);
  });

  it('filters by level — only entries that include the level', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: 'PK',
      subject: '',
    });
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.levels).toContain('PK');
    }
  });

  it('filters by subject', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '',
      subject: 'math',
    });
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.subject).toBe('math');
    }
  });

  it('filters by search query (case-insensitive match on titleKey)', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: 'SPELL',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('word-spell');
  });

  it('returns empty array when nothing matches', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: 'zzznomatch',
      level: '',
      subject: '',
    });
    expect(result).toHaveLength(0);
  });

  it('combines level and subject filters', () => {
    const result = filterCatalog(GAME_CATALOG, {
      search: '',
      level: '1',
      subject: 'math',
    });
    for (const entry of result) {
      expect(entry.levels).toContain('1');
      expect(entry.subject).toBe('math');
    }
  });
});

describe('paginateCatalog', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('returns first page with correct slice', () => {
    const result = paginateCatalog(items, 1, 10);
    expect(result.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
  });

  it('returns last partial page', () => {
    const result = paginateCatalog(items, 3, 10);
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toBe(20);
  });

  it('clamps to last page when requested page exceeds total', () => {
    const result = paginateCatalog(items, 99, 10);
    expect(result.page).toBe(3);
  });

  it('handles empty array — totalPages is 1, items is empty', () => {
    const result = paginateCatalog([], 1, 10);
    expect(result.items).toHaveLength(0);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });
});
