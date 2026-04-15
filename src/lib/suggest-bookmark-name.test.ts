import { describe, expect, it } from 'vitest';
import { suggestBookmarkName } from './suggest-bookmark-name';

describe('suggestBookmarkName', () => {
  it('returns "My <title>" when there are no existing names', () => {
    expect(suggestBookmarkName('Word Spell', [])).toBe('My Word Spell');
  });

  it('appends #2 when the base name is taken', () => {
    expect(suggestBookmarkName('Word Spell', ['My Word Spell'])).toBe(
      'My Word Spell #2',
    );
  });

  it('finds the first free slot when multiple exist', () => {
    expect(
      suggestBookmarkName('Word Spell', [
        'My Word Spell',
        'My Word Spell #2',
        'My Word Spell #4',
      ]),
    ).toBe('My Word Spell #3');
  });

  it('ignores unrelated names', () => {
    expect(
      suggestBookmarkName('Word Spell', [
        'Something else',
        'Easy Mode',
      ]),
    ).toBe('My Word Spell');
  });
});
