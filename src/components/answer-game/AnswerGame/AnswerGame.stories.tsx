import { AnswerGame } from './AnswerGame';
import type { AnswerGameConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';
import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';

const baseConfig: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  ttsEnabled: true,
};

const meta: Meta<typeof AnswerGame> = {
  component: AnswerGame,
  tags: ['autodocs'],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof AnswerGame>;

export const Default: Story = {
  render: (args) => (
    <AnswerGame {...args}>
      <AnswerGame.Question>
        <ImageQuestion src="https://placehold.co/160" prompt="cat" />
        <AudioButton prompt="cat" />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Answer slots here
        </div>
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Tile bank here
        </div>
      </AnswerGame.Choices>
    </AnswerGame>
  ),
};

export const TextQuestionMode: Story = {
  args: { config: { ...baseConfig, inputMethod: 'type' } },
  render: (args) => (
    <AnswerGame {...args}>
      <AnswerGame.Question>
        <TextQuestion text="three" />
        <AudioButton prompt="three" />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Typed slots here
        </div>
      </AnswerGame.Answer>
    </AnswerGame>
  ),
};

export const RejectMode: Story = {
  args: { config: { ...baseConfig, wrongTileBehavior: 'reject' } },
  render: Default.render,
};

export const LockManualMode: Story = {
  args: { config: { ...baseConfig, wrongTileBehavior: 'lock-manual' } },
  render: Default.render,
};
