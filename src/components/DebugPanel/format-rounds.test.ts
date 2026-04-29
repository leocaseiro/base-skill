import { describe, expect, it } from 'vitest';
import { formatRounds } from './format-rounds';

describe('formatRounds', () => {
  it('returns empty columns/rows when rounds is empty', () => {
    expect(formatRounds('word-spell', [])).toEqual({
      columns: [],
      rows: [],
    });
  });

  it('returns empty when rounds is not an array', () => {
    expect(formatRounds('word-spell', null)).toEqual({
      columns: [],
      rows: [],
    });
  });

  it('formats word-spell rounds with word + emoji columns', () => {
    const result = formatRounds('word-spell', [
      { word: 'cat', emoji: '🐱' },
      { word: 'dog' },
    ]);
    expect(result.columns).toEqual(['#', 'word', 'emoji']);
    expect(result.rows).toEqual([
      { index: 0, cells: { '#': '1', word: 'cat', emoji: '🐱' } },
      { index: 1, cells: { '#': '2', word: 'dog', emoji: '' } },
    ]);
  });

  it('formats number-match rounds with value column', () => {
    const result = formatRounds('number-match', [
      { value: 5 },
      { value: 8 },
    ]);
    expect(result.columns).toEqual(['#', 'value']);
    expect(result.rows[0]?.cells.value).toBe('5');
    expect(result.rows[1]?.cells.value).toBe('8');
  });

  it('formats sort-numbers rounds joining sequence/answer arrays', () => {
    const result = formatRounds('sort-numbers', [
      { sequence: [2, 4, 6, 8], answer: [2, 4, 6, 8] },
    ]);
    expect(result.columns).toEqual(['#', 'sequence', 'answer']);
    expect(result.rows[0]?.cells.sequence).toBe('2, 4, 6, 8');
    expect(result.rows[0]?.cells.answer).toBe('2, 4, 6, 8');
  });

  it('falls back to JSON dump for unknown gameId', () => {
    const result = formatRounds('mystery-game', [{ foo: 'bar' }]);
    expect(result.columns).toEqual(['#', 'json']);
    expect(result.rows[0]?.cells.json).toBe('{"foo":"bar"}');
  });
});
