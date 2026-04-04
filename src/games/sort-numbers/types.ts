import type { AnswerGameConfig } from '@/components/answer-game/types';

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
