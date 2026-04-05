import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { ConfigField } from '@/lib/config-fields';

export interface SortNumbersConfig extends AnswerGameConfig {
  component: 'SortNumbers';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  /** How many numbers to sort per round */
  quantity: number;
  allowSkips: boolean;
  rounds: SortNumbersRound[];
}

export interface SortNumbersRound {
  sequence: number[];
}

export const sortNumbersConfigFields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
      { value: 'both', label: 'both' },
    ],
  },
  {
    type: 'select',
    key: 'direction',
    label: 'Direction',
    options: [
      { value: 'ascending', label: 'ascending' },
      { value: 'descending', label: 'descending' },
    ],
  },
  {
    type: 'number',
    key: 'quantity',
    label: 'Quantity',
    min: 2,
    max: 8,
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 30,
  },
  { type: 'checkbox', key: 'allowSkips', label: 'Allow skips' },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
