// src/data/words/types.ts

export type Region = 'aus' | 'uk' | 'us' | 'br';

export interface WordCore {
  word: string;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
}

export interface Grapheme {
  g: string;
  p: string;
  span?: [number, number];
}

export interface CurriculumEntry {
  word: string;
  level: number;
  ipa: string;
  graphemes: Grapheme[];
  emoji?: string;
  image?: string;
}

export type Provenance = 'shipped' | 'draft';

export type DraftLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface DraftEntry {
  id: string;
  word: string;
  region: 'aus';
  level: DraftLevel;
  ipa: string;
  syllables: string[];
  syllableCount: number;
  graphemes: Grapheme[];
  variants?: string[];
  emoji?: string;
  image?: string;
  ritaKnown: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WordHit {
  word: string;
  region: Region;
  level: number;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
  ipa?: string;
  graphemes?: Grapheme[];
  emoji?: string;
  image?: string;
  provenance: Provenance;
  draftId?: string;
}

export interface GraphemePairFilter {
  g: string;
  p: string;
}

export interface WordFilter {
  region: Region;
  level?: number;
  levels?: number[];
  levelRange?: [number, number];
  syllableCountEq?: number;
  syllableCountRange?: [number, number];
  graphemesAllowed?: GraphemePairFilter[];
  graphemesRequired?: GraphemePairFilter[];
  phonemesAllowed?: string[];
  phonemesRequired?: string[];
  fallbackToAus?: boolean;
}

export interface FilterResult {
  hits: WordHit[];
  usedFallback?: { from: Region; to: 'aus' };
}

export type WordSpellSource = {
  type: 'word-library';
  filter: WordFilter;
  limit?: number;
};

export type ValidationErrorField =
  | 'word'
  | 'syllables'
  | 'graphemes'
  | 'ipa'
  | 'level';

export interface ValidationError {
  field: ValidationErrorField;
  message: string;
}
