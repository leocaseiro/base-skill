import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { DotGroupQuestion } from './DotGroupQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

const storyConfig: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const meta: Meta<typeof DotGroupQuestion> = {
  component: DotGroupQuestion,
  tags: ['autodocs'],
  decorators: [
    withDb,
    withRouter,
    (Story) => (
      <AnswerGameProvider config={storyConfig}>
        <Story />
      </AnswerGameProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DotGroupQuestion>;

export const OneDot: Story = { args: { count: 1, prompt: 'one' } };
export const ThreeDots: Story = { args: { count: 3, prompt: 'three' } };
export const FiveDots: Story = { args: { count: 5, prompt: 'five' } };
export const NineDots: Story = { args: { count: 9, prompt: 'nine' } };
