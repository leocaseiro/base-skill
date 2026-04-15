import { ProgressHUD } from './ProgressHUD';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ProgressHUD> = {
  component: ProgressHUD,
  title: 'answer-game/ProgressHUD',
  parameters: { layout: 'centered' },
  args: {
    roundIndex: 2,
    totalRounds: 5,
    levelIndex: 0,
    isLevelMode: false,
    phase: 'playing',
    showDots: true,
    showFraction: true,
    showLevel: false,
  },
};

export default meta;
type Story = StoryObj<typeof ProgressHUD>;

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
    totalRounds: null,
    levelIndex: 2,
    showFraction: false,
    showLevel: true,
  },
};

export const LevelMode_Level10: Story = {
  args: {
    isLevelMode: true,
    totalRounds: null,
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
