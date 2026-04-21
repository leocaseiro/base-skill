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
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Classic (round dots + fraction) and level (LEVEL N + cumulative dots) progress HUD. All visible output is driven by the nine controls — use them to reproduce the common presets:\n\n- **Classic last round:** roundIndex 4, totalRounds 5.\n- **Dots only:** showFraction off, showLevel off.\n- **Fraction only:** showDots off, showLevel off.\n- **Level mode (level 3):** isLevelMode on, totalRoundsIsNull on, levelIndex 2, showFraction off, showLevel on.\n- **Mixed level + fraction:** isLevelMode on, levelIndex 2, showLevel on (totalRounds stays set).\n- **Round-complete pulse:** phase round-complete.\n- **All flags off:** renders null.',
      },
    },
  },
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

export const Playground: Story = {
  args: {
    totalRounds: 6,
    levelIndex: 6,
    isLevelMode: true,
    phase: 'round-complete',
  },
};
