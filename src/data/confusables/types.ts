export type RelationshipType =
  | 'mirror-horizontal'
  | 'mirror-vertical'
  | 'rotation-180'
  | 'visual-similarity'
  | 'transposition';

export interface ConfusableRelationship {
  pair: [string, string];
  type: RelationshipType;
}

export interface ConfusableSet {
  id: string;
  name: string;
  members: string[];
  relationships: ConfusableRelationship[];
}

export type ReversibleTransform =
  | 'mirror-horizontal'
  | 'mirror-vertical'
  | 'rotation-180';

export interface ReversibleCharacter {
  char: string;
  transform: ReversibleTransform;
}
