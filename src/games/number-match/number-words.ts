import {
  toCardinal as enCardinal,
  toOrdinal as enOrdinal,
} from 'n2words/en-AU';
import {
  toCardinal as ptCardinal,
  toOrdinal as ptOrdinal,
} from 'n2words/pt-PT';

/**
 * Supported app locales for number-word conversion.
 * Maps to the n2words locale modules (en → en-AU, pt-BR → pt-PT).
 */
type NumberWordsLocale = 'en' | 'pt-BR';

const cardinalByLocale: Record<
  NumberWordsLocale,
  (n: number) => string
> = {
  en: (n) => enCardinal(n),
  'pt-BR': (n) => ptCardinal(n),
};

const ordinalByLocale: Record<
  NumberWordsLocale,
  (n: number) => string
> = {
  en: (n) => enOrdinal(n),
  'pt-BR': (n) => ptOrdinal(n),
};

/**
 * Convert a number to its cardinal word representation.
 *
 * @example toCardinalText(7, 'en')     // "seven"
 * @example toCardinalText(7, 'pt-BR')  // "sete"
 */
export const toCardinalText = (
  n: number,
  locale: NumberWordsLocale,
): string => cardinalByLocale[locale](n);

/**
 * Convert a number to its ordinal word representation.
 *
 * @example toOrdinalText(7, 'en')     // "seventh"
 * @example toOrdinalText(7, 'pt-BR')  // "sétimo"
 */
export const toOrdinalText = (
  n: number,
  locale: NumberWordsLocale,
): string => ordinalByLocale[locale](n);

/**
 * Convert a number to its numeric ordinal form (e.g. "7th", "7º").
 *
 * English: 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st, 22nd, 23rd …
 * Portuguese: always appends "º" (e.g. "1º", "7º").
 *
 * @example toOrdinalNumber(7, 'en')     // "7th"
 * @example toOrdinalNumber(1, 'en')     // "1st"
 * @example toOrdinalNumber(7, 'pt-BR')  // "7º"
 */
export const toOrdinalNumber = (
  n: number,
  locale: NumberWordsLocale,
): string => {
  if (locale === 'pt-BR') return `${n}º`;

  // English ordinal suffix
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;

  switch (n % 10) {
    case 1: {
      return `${n}st`;
    }
    case 2: {
      return `${n}nd`;
    }
    case 3: {
      return `${n}rd`;
    }
    default: {
      return `${n}th`;
    }
  }
};
