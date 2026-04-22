import { ProgressHUD } from './ProgressHUD';
import type { AnswerGamePhase } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

interface StoryArgs {
  dotCount: number;
  roundIndex: number;
  levelIndex: number;
  isLevelMode: boolean;
  phase: AnswerGamePhase;
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
  // Raw ProgressHUD prop shadowed by the `dotCount` bridge control.
  // Declared here only to hide its react-docgen-inferred row from the
  // Controls panel.
  totalRounds?: never;
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
          'Classic (round dots + fraction) and level (LEVEL N + cumulative dots) progress HUD. The dot bar renders `dotCount` circles; the one at `roundIndex` gets `data-state="current"`, earlier ones are `done`, later ones are `todo`. Move `roundIndex` to `-1` to see every dot as todo, or to `dotCount` to see every dot as done.\n\n- **Classic mode:** `dotCount` drives the dot bar and `totalRounds`; `roundIndex` drives which dot is current. Fraction shows as `roundIndex + 1 / dotCount` when `showFraction` is on. `levelIndex` only affects the "LEVEL N" text when `showLevel` is on.\n- **Level mode:** the component derives dot count from `levelIndex + 1` and always marks the last dot current, so `dotCount`/`roundIndex` stop driving the dot bar. `dotCount` still becomes the fraction denominator (`roundIndex + 1 / dotCount`) when `showFraction` is on.\n- **Round-complete pulse:** flip `phase` to `round-complete` to see `animate-pulse` on the current dot (respects `prefers-reduced-motion`).',
      },
    },
  },
  args: {
    dotCount: 5,
    roundIndex: 2,
    levelIndex: 0,
    isLevelMode: false,
    phase: 'playing',
    showDots: true,
    showFraction: true,
    showLevel: false,
  },
  argTypes: {
    dotCount: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description:
        'Number of dots shown in classic mode. In level mode the component overrides this with `levelIndex + 1`.',
      if: { arg: 'isLevelMode', truthy: false },
    },
    roundIndex: {
      control: { type: 'range', min: -1, max: 20, step: 1 },
      description:
        'Which dot is `current` in classic mode (and the fraction numerator in both modes). `-1` = every dot `todo`; `dotCount` = every dot `done`.',
      if: { arg: 'isLevelMode', truthy: false },
    },
    levelIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description:
        'Displayed as "LEVEL {levelIndex + 1}" when `showLevel` is on. In level mode this also drives the dot bar (count + current).',
      if: { arg: 'isLevelMode', truthy: true },
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
    showLevel: {
      control: 'boolean',
      if: { arg: 'isLevelMode', truthy: true },
    },
    totalRounds: { table: { disable: true } },
  },
  render: ({
    dotCount,
    roundIndex,
    levelIndex,
    isLevelMode,
    phase,
    showDots,
    showFraction,
    showLevel,
  }) => {
    // Storybook's `if`-gated controls keep their arg value, but guard against
    // any corner case where the arg arrives undefined — the component uses
    // `roundIndex + 1` and `undefined + 1 === NaN` would leak into the fraction.
    const safeDotCount = Number.isFinite(dotCount) ? dotCount : 1;
    const safeRoundIndex = Number.isFinite(roundIndex) ? roundIndex : 0;
    const safeLevelIndex = Number.isFinite(levelIndex) ? levelIndex : 0;
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isLevelMode ? 'Levels' : 'Rounds'}
        </span>
        <ProgressHUD
          roundIndex={safeRoundIndex}
          totalRounds={showFraction ? safeDotCount : null}
          levelIndex={safeLevelIndex}
          isLevelMode={isLevelMode}
          phase={phase}
          showDots={showDots}
          showFraction={showFraction}
          showLevel={showLevel}
        />
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: {
    dotCount: 12,
    roundIndex: 2,
    levelIndex: 4,
    isLevelMode: true,
    showLevel: true,
    phase: 'round-complete',
  },
};
