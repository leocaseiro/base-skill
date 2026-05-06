import { describe, expect, it } from 'vitest';
import { compareHomeScreenCardRows } from './home-screen-card-order';
import type { HomeScreenCardSortRow } from './home-screen-card-order';

const sortRows = (
  rows: HomeScreenCardSortRow[],
): HomeScreenCardSortRow[] => rows.toSorted(compareHomeScreenCardRows);

describe('compareHomeScreenCardRows', () => {
  it('places bookmarked defaults before non-bookmarked defaults (stable by catalog index)', () => {
    const rows: HomeScreenCardSortRow[] = [
      { kind: 'default', index: 0, bookmarked: false },
      { kind: 'default', index: 1, bookmarked: true },
      { kind: 'default', index: 2, bookmarked: false },
    ];
    expect(sortRows(rows)).toEqual([
      { kind: 'default', index: 1, bookmarked: true },
      { kind: 'default', index: 0, bookmarked: false },
      { kind: 'default', index: 2, bookmarked: false },
    ]);
  });

  it('places bookmarked customs before non-bookmarked customs', () => {
    const rows: HomeScreenCardSortRow[] = [
      { kind: 'custom', index: 1, bookmarked: false },
      { kind: 'custom', index: 0, bookmarked: true },
    ];
    expect(sortRows(rows)).toEqual([
      { kind: 'custom', index: 0, bookmarked: true },
      { kind: 'custom', index: 1, bookmarked: false },
    ]);
  });

  it('places all bookmarked cards before any non-bookmarked, keeping defaults before customs within each tier', () => {
    const rows: HomeScreenCardSortRow[] = [
      { kind: 'default', index: 0, bookmarked: false },
      { kind: 'custom', index: 0, bookmarked: true },
      { kind: 'default', index: 1, bookmarked: true },
      { kind: 'custom', index: 1, bookmarked: false },
    ];
    expect(sortRows(rows)).toEqual([
      { kind: 'default', index: 1, bookmarked: true },
      { kind: 'custom', index: 0, bookmarked: true },
      { kind: 'default', index: 0, bookmarked: false },
      { kind: 'custom', index: 1, bookmarked: false },
    ]);
  });
});
