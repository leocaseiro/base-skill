export type {
  CurriculumEntry,
  FilterResult,
  Grapheme,
  GraphemePairFilter,
  Region,
  ValidationError,
  WordCore,
  WordFilter,
  WordHit,
  WordSpellSource,
} from './types';
export type { LevelGraphemeUnit } from './levels';
export {
  ALL_REGIONS,
  cumulativeGraphemes,
  GRAPHEMES_BY_LEVEL,
  graphemePool,
  LEVEL_LABELS,
} from './levels';
export {
  IPA_TO_PHONEME_CODE,
  PHONEME_CODE_TO_IPA,
} from './phoneme-codes';
export {
  makeCurriculumEntry,
  makeGraphemes,
  makeWordCore,
  validateEntry,
} from './builders';
export {
  removeCurriculumEntry,
  removeWordCore,
  upsertCurriculumEntry,
  upsertWordCore,
} from './writer';
export {
  __resetChunkCacheForTests,
  entryMatches,
  filterWords,
} from './filter';
export { toWordSpellRound } from './adapters';
export { sampleHits } from './sample';
export {
  createInMemorySeenWordsStore,
  filterSignature,
  pickWithRecycling,
} from './seen-words';
export type { SeenWordsStore } from './seen-words';
