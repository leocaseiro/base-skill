import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { WordSpellSource } from '@/data/words';
import type { ConfigField } from '@/lib/config-fields';

export interface GapDefinition {
  word: string;
  distractors?: string[];
}

export interface WordSpellRound {
  word: string;
  /**
   * Native emoji (or ZWJ sequence) for picture mode. When set, this is shown instead of `image` / `sceneImage`.
   */
  emoji?: string;
  /** Fluent Emoji SVG path, URL, or `/public` asset path (picture/sentence-gap modes) */
  image?: string;
  /** Sentence with a blank for sentence-gap mode: "The ___ sat on the mat." */
  sentence?: string;
  /** Scene illustration for sentence-gap mode */
  sceneImage?: string;
  /** Optional custom audio override instead of TTS */
  audioOverride?: string;
  /** Gap definitions for sentence-gap mode. Each entry maps to a {N} placeholder. */
  gaps?: GapDefinition[];
}

export interface WordSpellConfig extends AnswerGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  /** @default 'letter' */
  tileUnit: 'letter' | 'syllable' | 'word';
  /** Explicit hand-authored rounds. Wins over `source` when both are present. */
  rounds?: WordSpellRound[];
  /** Library-driven rounds. Resolved at WordSpell mount time. */
  source?: WordSpellSource;
}

export const wordSpellConfigFields: ConfigField[] = [
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
    max: 8,
  },
  {
    type: 'select',
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'picture', label: 'picture' },
      { value: 'scramble', label: 'scramble' },
      { value: 'recall', label: 'recall' },
      { value: 'sentence-gap', label: 'sentence-gap' },
    ],
  },
  {
    type: 'select',
    key: 'tileUnit',
    label: 'Tile unit',
    options: [
      { value: 'letter', label: 'letter' },
      { value: 'syllable', label: 'syllable' },
      { value: 'word', label: 'word' },
    ],
  },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
