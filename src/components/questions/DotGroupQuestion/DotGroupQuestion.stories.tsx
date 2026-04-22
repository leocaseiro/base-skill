import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { DotGroupQuestion } from './DotGroupQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';

interface StoryArgs {
  count: number;
  prompt: string;
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
  component: DotGroupQuestion as unknown as ComponentType<StoryArgs>,
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
          'Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes.\n\nTap-assignment, re-speak on an already-numbered dot, and reset-on-count-change flows live in `DotGroupQuestion.test.tsx`; this story is visual-only.',
      },
    },
  },
  args: {
    count: 3,
    prompt: 'three',
  },
  argTypes: {
    count: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description:
        'Number of dots in the group. Changing this resets all dot assignments.',
    },
    prompt: {
      control: 'text',
      description: 'Accessible label for the dot group container.',
    },
  },
  render: ({ count, prompt }) => (
    <DotGroupQuestion count={count} prompt={prompt} />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
