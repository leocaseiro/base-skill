import { describe, expect, it } from 'vitest';
import {
  toCardinalText,
  toOrdinalNumber,
  toOrdinalText,
} from './number-words';

describe('toCardinalText', () => {
  describe('English (en)', () => {
    it.each([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
      [4, 'four'],
      [5, 'five'],
      [6, 'six'],
      [7, 'seven'],
      [8, 'eight'],
      [9, 'nine'],
      [10, 'ten'],
      [11, 'eleven'],
      [12, 'twelve'],
    ] as const)('toCardinalText(%i, "en") → "%s"', (n, expected) => {
      expect(toCardinalText(n, 'en')).toBe(expected);
    });
  });

  describe('Portuguese (pt-BR)', () => {
    it.each([
      [1, 'um'],
      [2, 'dois'],
      [3, 'três'],
      [5, 'cinco'],
      [7, 'sete'],
      [10, 'dez'],
      [12, 'doze'],
    ] as const)('toCardinalText(%i, "pt-BR") → "%s"', (n, expected) => {
      expect(toCardinalText(n, 'pt-BR')).toBe(expected);
    });
  });
});

describe('toOrdinalText', () => {
  describe('English (en)', () => {
    it.each([
      [1, 'first'],
      [2, 'second'],
      [3, 'third'],
      [4, 'fourth'],
      [5, 'fifth'],
      [7, 'seventh'],
      [10, 'tenth'],
      [11, 'eleventh'],
      [12, 'twelfth'],
    ] as const)('toOrdinalText(%i, "en") → "%s"', (n, expected) => {
      expect(toOrdinalText(n, 'en')).toBe(expected);
    });
  });

  describe('Portuguese (pt-BR)', () => {
    it.each([
      [1, 'primeiro'],
      [2, 'segundo'],
      [3, 'terceiro'],
      [5, 'quinto'],
      [7, 'sétimo'],
      [10, 'décimo'],
      [12, 'décimo segundo'],
    ] as const)('toOrdinalText(%i, "pt-BR") → "%s"', (n, expected) => {
      expect(toOrdinalText(n, 'pt-BR')).toBe(expected);
    });
  });
});

describe('toOrdinalNumber', () => {
  describe('English (en)', () => {
    it.each([
      [1, '1st'],
      [2, '2nd'],
      [3, '3rd'],
      [4, '4th'],
      [5, '5th'],
      [7, '7th'],
      [10, '10th'],
      [11, '11th'],
      [12, '12th'],
      [13, '13th'],
      [21, '21st'],
      [22, '22nd'],
      [23, '23rd'],
      [100, '100th'],
      [101, '101st'],
      [111, '111th'],
      [112, '112th'],
      [113, '113th'],
    ] as const)('toOrdinalNumber(%i, "en") → "%s"', (n, expected) => {
      expect(toOrdinalNumber(n, 'en')).toBe(expected);
    });
  });

  describe('Portuguese (pt-BR)', () => {
    it.each([
      [1, '1º'],
      [2, '2º'],
      [3, '3º'],
      [7, '7º'],
      [10, '10º'],
      [12, '12º'],
      [100, '100º'],
    ] as const)(
      'toOrdinalNumber(%i, "pt-BR") → "%s"',
      (n, expected) => {
        expect(toOrdinalNumber(n, 'pt-BR')).toBe(expected);
      },
    );
  });
});
