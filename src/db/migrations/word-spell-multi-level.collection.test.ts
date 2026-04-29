import { describe, expect, it } from 'vitest';
import { migrateWordSpellConfig } from './word-spell-multi-level';
import { customGamesSchema } from '@/db/schemas/custom_games';
import { savedGameConfigsSchema } from '@/db/schemas/saved_game_configs';

/**
 * In-memory RxDB does not run migrationStrategies on insert, so we:
 * 1. Verify schema versions are bumped (proving migration slots exist).
 * 2. Run migrateWordSpellConfig against full collection-shaped docs to
 *    confirm the function handles the complete document structure.
 */
describe('word-spell multi-level migration — collection round-trip', () => {
  it('saved_game_configs schema is at version 3', () => {
    expect(savedGameConfigsSchema.version).toBe(3);
  });

  it('custom_games schema is at version 2', () => {
    expect(customGamesSchema.version).toBe(2);
  });

  it('migrates a legacy saved_game_configs simple-config doc on read', () => {
    const legacyDoc = {
      id: 'last:anonymous:word-spell',
      profileId: 'anonymous',
      gameId: 'word-spell',
      name: 'Last session',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: ['s', 'm'],
        inputMethod: 'drag',
      },
      createdAt: new Date().toISOString(),
      color: 'indigo',
    };

    const migrated = migrateWordSpellConfig(legacyDoc);
    const config = migrated.config as Record<string, unknown>;
    expect(Array.isArray(config.selectedUnits)).toBe(true);
    expect(
      (config.selectedUnits as { p: string }[]).every(
        (u) => u.p === 's' || u.p === 'm',
      ),
    ).toBe(true);
    expect((config.selectedUnits as unknown[]).length).toBeGreaterThan(
      0,
    );
  });

  it('migrates a legacy custom_games full-config doc on read', () => {
    const legacyDoc = {
      id: 'cg-1',
      profileId: 'anonymous',
      gameId: 'word-spell',
      name: 'My WS',
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
      createdAt: new Date().toISOString(),
      color: 'indigo',
    };

    const migrated = migrateWordSpellConfig(legacyDoc);
    const config = migrated.config as Record<string, unknown>;
    const units = config.selectedUnits as { g: string; p: string }[];
    expect(units).toContainEqual(
      expect.objectContaining({ g: 's', p: 's' }),
    );
    expect(units).toContainEqual(
      expect.objectContaining({ g: 'c', p: 's' }),
    );
  });

  it('preserves non-word-spell docs in saved_game_configs', () => {
    const doc = {
      id: 'last:anonymous:sort-numbers',
      profileId: 'anonymous',
      gameId: 'sort-numbers',
      name: 'Sort Numbers',
      config: { difficulty: 'easy' },
      createdAt: new Date().toISOString(),
      color: 'teal',
    };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });
});
