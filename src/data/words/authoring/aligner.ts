import type { CurriculumEntry, Grapheme } from '../types';

export interface AlignedGrapheme extends Grapheme {
  confidence: number;
}

const ausLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  '../curriculum/aus/level*.json',
  { eager: true },
);

const SPLIT_DIGRAPHS = ['a_e', 'i_e', 'o_e', 'u_e', 'e_e'] as const;

interface Corpus {
  gpFreq: Map<string, Map<string, number>>;
  maxFreqPerPhoneme: Map<string, number>;
  knownMultiLetter: Set<string>;
}

const buildCorpus = (): Corpus => {
  const gpFreq = new Map<string, Map<string, number>>();
  const maxFreqPerPhoneme = new Map<string, number>();
  const knownMultiLetter = new Set<string>();

  for (const loader of Object.values(ausLoaders)) {
    for (const entry of loader.default) {
      for (const g of entry.graphemes) {
        const key = g.g;
        const inner = gpFreq.get(key) ?? new Map<string, number>();
        const next = (inner.get(g.p) ?? 0) + 1;
        inner.set(g.p, next);
        gpFreq.set(key, inner);

        maxFreqPerPhoneme.set(
          g.p,
          Math.max(maxFreqPerPhoneme.get(g.p) ?? 0, next),
        );

        if (g.g.length > 1 && !g.g.includes('_')) {
          knownMultiLetter.add(g.g);
        }
      }
    }
  }
  return { gpFreq, maxFreqPerPhoneme, knownMultiLetter };
};

let corpus: Corpus | null = null;
const getCorpus = (): Corpus => {
  if (!corpus) corpus = buildCorpus();
  return corpus;
};

interface Candidate {
  g: string;
  consume: number;
  span?: [number, number];
  isSplitDigraph?: boolean;
}

const enumerateCandidates = (
  word: string,
  letterIdx: number,
  claimed: Set<number>,
  known: Set<string>,
): Candidate[] => {
  const results: Candidate[] = [];
  const remaining = word.length - letterIdx;

  // Multi-letter graphemes from corpus (skip claimed positions)
  const maxLen = Math.min(4, remaining);
  for (let len = maxLen; len >= 2; len -= 1) {
    let hasClaimed = false;
    for (let i = 1; i < len; i += 1) {
      if (claimed.has(letterIdx + i)) {
        hasClaimed = true;
        break;
      }
    }
    if (hasClaimed) continue;
    const g = word.slice(letterIdx, letterIdx + len);
    if (known.has(g)) results.push({ g, consume: len });
  }

  // Doubled consonant: always offer when next letter is identical
  if (
    remaining >= 2 &&
    word[letterIdx] === word[letterIdx + 1] &&
    !claimed.has(letterIdx + 1)
  ) {
    const doubled = word[letterIdx] + word[letterIdx + 1];
    // Only add if not already added via knownMultiLetter above
    if (!results.some((r) => r.g === doubled)) {
      results.push({ g: doubled, consume: 2 });
    }
  }

  // Single letter fallback (always available, skip claimed)
  results.push({ g: word[letterIdx], consume: 1 });

  // Split digraphs (consume only the leading letter; trailing is claimed)
  for (const digraph of SPLIT_DIGRAPHS) {
    const [leading, trailing] = digraph.split('_');
    if (word[letterIdx] !== leading) continue;
    const gapMin = 1;
    const gapMax = 2;
    for (let gap = gapMin; gap <= gapMax; gap += 1) {
      const trailIdx = letterIdx + 1 + gap;
      if (trailIdx >= word.length) continue;
      if (claimed.has(trailIdx)) continue;
      if (word[trailIdx] === trailing) {
        results.push({
          g: digraph,
          consume: 1,
          // span uses [leadingIdx, trailingIdx] — both inclusive indices
          span: [letterIdx, trailIdx],
          isSplitDigraph: true,
        });
      }
    }
  }

  return results;
};

const scoreCandidate = (
  candidate: Candidate,
  phoneme: string,
  { gpFreq, maxFreqPerPhoneme }: Corpus,
): number => {
  const inner = gpFreq.get(candidate.g);
  const count = inner?.get(phoneme) ?? 0;
  if (count > 0) {
    const max = maxFreqPerPhoneme.get(phoneme) ?? 1;
    return count / max;
  }
  // For a doubled consonant (e.g. "tt"), fall back to the single-letter score
  if (candidate.g.length === 2 && candidate.g[0] === candidate.g[1]) {
    const singleInner = gpFreq.get(candidate.g[0]);
    const singleCount = singleInner?.get(phoneme) ?? 0;
    if (singleCount > 0) {
      const max = maxFreqPerPhoneme.get(phoneme) ?? 1;
      return singleCount / max;
    }
  }
  return 0;
};

const nextUnclaimedIdx = (
  idx: number,
  claimed: Set<number>,
): number => {
  let i = idx;
  while (claimed.has(i)) i += 1;
  return i;
};

export const align = (
  word: string,
  phonemes: string[],
): AlignedGrapheme[] => {
  const c = getCorpus();
  const claimed = new Set<number>();
  const out: AlignedGrapheme[] = [];
  let letterIdx = 0;
  let phonemeIdx = 0;

  while (letterIdx < word.length && phonemeIdx < phonemes.length) {
    letterIdx = nextUnclaimedIdx(letterIdx, claimed);
    if (letterIdx >= word.length) break;

    const phoneme = phonemes[phonemeIdx];
    const candidates = enumerateCandidates(
      word,
      letterIdx,
      claimed,
      c.knownMultiLetter,
    );

    // Compute remaining letters (excluding claimed) and remaining phonemes
    let lettersLeft = 0;
    for (let i = letterIdx; i < word.length; i += 1) {
      if (!claimed.has(i)) lettersLeft += 1;
    }
    const phonemesLeft = phonemes.length - phonemeIdx;
    const needsLonger = lettersLeft > phonemesLeft;

    let best: Candidate = candidates.at(-1);
    let bestScore = scoreCandidate(best, phoneme, c);

    for (const cand of candidates) {
      const score = scoreCandidate(cand, phoneme, c);
      // When more letters than phonemes remain, prefer longer graphemes on tie
      const isBetter =
        needsLonger && cand.consume > best.consume
          ? score >= bestScore
          : score > bestScore;
      if (isBetter) {
        best = cand;
        bestScore = score;
      }
    }

    const confidence = bestScore > 0 ? Math.min(bestScore, 1) : 0.2;

    out.push({
      g: best.g,
      p: phoneme,
      span: best.span,
      confidence,
    });

    if (best.isSplitDigraph && best.span) {
      // Claim the trailing letter index
      claimed.add(best.span[1]);
      letterIdx = letterIdx + best.consume;
    } else {
      letterIdx = letterIdx + best.consume;
    }
    phonemeIdx += 1;
  }

  // Absorb any remaining unclaimed letters into the last grapheme
  if (out.length > 0) {
    const remaining: string[] = [];
    for (let i = letterIdx; i < word.length; i += 1) {
      if (!claimed.has(i)) remaining.push(word[i]);
    }
    if (remaining.length > 0) {
      const last = out.at(-1);
      out[out.length - 1] = {
        ...last,
        g: `${last.g}${remaining.join('')}`,
      };
    }
  }

  return out;
};

export const __resetCorpusForTests = (): void => {
  corpus = null;
};
