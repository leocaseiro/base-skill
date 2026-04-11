export type {
  CurriculumEntry,
  FilterResult,
  Grapheme,
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
