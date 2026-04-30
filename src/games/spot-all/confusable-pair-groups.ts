import type { RelationshipType } from '@/data/confusables/types';
import {
  getAllReversibles,
  getAllSets,
} from '@/data/confusables/query';

export type ConfusableGroupId = RelationshipType | 'reversible';

export type ConfusableGroupChip =
  | { kind: 'pair'; pair: [string, string]; type: RelationshipType }
  | { kind: 'tripleSet'; members: readonly [string, string, string] }
  | { kind: 'reversible'; char: string };

export interface ConfusableGroup {
  id: ConfusableGroupId;
  chips: ConfusableGroupChip[];
}

const ORDER: ConfusableGroupId[] = [
  'mirror-horizontal',
  'mirror-vertical',
  'rotation-180',
  'visual-similarity',
  'transposition',
  'reversible',
];

const isTripleSet = (members: string[]): boolean =>
  members.length === 3;

const buildRelationshipGroups = (): Map<
  RelationshipType,
  ConfusableGroupChip[]
> => {
  const groups = new Map<RelationshipType, ConfusableGroupChip[]>();

  for (const set of getAllSets()) {
    // 3-way visual-similarity sets like il1 collapse into a single tripleSet chip.
    if (
      isTripleSet(set.members) &&
      set.relationships.every((r) => r.type === 'visual-similarity')
    ) {
      const chips = groups.get('visual-similarity') ?? [];
      chips.push({
        kind: 'tripleSet',
        members: [set.members[0]!, set.members[1]!, set.members[2]!],
      });
      groups.set('visual-similarity', chips);
      continue;
    }

    for (const rel of set.relationships) {
      const chips = groups.get(rel.type) ?? [];
      chips.push({
        kind: 'pair',
        pair: [rel.pair[0], rel.pair[1]],
        type: rel.type,
      });
      groups.set(rel.type, chips);
    }
  }

  return groups;
};

const buildReversibleChips = (): ConfusableGroupChip[] =>
  getAllReversibles().map((r) => ({
    kind: 'reversible' as const,
    char: r.char,
  }));

const RELATIONSHIP_GROUPS = buildRelationshipGroups();

export const CONFUSABLE_GROUPS: ConfusableGroup[] = ORDER.map((id) => ({
  id,
  chips:
    id === 'reversible'
      ? buildReversibleChips()
      : (RELATIONSHIP_GROUPS.get(id) ?? []),
}));
