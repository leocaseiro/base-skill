import type {
  DistractorCandidate,
  DistractorSource,
  DistractorSourceContext,
} from './types';

const shuffle = <T>(items: T[], rng?: () => number): T[] => {
  const out = [...items];
  const random = rng ?? (() => Math.random());
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};

export const composeDistractors = (
  sources: DistractorSource[],
  target: string,
  ctx: DistractorSourceContext,
  count: number,
  rng?: () => number,
): DistractorCandidate[] => {
  const pool: DistractorCandidate[] = [];
  for (const s of sources) pool.push(...s.getCandidates(target, ctx));

  const seen = new Set<string>();
  const unique = pool.filter((c) => {
    const key = `${c.label}|${c.transform ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return shuffle(unique, rng).slice(0, count);
};
