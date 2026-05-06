// src/routes/$locale/_app/game/$gameId.head.test.ts
import { describe, expect, it } from 'vitest';
import { buildGamePageTitle } from './$gameId';

describe('buildGamePageTitle', () => {
  it('formats a game name with the app suffix', () => {
    expect(buildGamePageTitle('Word Spell')).toBe(
      'Word Spell | BaseSkill',
    );
  });

  it('returns just the app name when no game name is provided', () => {
    expect(buildGamePageTitle(null)).toBe('BaseSkill');
  });

  it('uses custom game name when provided', () => {
    expect(buildGamePageTitle('My Phonics Game')).toBe(
      'My Phonics Game | BaseSkill',
    );
  });
});
