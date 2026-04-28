import { expectTypeOf } from 'vitest';
import type { DraftEntry, Provenance, WordHit } from './types';

expectTypeOf<Provenance>().toEqualTypeOf<'shipped' | 'draft'>();

expectTypeOf<DraftEntry>().toMatchTypeOf<{
  id: string;
  word: string;
  region: 'aus';
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  ipa: string;
  syllables: string[];
  syllableCount: number;
  graphemes: Array<{ g: string; p: string }>;
  ritaKnown: boolean;
  createdAt: string;
  updatedAt: string;
}>();

expectTypeOf<WordHit>().toHaveProperty('provenance');
expectTypeOf<WordHit>().toHaveProperty('draftId');
