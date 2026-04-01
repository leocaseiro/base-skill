import { describe, expect, it } from 'vitest';
import { GAME_CATALOG } from './registry';
import type { GameLevel, GameSubject } from './registry';

const VALID_LEVELS: GameLevel[] = ['PK', 'K', '1', '2', '3', '4'];
const VALID_SUBJECTS: GameSubject[] = ['math', 'reading', 'letters'];

describe('GAME_CATALOG', () => {
  it('has stable ids and title keys', () => {
    expect(GAME_CATALOG.length).toBeGreaterThanOrEqual(1);
    for (const g of GAME_CATALOG) {
      expect(g.id).toMatch(/^[a-z0-9-]+$/);
      expect(g.titleKey).toBeTruthy();
    }
  });

  it('every entry has at least one valid level', () => {
    for (const g of GAME_CATALOG) {
      expect(g.levels.length).toBeGreaterThan(0);
      for (const lvl of g.levels) {
        expect(VALID_LEVELS).toContain(lvl);
      }
    }
  });

  it('every entry has a valid subject', () => {
    for (const g of GAME_CATALOG) {
      expect(VALID_SUBJECTS).toContain(g.subject);
    }
  });
});
