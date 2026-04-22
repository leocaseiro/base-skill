import { withDb } from '../../../../.storybook/decorators/withDb';
import { AnswerGame } from './AnswerGame';
import type { AnswerGameConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { classicSkin } from '@/lib/skin';

interface StoryArgs {
  question: string;
  answerPreview: string;
  choicesPreview: string;
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
  totalRounds: number;
  isLevelMode: boolean;
  // Raw AnswerGame props shadowed by StoryArgs above; declared here only
  // so we can hide their react-docgen-inferred rows from the Controls panel.
  config?: never;
  initialState?: never;
  sessionId?: never;
  skin?: never;
  children?: never;
}

const meta: Meta<StoryArgs> = {
  component: AnswerGame as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/AnswerGame',
  tags: ['autodocs'],
  decorators: [withDb],
  parameters: {
    docs: {
      description: {
        component:
          'Shell layout (Question / Answer / Choices slots) + ProgressHUD. Child behaviour — drag, typing, evaluation, distractor banks — is covered by the Slot, LetterTileBank, and SortNumbersTileBank stories. This playground only drives what AnswerGame itself renders: the HUD visibility flags, totalRounds, levelMode, and the three slot containers.',
      },
    },
  },
  args: {
    question: 'Spell CAT',
    answerPreview: '[empty slots here]',
    choicesPreview: '[tile placeholders here]',
    showDots: true,
    showFraction: true,
    showLevel: false,
    totalRounds: 5,
    isLevelMode: false,
  },
  argTypes: {
    question: { control: 'text' },
    answerPreview: { control: 'text' },
    choicesPreview: { control: 'text' },
    showDots: { control: 'boolean', name: 'Show Progress dots' },
    showFraction: {
      control: 'boolean',
      name: 'Show Progress in fraction',
    },
    showLevel: { control: 'boolean' },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    isLevelMode: { control: 'boolean' },
    config: { table: { disable: true } },
    initialState: { table: { disable: true } },
    sessionId: { table: { disable: true } },
    skin: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  render: ({
    question,
    answerPreview,
    choicesPreview,
    showDots,
    showFraction,
    showLevel,
    totalRounds,
    isLevelMode,
  }) => {
    const config: AnswerGameConfig = {
      gameId: 'storybook-answer-game-shell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds,
      ttsEnabled: false,
      hud: { showDots, showFraction, showLevel },
      ...(isLevelMode
        ? { levelMode: { generateNextLevel: () => null } }
        : {}),
    };
    return (
      <AnswerGame config={config} skin={classicSkin}>
        <AnswerGame.Question>
          <p className="text-center text-lg font-semibold text-foreground">
            {question}
          </p>
        </AnswerGame.Question>
        <AnswerGame.Answer>
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground">
            {answerPreview}
          </p>
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground">
            {choicesPreview}
          </p>
        </AnswerGame.Choices>
      </AnswerGame>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: {
    question: 'Question text here',
    answerPreview: '[empty slots here]',
    choicesPreview: '[tile placeholders here]',
    showDots: true,
    showFraction: true,
    showLevel: true,
    totalRounds: 4,
    isLevelMode: false,
  },
};
