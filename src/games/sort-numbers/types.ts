// src/games/sort-numbers/types.ts
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { ConfigField } from '@/lib/config-fields';

export type SkipConfig =
  | { mode: 'random' }
  | { mode: 'consecutive' }
  | { mode: 'by'; step: number; start: 'range-min' | 'random' };

export type DistractorConfig =
  | { source: 'random'; count: number }
  | { source: 'gaps-only'; count: number | 'all' }
  | { source: 'full-range'; count: number | 'all' };

export interface SortNumbersConfig extends AnswerGameConfig {
  component: 'SortNumbers';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  /** How many numbers to sort per round */
  quantity: number;
  skip: SkipConfig;
  distractors: DistractorConfig;
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
    key: 'tileBankMode',
    label: 'Tile bank mode',
    options: [
      { value: 'exact', label: 'exact' },
      { value: 'distractors', label: 'distractors' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 30,
  },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
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
    type: 'nested-number',
    key: 'range',
    subKey: 'min',
    label: 'Range min',
    min: 1,
    max: 999,
  },
  {
    type: 'nested-number',
    key: 'range',
    subKey: 'max',
    label: 'Range max',
    min: 1,
    max: 999,
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'mode',
    label: 'Skip mode',
    options: [
      { value: 'random', label: 'random' },
      { value: 'consecutive', label: 'consecutive' },
      { value: 'by', label: 'by' },
    ],
  },
  {
    type: 'nested-number',
    key: 'skip',
    subKey: 'step',
    label: 'Skip step',
    min: 2,
    max: 100,
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'start',
    label: 'Skip start',
    options: [
      { value: 'range-min', label: 'range-min' },
      { value: 'random', label: 'random' },
    ],
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'distractors',
    subKey: 'source',
    label: 'Distractor source',
    options: [
      { value: 'random', label: 'random' },
      { value: 'gaps-only', label: 'gaps-only' },
      { value: 'full-range', label: 'full-range' },
    ],
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  {
    type: 'nested-select-or-number',
    key: 'distractors',
    subKey: 'count',
    label: 'Distractor count',
    min: 1,
    max: 20,
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
