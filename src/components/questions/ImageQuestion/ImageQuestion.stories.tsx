import { ImageQuestion } from './ImageQuestion';
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

const meta: Meta<typeof ImageQuestion> = {
  component: ImageQuestion,
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

type Story = StoryObj<typeof ImageQuestion>;

export const Default: Story = {
  args: { src: 'https://placehold.co/160', prompt: 'cat' },
};
