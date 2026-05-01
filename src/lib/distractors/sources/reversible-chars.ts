import type { CssTransform, DistractorSource } from '../types';
import type { ReversibleTransform } from '@/data/confusables/types';
import { getReversalTransform } from '@/data/confusables/query';

const TRANSFORM_MAP: Record<ReversibleTransform, CssTransform> = {
  'mirror-horizontal': 'scaleX(-1)',
  'mirror-vertical': 'scaleY(-1)',
  'rotation-180': 'rotate(180deg)',
};

export const reversibleCharsSource: DistractorSource = {
  id: 'reversible-chars',
  getCandidates(target, { selectedReversibleChars = [] }) {
    if (!selectedReversibleChars.includes(target)) return [];
    const r = getReversalTransform(target);
    if (!r) return [];
    return [
      {
        label: target,
        transform: TRANSFORM_MAP[r.transform],
        sourceId: 'reversible-chars',
        meta: { reversalTransform: r.transform },
      },
    ];
  },
};
