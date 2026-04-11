import type { WordHit } from './types';
import type { WordSpellRound } from '@/games/word-spell/types';

export const toWordSpellRound = (hit: WordHit): WordSpellRound => ({
  word: hit.syllables ? hit.syllables.join('-') : hit.word,
});
