import { describe, expect, it } from 'vitest';
import { suggestCustomGameName } from './suggest-custom-game-name';

describe('suggestCustomGameName', () => {
  it('returns "My <title>" when there are no existing names', () => {
    expect(suggestCustomGameName('Word Spell', [])).toBe(
      'My Word Spell',
    );
  });

  it('appends #2 when the base name is taken', () => {
    expect(suggestCustomGameName('Word Spell', ['My Word Spell'])).toBe(
      'My Word Spell #2',
    );
  });

  it('finds the first free slot when multiple exist', () => {
    expect(
      suggestCustomGameName('Word Spell', [
        'My Word Spell',
        'My Word Spell #2',
        'My Word Spell #4',
      ]),
    ).toBe('My Word Spell #3');
  });

  it('ignores unrelated names', () => {
    expect(
      suggestCustomGameName('Word Spell', [
        'Something else',
        'Easy Mode',
      ]),
    ).toBe('My Word Spell');
  });
});
