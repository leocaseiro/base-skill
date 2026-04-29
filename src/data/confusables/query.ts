import confusableSetsJson from './confusable-sets.json';
import type {
  ConfusableRelationship,
  ConfusableSet,
  RelationshipType,
} from './types';

const RELATIONSHIP_TYPES: ReadonlySet<RelationshipType> = new Set([
  'mirror-horizontal',
  'mirror-vertical',
  'rotation-180',
  'visual-similarity',
  'transposition',
]);

const isRelationshipType = (value: string): value is RelationshipType =>
  RELATIONSHIP_TYPES.has(value as RelationshipType);

const normalizeRelationship = (
  relationship: (typeof confusableSetsJson)[number]['relationships'][number],
): ConfusableRelationship | null => {
  if (relationship.pair.length !== 2) return null;
  if (!isRelationshipType(relationship.type)) return null;
  const left = relationship.pair[0];
  const right = relationship.pair[1];
  if (left === undefined || right === undefined) return null;

  return {
    pair: [left, right],
    type: relationship.type,
  };
};

const normalizeSet = (
  set: (typeof confusableSetsJson)[number],
): ConfusableSet => ({
  id: set.id,
  name: set.name,
  members: [...set.members],
  relationships: set.relationships
    .map((relationship) => normalizeRelationship(relationship))
    .filter(
      (relationship): relationship is ConfusableRelationship =>
        relationship !== null,
    ),
});

const CONFUSABLE_SETS: ConfusableSet[] = confusableSetsJson.map((set) =>
  normalizeSet(set),
);

let memberToSetIndexes: Map<string, number[]> | null = null;

const getIndex = (): Map<string, number[]> => {
  if (memberToSetIndexes) return memberToSetIndexes;

  const next = new Map<string, number[]>();
  for (const [setIndex, set] of CONFUSABLE_SETS.entries()) {
    for (const member of set.members) {
      const indexes = next.get(member) ?? [];
      indexes.push(setIndex);
      next.set(member, indexes);
    }
  }

  memberToSetIndexes = next;
  return next;
};

export const getAllSets = (): ConfusableSet[] =>
  CONFUSABLE_SETS.map((set) => ({
    ...set,
    members: [...set.members],
    relationships: set.relationships.map((relationship) => ({
      ...relationship,
      pair: [...relationship.pair] as [string, string],
    })),
  }));

export const getConfusableSet = (
  setId: string,
): ConfusableSet | undefined => {
  const set = CONFUSABLE_SETS.find(
    (candidate) => candidate.id === setId,
  );
  if (!set) return undefined;
  return {
    ...set,
    members: [...set.members],
    relationships: set.relationships.map((relationship) => ({
      ...relationship,
      pair: [...relationship.pair] as [string, string],
    })),
  };
};

export const getConfusablesFor = (
  member: string,
  options?: { type?: RelationshipType },
): string[] => {
  if (!member) return [];

  const setIndexes = getIndex().get(member);
  if (!setIndexes || setIndexes.length === 0) return [];

  const results = new Set<string>();
  for (const setIndex of setIndexes) {
    const set = CONFUSABLE_SETS[setIndex];
    if (!set) continue;

    for (const relationship of set.relationships) {
      if (
        options?.type !== undefined &&
        relationship.type !== options.type
      ) {
        continue;
      }

      const [left, right] = relationship.pair;
      if (left === member) {
        results.add(right);
      } else if (right === member) {
        results.add(left);
      }
    }
  }

  return [...results];
};
