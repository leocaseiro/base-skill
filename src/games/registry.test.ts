import { describe, expect, it } from 'vitest';
import { GAME_CATALOG } from './registry';

describe('GAME_CATALOG', () => {
  it('has stable ids and title keys', () => {
    expect(GAME_CATALOG.length).toBeGreaterThanOrEqual(1);
    for (const g of GAME_CATALOG) {
      expect(g.id).toMatch(/^[a-z0-9-]+$/);
      expect(g.titleKey).toBeTruthy();
    }
  });
});
