import { nanoid } from 'nanoid';
import type {
  SpotAllConfig,
  SpotAllRound,
  SpotAllTile,
  SpotAllVisualVariation,
} from './types';
import type { RelationshipType } from '@/data/confusables/types';
import { getAllSets } from '@/data/confusables/query';

type BuildSpotAllRoundOptions = SpotAllConfig & {
  forceTarget?: string;
};

type DistractorCandidate = {
  label: string;
  relationshipType: RelationshipType;
};

const FALLBACK_DISTRACTORS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
];

const VISUAL_VARIATIONS: readonly SpotAllVisualVariation[] = [
  { fontFamily: 'serif', fontSizePx: 42, color: '#2563eb' },
  { fontFamily: 'monospace', fontSizePx: 48, color: '#dc2626' },
  { fontFamily: 'sans-serif', fontSizePx: 44, color: '#059669' },
  { fontFamily: 'cursive', fontSizePx: 46, color: '#7c3aed' },
  { fontFamily: 'system-ui', fontSizePx: 40, color: '#ea580c' },
];

const transformForType = (
  type: RelationshipType,
): string | undefined => {
  switch (type) {
    case 'mirror-horizontal': {
      return 'scaleX(-1)';
    }
    case 'mirror-vertical': {
      return 'scaleY(-1)';
    }
    case 'rotation-180': {
      return 'rotate(180deg)';
    }
    default: {
      return undefined;
    }
  }
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

const pickTarget = (config: BuildSpotAllRoundOptions): string => {
  if (config.forceTarget) return config.forceTarget;

  const sets = getAllSets().filter(
    (set) =>
      config.targetSetIds.length === 0 ||
      config.targetSetIds.includes(set.id),
  );
  const members = sets.flatMap((set) => set.members);
  if (members.length === 0) return 'b';
  return members[Math.floor(Math.random() * members.length)]!;
};

const gatherDistractorCandidates = (
  target: string,
  config: BuildSpotAllRoundOptions,
): DistractorCandidate[] => {
  const filteredSets = getAllSets().filter(
    (set) =>
      set.members.includes(target) &&
      (config.targetSetIds.length === 0 ||
        config.targetSetIds.includes(set.id)),
  );

  const out: DistractorCandidate[] = [];
  for (const set of filteredSets) {
    for (const relationship of set.relationships) {
      if (!config.relationshipTypes.includes(relationship.type))
        continue;

      const [left, right] = relationship.pair;
      if (left === target) {
        out.push({
          label: right,
          relationshipType: relationship.type,
        });
      } else if (right === target) {
        out.push({
          label: left,
          relationshipType: relationship.type,
        });
      }
    }
  }

  const dedup = new Map<string, DistractorCandidate>();
  for (const candidate of out) {
    if (!dedup.has(candidate.label))
      dedup.set(candidate.label, candidate);
  }
  return [...dedup.values()];
};

export const buildSpotAllRound = (
  config: BuildSpotAllRoundOptions,
): SpotAllRound => {
  const target = pickTarget(config);
  const candidates = gatherDistractorCandidates(target, config);

  const distractorCount =
    candidates.length > 0
      ? Math.min(config.distractorCount, candidates.length)
      : config.distractorCount;

  const distractorTiles: SpotAllTile[] =
    candidates.length > 0
      ? shuffle(candidates)
          .slice(0, distractorCount)
          .map((candidate) => ({
            id: nanoid(),
            label: candidate.label,
            isCorrect: false,
            transform: transformForType(candidate.relationshipType),
          }))
      : shuffle(FALLBACK_DISTRACTORS)
          .filter((symbol) => symbol !== target)
          .slice(0, distractorCount)
          .map((label) => ({
            id: nanoid(),
            label,
            isCorrect: false,
          }));

  const correctTiles: SpotAllTile[] = Array.from(
    { length: config.correctTileCount },
    (_, index) => ({
      id: nanoid(),
      label: target,
      isCorrect: true,
      visualVariation: config.visualVariationEnabled
        ? VISUAL_VARIATIONS[index % VISUAL_VARIATIONS.length]
        : undefined,
    }),
  );

  const tiles = shuffle([...correctTiles, ...distractorTiles]);
  return {
    target,
    tiles,
    correctCount: correctTiles.length,
  };
};
