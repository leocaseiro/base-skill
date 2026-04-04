import { withDb } from '../../../../.storybook/decorators/withDb';
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
    (Story) => (
      <AnswerGameProvider config={storyConfig}>
        <Story />
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DotGroupQuestion>;

export const OneDot: Story = { args: { count: 1, prompt: 'one' } };
export const ThreeDots: Story = { args: { count: 3, prompt: 'three' } };
export const FiveDots: Story = { args: { count: 5, prompt: 'five' } };
