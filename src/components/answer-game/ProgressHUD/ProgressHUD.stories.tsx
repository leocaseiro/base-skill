import { ProgressHUD } from './ProgressHUD';
import type { AnswerGamePhase } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  roundIndex: number;
  totalRounds: number;
  totalRoundsIsNull: boolean;
  levelIndex: number;
  isLevelMode: boolean;
  phase: AnswerGamePhase;
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}

const meta: Meta<StoryArgs> = {
  component: ProgressHUD as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/ProgressHUD',
  parameters: { layout: 'centered' },
  args: {
    roundIndex: 2,
    totalRounds: 5,
    totalRoundsIsNull: false,
    levelIndex: 0,
    isLevelMode: false,
    phase: 'playing',
    showDots: true,
    showFraction: true,
    showLevel: false,
  },
  argTypes: {
    roundIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
    },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    totalRoundsIsNull: { control: 'boolean' },
    levelIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
    },
    isLevelMode: { control: 'boolean' },
    phase: {
      control: { type: 'select' },
      options: [
        'playing',
        'round-complete',
        'level-complete',
        'game-over',
      ] satisfies AnswerGamePhase[],
    },
    showDots: { control: 'boolean' },
    showFraction: { control: 'boolean' },
    showLevel: { control: 'boolean' },
  },
  render: ({
    roundIndex,
    totalRounds,
    totalRoundsIsNull,
    levelIndex,
    isLevelMode,
    phase,
    showDots,
    showFraction,
    showLevel,
  }) => (
    <ProgressHUD
      roundIndex={roundIndex}
      totalRounds={totalRoundsIsNull ? null : totalRounds}
      levelIndex={levelIndex}
      isLevelMode={isLevelMode}
      phase={phase}
      showDots={showDots}
      showFraction={showFraction}
      showLevel={showLevel}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Classic_Round3Of5: Story = {};

export const Classic_LastRound: Story = {
  args: { roundIndex: 4, totalRounds: 5 },
};

export const DotsOnly: Story = {
  args: { showFraction: false, showLevel: false },
};

export const FractionOnly: Story = {
  args: { showDots: false, showLevel: false },
};

export const LevelMode_Level3: Story = {
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 2,
    showFraction: false,
    showLevel: true,
  },
};

export const LevelMode_Level10: Story = {
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 9,
    showFraction: false,
    showLevel: true,
  },
};

export const Mixed_LevelPlusFraction: Story = {
  args: {
    isLevelMode: true,
    totalRounds: 5,
    levelIndex: 2,
    showFraction: true,
    showLevel: true,
  },
};

export const RoundCompletePhase: Story = {
  args: { phase: 'round-complete' },
};

export const AllFlagsOff: Story = {
  args: { showDots: false, showFraction: false, showLevel: false },
};
