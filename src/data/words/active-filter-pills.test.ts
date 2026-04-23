import { describe, expect, it } from 'vitest';
import { deriveActiveFilterPills } from './active-filter-pills';
import type { WordFilter } from './types';

describe('deriveActiveFilterPills', () => {
  it('is empty for a bare filter (region only)', () => {
    const f: WordFilter = { region: 'aus', fallbackToAus: true };
    expect(deriveActiveFilterPills(f, [], '')).toEqual([]);
  });

  it('lists a single levels pill', () => {
    const pills = deriveActiveFilterPills(
      { region: 'aus', levels: [1, 2] },
      [],
      '',
    );
    expect(pills).toEqual([
      { id: 'levels', label: 'L1, L2', clear: 'levels' },
    ]);
  });

  it('lists a syllable-count eq pill', () => {
    const pills = deriveActiveFilterPills(
      { region: 'aus', syllableCountEq: 2 },
      [],
      '',
    );
    expect(pills).toEqual([
      { id: 'syll-eq', label: '2 syl', clear: 'syllableCountEq' },
    ]);
  });

  it('lists grapheme-pair pills (one per pair)', () => {
    const pills = deriveActiveFilterPills(
      { region: 'aus' },
      [{ g: 'c', p: 'k', label: 'c[k]' }],
      '',
    );
    expect(pills).toEqual([
      { id: 'pair:c[k]', label: 'c[k]', clear: 'pair:c[k]' },
    ]);
  });

  it('lists a prefix pill when wordPrefix is set', () => {
    const pills = deriveActiveFilterPills({ region: 'aus' }, [], 'cat');
    expect(pills).toEqual([
      { id: 'prefix', label: 'starts: cat', clear: 'prefix' },
    ]);
  });
});
