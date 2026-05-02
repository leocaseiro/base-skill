// src/routes/$locale/_app/game/$gameId.head.test.ts
import { describe, expect, it } from 'vitest';
import { buildGamePageTitle } from './$gameId';

describe('buildGamePageTitle', () => {
  it('uses custom game name when provided', () => {
    const title = buildGamePageTitle(
      { en: 'Word Spell' },
      'My Phonics Game',
    );
    expect(title).toBe('My Phonics Game | BaseSkill');
  });

  it('falls back to config title en when no custom name', () => {
    const title = buildGamePageTitle({ en: 'Word Spell' }, null);
    expect(title).toBe('Word Spell | BaseSkill');
  });

  it('uses config title for the current locale if available', () => {
    const title = buildGamePageTitle(
      { en: 'Word Spell', 'pt-BR': 'Soletrar Palavras' },
      null,
      'pt-BR',
    );
    expect(title).toBe('Soletrar Palavras | BaseSkill');
  });

  it('falls back to en when locale key is missing', () => {
    const title = buildGamePageTitle(
      { en: 'Word Spell' },
      null,
      'pt-BR',
    );
    expect(title).toBe('Word Spell | BaseSkill');
  });

  it('uses gameId as last resort when title map is empty', () => {
    const title = buildGamePageTitle({}, null);
    expect(title).toBe('BaseSkill');
  });

  it('custom name takes priority over locale-specific config title', () => {
    const title = buildGamePageTitle(
      { en: 'Word Spell', 'pt-BR': 'Soletrar Palavras' },
      'My Custom',
      'pt-BR',
    );
    expect(title).toBe('My Custom | BaseSkill');
  });
});
