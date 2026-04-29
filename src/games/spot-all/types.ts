import type { RelationshipType } from '@/data/confusables/types';
import type { ConfigField } from '@/lib/config-fields';

export type SpotAllSimpleConfig = {
  configMode: 'simple';
  difficulty: 'easy' | 'medium' | 'hard';
};

export interface SpotAllVisualVariation {
  fontFamily: string;
  fontSizePx: number;
  color: string;
}

export interface SpotAllTile {
  id: string;
  label: string;
  isCorrect: boolean;
  transform?: string;
  visualVariation?: SpotAllVisualVariation;
}

export interface SpotAllRound {
  target: string;
  tiles: SpotAllTile[];
  correctCount: number;
}

export interface SpotAllConfig {
  gameId: 'spot-all';
  component: 'SpotAll';
  configMode?: 'simple' | 'advanced';
  totalRounds: number;
  roundsInOrder?: boolean;
  ttsEnabled: boolean;
  targetSetIds: string[];
  relationshipTypes: RelationshipType[];
  correctTileCount: number;
  distractorCount: number;
  visualVariationEnabled: boolean;
}

export const spotAllConfigFields: ConfigField[] = [
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'number',
    key: 'correctTileCount',
    label: 'Correct tiles',
    min: 1,
    max: 8,
  },
  {
    type: 'number',
    key: 'distractorCount',
    label: 'Distractor tiles',
    min: 1,
    max: 16,
  },
  {
    type: 'checkbox',
    key: 'visualVariationEnabled',
    label: 'Visual variation',
  },
];
