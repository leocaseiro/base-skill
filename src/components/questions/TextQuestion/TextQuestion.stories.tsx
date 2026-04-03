import { TextQuestion } from './TextQuestion';
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

const meta: Meta<typeof TextQuestion> = {
  component: TextQuestion,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AnswerGameProvider config={storyConfig}>
        <Story />
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TextQuestion>;

export const Default: Story = { args: { text: 'three' } };
export const LongWord: Story = { args: { text: 'elephant' } };
export const SentenceGap: Story = {
  args: { text: 'The ___ sat on the mat.' },
};
