import type { DistractorCandidate, DistractorSource } from '../types';

export const confusablePairsSource: DistractorSource = {
  id: 'confusable-pairs',
  getCandidates(target, { selectedConfusablePairs = [] }) {
    const out: DistractorCandidate[] = [];
    for (const sel of selectedConfusablePairs) {
      const [left, right] = sel.pair;
      if (left === target) {
        out.push({
          label: right,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      } else if (right === target) {
        out.push({
          label: left,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      }
    }
    return out;
  },
};
