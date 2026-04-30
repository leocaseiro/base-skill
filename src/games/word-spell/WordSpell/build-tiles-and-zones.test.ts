import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { buildTilesAndZones } from './build-tiles-and-zones.js';

describe('buildTilesAndZones', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates zones with correct expectedValues for a word', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { zones } = buildTilesAndZones('cent', 'letter');
    expect(zones.map((z) => z.expectedValue)).toEqual([
      'c',
      'e',
      'n',
      't',
    ]);
  });

  it('creates one tile per letter', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { tiles } = buildTilesAndZones('cent', 'letter');
    expect(tiles).toHaveLength(4);
    expect(tiles.map((t) => t.value).toSorted()).toEqual([
      'c',
      'e',
      'n',
      't',
    ]);
  });

  it('never displays tiles in the correct spelling order', () => {
    // "cent" alphabetically sorted (old behavior) = c,e,n,t = correct order
    // new behavior: must avoid the correct order
    const correctOrder = ['c', 'e', 'n', 't'];
    for (let i = 0; i < 30; i++) {
      vi.restoreAllMocks();
      const { tiles } = buildTilesAndZones('cent', 'letter');
      const tileValues = tiles.map((t) => t.value);
      expect(tileValues).not.toEqual(correctOrder);
    }
  });

  it('each tile has a unique id', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { tiles } = buildTilesAndZones('cent', 'letter');
    const ids = new Set(tiles.map((t) => t.id));
    expect(ids.size).toBe(4);
  });

  it('zones have correct structure', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { zones } = buildTilesAndZones('cat', 'letter');
    expect(zones[0]).toMatchObject({
      id: 'z0',
      index: 0,
      expectedValue: 'c',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    });
  });

  it('handles single-letter words', () => {
    vi.mocked(Math.random).mockReturnValue(0.99);
    const { tiles, zones } = buildTilesAndZones('a', 'letter');
    expect(tiles).toHaveLength(1);
    expect(zones).toHaveLength(1);
  });

  it('handles syllable tileUnit', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { tiles, zones } = buildTilesAndZones(
      'butter-fly',
      'syllable',
    );
    expect(zones.map((z) => z.expectedValue)).toEqual([
      'BUTTER',
      'FLY',
    ]);
    expect(tiles).toHaveLength(2);
  });
});
