import { withDb } from '../../../../.storybook/decorators/withDb';
import { AudioButton } from './AudioButton';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

interface StoryArgs {
  prompt: string;
  ttsEnabled: boolean;
}

const meta: Meta<StoryArgs> = {
  component: AudioButton as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: [withDb],
  parameters: {
    docs: {
      description: {
        component:
          'Round-question audio affordance — a circular Volume2 button that speaks the current prompt via `useGameTTS`. Rendered by `WordSpell` and `NumberMatch` when the round exposes a TTS prompt; returns `null` when the surrounding game config has `ttsEnabled: false`.\n\nThe Playground toggles `ttsEnabled` on the `AnswerGameProvider` config (flip it off to confirm the button disappears) and lets you edit the `prompt` text. Click handling routes through `speakPrompt()` inside `useGameTTS`; rendering + click-routing assertions live in `AudioButton.test.tsx`.',
      },
    },
  },
  args: {
    prompt: 'cat',
    ttsEnabled: true,
  },
  argTypes: {
    prompt: {
      control: 'text',
      description:
        'Text passed to `speakPrompt()` when the button is clicked.',
    },
    ttsEnabled: {
      control: 'boolean',
      description:
        'Surfaced from the surrounding `AnswerGameConfig`. Flip off to confirm the button hides itself (returns `null`).',
    },
  },
  render: ({ prompt, ttsEnabled }) => {
    const config: AnswerGameConfig = {
      gameId: 'storybook',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 1,
      ttsEnabled,
    };
    return (
      <AnswerGameProvider config={config}>
        <AudioButton prompt={prompt} />
      </AnswerGameProvider>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
