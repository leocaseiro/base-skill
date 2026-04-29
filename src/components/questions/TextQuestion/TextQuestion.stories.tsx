import { withDb } from '../../../../.storybook/decorators/withDb';
import { TextQuestion } from './TextQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

interface StoryArgs {
  text: string;
}

const storyConfig: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const meta: Meta<StoryArgs> = {
  component: TextQuestion as unknown as ComponentType<StoryArgs>,
  title: 'Questions/TextQuestion',
  tags: ['autodocs'],
  decorators: [
    withDb,
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
          'Single-prop prompt button: renders `text` as a tappable label and plays TTS via `useGameTTS` on click. Use the `text` control to preview single words, long words, or sentence prompts with gap markers (e.g. `The ___ sat on the mat.`). Click/TTS + aria-label behaviour is covered by `TextQuestion.test.tsx`.',
      },
    },
  },
  args: {
    text: 'three',
  },
  argTypes: {
    text: {
      control: 'text',
      description:
        'The prompt text rendered inside the button and spoken via TTS on click.',
    },
  },
  render: ({ text }) => <TextQuestion text={text} />,
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
