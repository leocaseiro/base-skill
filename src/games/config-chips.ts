import { inputMethodLabel } from './simple-labels';
import type { InputMethod } from './simple-labels';

const chipsForWordSpell = (
  config: Record<string, unknown>,
): string[] => {
  const source = config.source as
    | {
        filter?: {
          level?: number;
          phonemesAllowed?: string[];
          graphemesAllowed?: { g: string; p: string }[];
        };
      }
    | undefined;
  const filter = source?.filter;
  const chips: string[] = [];
  if (typeof filter?.level === 'number') {
    chips.push(`Level ${filter.level}`);
  }
  const phonemes = filter?.phonemesAllowed;
  const graphemes = filter?.graphemesAllowed?.map((u) => u.g);
  const sounds = phonemes ?? graphemes ?? [];
  if (sounds.length > 0) {
    const shown = sounds.slice(0, 3).join(', ');
    chips.push(sounds.length > 3 ? `${shown}…` : shown);
  }
  return chips;
};

const chipsForNumberMatch = (
  config: Record<string, unknown>,
): string[] => {
  const chips: string[] = [];
  if (typeof config.mode === 'string') {
    chips.push(config.mode.replace('-to-', ' → ').replaceAll('-', ' '));
  }
  const range = config.range as
    | { min?: number; max?: number }
    | undefined;
  if (
    range &&
    typeof range.min === 'number' &&
    typeof range.max === 'number'
  ) {
    chips.push(`${range.min}–${range.max}`);
  }
  return chips;
};

const chipsForSortNumbers = (
  config: Record<string, unknown>,
): string[] => {
  const chips: string[] = [];
  if (config.direction === 'ascending') chips.push('🚀 Up');
  else if (config.direction === 'descending') chips.push('🛝 Down');
  if (typeof config.quantity === 'number') {
    chips.push(`${config.quantity} numbers`);
  }
  const skip = config.skip as { step?: number } | undefined;
  if (skip && typeof skip.step === 'number') {
    chips.push(`${skip.step}s`);
  }
  return chips;
};

export const configToChips = (
  gameId: string,
  config: Record<string, unknown>,
): string[] => {
  const chips = (() => {
    switch (gameId) {
      case 'word-spell': {
        return chipsForWordSpell(config);
      }
      case 'number-match': {
        return chipsForNumberMatch(config);
      }
      case 'sort-numbers': {
        return chipsForSortNumbers(config);
      }
      default: {
        return [];
      }
    }
  })();

  const input = config.inputMethod as InputMethod | undefined;
  if (input === 'drag' || input === 'type' || input === 'both') {
    const { emoji, label } = inputMethodLabel(input);
    chips.push(`${emoji} ${label}`);
  }
  return chips;
};
