import type { RelationshipType } from '@/data/confusables/types';

export type CssTransform =
  | 'scaleX(-1)'
  | 'scaleY(-1)'
  | 'rotate(180deg)';

export interface DistractorCandidate {
  /** Character (or sequence) shown on the tile. */
  label: string;
  /** Optional CSS transform applied to the tile (self-reversal sources only). */
  transform?: CssTransform;
  /** Source ID that produced the candidate (telemetry, debugging). */
  sourceId: string;
  /** Source-specific metadata (e.g., relationship type). */
  meta?: Record<string, unknown>;
}

export interface DistractorSourceContext {
  selectedConfusablePairs?: Array<{
    pair: [string, string];
    type: RelationshipType;
  }>;
  selectedReversibleChars?: string[];
  /** Open extension point for future sources. */
  [key: string]: unknown;
}

export interface DistractorSource {
  id: string;
  getCandidates: (
    target: string,
    ctx: DistractorSourceContext,
  ) => DistractorCandidate[];
}
