import { withDb } from '../../../../.storybook/decorators/withDb';
import { ImageQuestion } from './ImageQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

interface StoryArgs {
  src: string;
  prompt: string;
}

const PLACEHOLDER_OPTIONS = {
  Cat: 'https://placehold.co/160?text=cat',
  Dog: 'https://placehold.co/160?text=dog',
  Apple: 'https://placehold.co/160?text=apple',
  Broken: '/does-not-exist.png',
} as const;

const storyConfig: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const meta: Meta<StoryArgs> = {
  component: ImageQuestion,
  title: 'questions/ImageQuestion',
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
          'Displays the question image for a round and speaks the prompt via TTS when tapped. The Playground exposes the two props that drive its visual surface: `src` (pick a placeholder or type a URL) and `prompt` (the word spoken on tap + the accessible label). TTS behaviour is covered by `ImageQuestion.test.tsx`; this story is visual-only.',
      },
    },
  },
  args: {
    src: PLACEHOLDER_OPTIONS.Cat,
    prompt: 'cat',
  },
  argTypes: {
    src: {
      control: 'text',
      description:
        'Image URL. Use one of the provided placeholders or paste any URL — `/does-not-exist.png` exercises the broken-image fallback.',
    },
    prompt: {
      control: 'text',
      description:
        'Word spoken on tap and used in the accessible label (`{prompt} — tap to hear`).',
    },
  },
  render: ({ src, prompt }) => (
    <ImageQuestion src={src} prompt={prompt} />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
