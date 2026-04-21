import { describe, expect, it } from 'vitest';
import {
  WORD_SPELL_CONTENT_MARKER,
  buildWordSpellInitialContent,
  hasWordSpellPersistedContent,
  isDraftAlignedWithRound,
  sortedLetters,
} from './word-spell-initial-content';
import type { WordSpellRound } from '../types';

const rounds: WordSpellRound[] = [
  { word: 'cat', emoji: '🐱' },
  { word: 'pant', emoji: '👖' },
  { word: 'sit', emoji: '🪑' },
];

describe('buildWordSpellInitialContent', () => {
  it('copies rounds and round order deterministically', () => {
    const content = buildWordSpellInitialContent({
      rounds,
      roundOrder: [2, 0, 1],
      tileUnit: 'letter',
      mode: 'picture',
    });

    expect(content).toEqual({
      wordSpellRounds: rounds,
      roundOrder: [2, 0, 1],
      tileUnit: 'letter',
      mode: 'picture',
    });
  });

  it('returns a defensive copy so callers cannot mutate persisted state', () => {
    const sourceRounds = [{ word: 'cat' }];
    const sourceOrder = [0];
    const content = buildWordSpellInitialContent({
      rounds: sourceRounds,
      roundOrder: sourceOrder,
      tileUnit: 'letter',
      mode: 'picture',
    });

    sourceRounds.push({ word: 'dog' });
    sourceOrder.push(1);
    content.wordSpellRounds[0]!.word = 'mutated';

    expect(content.wordSpellRounds).toHaveLength(1);
    expect(content.roundOrder).toEqual([0]);
    expect(sourceRounds.at(-1)?.word).toBe('dog');
  });

  it('stores the payload under the documented marker key', () => {
    const content = buildWordSpellInitialContent({
      rounds,
      roundOrder: [0, 1, 2],
      tileUnit: 'letter',
      mode: 'picture',
    });
    expect(WORD_SPELL_CONTENT_MARKER).toBe('wordSpellRounds');
    expect(content.wordSpellRounds).toEqual(rounds);
  });
});

describe('hasWordSpellPersistedContent', () => {
  it('is false for the engine placeholder (Q1/Q2/Q3 — A/B/C)', () => {
    const placeholder = {
      rounds: [
        { id: 'r1', prompt: { en: 'Question 1' }, correctAnswer: 'A' },
        { id: 'r2', prompt: { en: 'Question 2' }, correctAnswer: 'B' },
      ],
    };
    expect(hasWordSpellPersistedContent(placeholder)).toBe(false);
  });

  it('is false for null / undefined inputs', () => {
    expect(hasWordSpellPersistedContent(null)).toBe(false);
    // eslint-disable-next-line unicorn/no-useless-undefined -- exercising the `undefined` overload explicitly
    expect(hasWordSpellPersistedContent(undefined)).toBe(false);
  });

  it('is true when wordSpellRounds and roundOrder are present', () => {
    const content = buildWordSpellInitialContent({
      rounds,
      roundOrder: [0, 1, 2],
      tileUnit: 'letter',
      mode: 'picture',
    });
    expect(
      hasWordSpellPersistedContent(
        content as unknown as Record<string, unknown>,
      ),
    ).toBe(true);
  });

  it('is false when wordSpellRounds is empty', () => {
    expect(
      hasWordSpellPersistedContent({
        wordSpellRounds: [],
        roundOrder: [],
      }),
    ).toBe(false);
  });
});

describe('isDraftAlignedWithRound', () => {
  it('reproduces the real desync: pant-draft vs sit-word → not aligned', () => {
    // Real captured symptom: tiles spelled "pant" on screen while the round
    // word was "sit" (fixture: session dMse6efjqDcJ4qanftGqY, roundIndex 1,
    // draft allTiles = a,n,p,t but regenerated roundOrder produced sit).
    expect(
      isDraftAlignedWithRound({
        draftTileValues: ['a', 'n', 'p', 't'],
        roundWord: 'sit',
      }),
    ).toBe(false);
  });

  it('is true when draft letters match the round word', () => {
    expect(
      isDraftAlignedWithRound({
        draftTileValues: ['p', 'a', 'n', 't'],
        roundWord: 'pant',
      }),
    ).toBe(true);
    expect(
      isDraftAlignedWithRound({
        draftTileValues: ['t', 'a', 'c'],
        roundWord: 'cat',
      }),
    ).toBe(true);
  });

  it('is false when tile counts differ', () => {
    expect(
      isDraftAlignedWithRound({
        draftTileValues: ['c', 'a', 't', 's'],
        roundWord: 'cat',
      }),
    ).toBe(false);
  });

  it('is false for empty draft tiles or empty round word', () => {
    expect(
      isDraftAlignedWithRound({
        draftTileValues: [],
        roundWord: 'cat',
      }),
    ).toBe(false);
    expect(
      isDraftAlignedWithRound({
        draftTileValues: ['c', 'a', 't'],
        roundWord: '',
      }),
    ).toBe(false);
  });
});

describe('sortedLetters', () => {
  it('sorts letters case-insensitively', () => {
    expect(sortedLetters('pant')).toBe('anpt');
    expect(sortedLetters('PANT')).toBe('anpt');
    expect(sortedLetters('cat')).toBe('act');
  });

  it('preserves repeated letters so tile counts stay equal', () => {
    expect(sortedLetters('spell')).toBe('ellps');
  });
});
