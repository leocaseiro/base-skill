import { describe, expect, it } from 'vitest';
import { configToChips } from './config-chips';

describe('configToChips', () => {
  it('returns chips for Spell It!', () => {
    const chips = configToChips('word-spell', {
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['m', 'd', 'g'],
        },
      },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['Level 2', 'm, d, g', '✋ Drag']);
  });

  it('truncates long phoneme lists', () => {
    const chips = configToChips('word-spell', {
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['m', 'd', 'g', 'o', 'c'],
        },
      },
      inputMethod: 'type',
    });
    expect(chips[1]).toBe('m, d, g…');
  });

  it('returns chips for Match the Number!', () => {
    const chips = configToChips('number-match', {
      mode: 'numeral-to-group',
      range: { min: 1, max: 10 },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['numeral → group', '1–10', '✋ Drag']);
  });

  it('returns chips for Count in Order', () => {
    const chips = configToChips('sort-numbers', {
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2 },
      inputMethod: 'drag',
    });
    expect(chips).toEqual(['🚀 Up', '5 numbers', '2s', '✋ Drag']);
  });
});
