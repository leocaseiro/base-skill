import type { SpotAllVisualVariation } from './visual-variation/pick-variation';
import type { RelationshipType } from '@/data/confusables/types';
import type { ConfigField } from '@/lib/config-fields';
import type { CssTransform } from '@/lib/distractors/types';

export interface SelectedConfusablePair {
  pair: [string, string];
  type: RelationshipType;
}

export interface SpotAllTile {
  id: string;
  label: string;
  isCorrect: boolean;
  transform?: CssTransform;
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
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
  correctTileCount: number;
  distractorCount: number;
  totalRounds: number;
  visualVariationEnabled: boolean;
  enabledFontIds: string[];
  roundsInOrder: boolean;
  ttsEnabled: boolean;
}

export interface SpotAllSimpleConfig {
  configMode: 'simple';
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
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
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
