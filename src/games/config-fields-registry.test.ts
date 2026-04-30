import { describe, expect, it } from 'vitest';
import { isPlayableConfig } from './config-fields-registry';

describe('isPlayableConfig — word-spell', () => {
  it('returns true when at least one unit is selected (recall mode)', () => {
    expect(
      isPlayableConfig('word-spell', {
        mode: 'recall',
        selectedUnits: [{ g: 's', p: 's' }],
      }),
    ).toBe(true);
  });

  it('returns false when no units are selected and mode is recall', () => {
    expect(
      isPlayableConfig('word-spell', {
        mode: 'recall',
        selectedUnits: [],
      }),
    ).toBe(false);
  });

  it('returns false when selectedUnits is missing entirely', () => {
    expect(isPlayableConfig('word-spell', { mode: 'recall' })).toBe(
      false,
    );
  });

  it('returns true in picture mode regardless of selectedUnits', () => {
    expect(
      isPlayableConfig('word-spell', {
        mode: 'picture',
        selectedUnits: [],
      }),
    ).toBe(true);
  });

  it('returns true in sentence-gap mode regardless of selectedUnits', () => {
    expect(
      isPlayableConfig('word-spell', {
        mode: 'sentence-gap',
        selectedUnits: [],
      }),
    ).toBe(true);
  });
});

describe('isPlayableConfig — non-word-spell games', () => {
  it('always returns true for games without a validity rule', () => {
    expect(isPlayableConfig('number-match', {})).toBe(true);
    expect(isPlayableConfig('sort-numbers', { totalRounds: 0 })).toBe(
      true,
    );
  });
});
