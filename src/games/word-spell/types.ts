import type { AnswerGameConfig } from '@/components/answer-game/types';

export interface WordSpellRound {
  word: string;
  /** Fluent Emoji SVG path or custom asset path (picture/sentence-gap modes) */
  image?: string;
  /** Sentence with a blank for sentence-gap mode: "The ___ sat on the mat." */
  sentence?: string;
  /** Scene illustration for sentence-gap mode */
  sceneImage?: string;
  /** Optional custom audio override instead of TTS */
  audioOverride?: string;
}

export interface WordSpellConfig extends AnswerGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  /** @default 'letter' */
  tileUnit: 'letter' | 'syllable' | 'word';
  rounds: WordSpellRound[];
}
