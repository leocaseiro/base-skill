import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { ConfigField } from '@/lib/config-fields';

export interface NumberMatchRound {
  value: number;
  /** Fluent Emoji path for object-style tiles (e.g. "fluent-emoji/red-apple.svg") */
  objectImage?: string;
}

export interface NumberMatchConfig extends AnswerGameConfig {
  component: 'NumberMatch';
  mode:
    | 'numeral-to-group'
    | 'group-to-numeral'
    | 'numeral-to-word'
    | 'word-to-numeral';
  /** Visual style for quantity/group tiles */
  tileStyle: 'dots' | 'objects' | 'fingers';
  range: { min: number; max: number };
  rounds: NumberMatchRound[];
}

export const numberMatchConfigFields: ConfigField[] = [
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
    key: 'wrongTileBehavior',
    label: 'Wrong tile behaviour',
    options: [
      { value: 'reject', label: 'reject' },
      { value: 'lock-manual', label: 'lock-manual' },
      { value: 'lock-auto-eject', label: 'lock-auto-eject' },
    ],
  },
  {
    type: 'select',
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'numeral-to-group', label: 'numeral → group' },
      { value: 'group-to-numeral', label: 'group → numeral' },
      { value: 'numeral-to-word', label: 'numeral → word' },
      { value: 'word-to-numeral', label: 'word → numeral' },
    ],
  },
  {
    type: 'select',
    key: 'tileStyle',
    label: 'Tile style',
    options: [
      { value: 'dots', label: 'dots' },
      { value: 'objects', label: 'objects' },
      { value: 'fingers', label: 'fingers' },
    ],
  },
  {
    type: 'select',
    key: 'tileBankMode',
    label: 'Tile bank mode',
    options: [
      { value: 'exact', label: 'exact' },
      { value: 'distractors', label: 'distractors' },
    ],
  },
  {
    type: 'number',
    key: 'distractorCount',
    label: 'Distractor count',
    min: 1,
    max: 10,
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 50,
  },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  {
    type: 'nested-number',
    key: 'range',
    subKey: 'min',
    label: 'Range min',
    min: 1,
    max: 100,
  },
  {
    type: 'nested-number',
    key: 'range',
    subKey: 'max',
    label: 'Range max',
    min: 1,
    max: 100,
  },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
