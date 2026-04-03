import type { AnswerGameConfig } from '@/components/answer-game/types';

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
