import { fn } from 'storybook/test';
import { SpotAllTile } from './SpotAllTile';
import type { SpotAllTile as SpotAllTileData } from '../types';
import type { CssTransform } from '@/lib/distractors/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type FontFamily =
  | 'inherit'
  | 'monospace'
  | 'serif'
  | 'cursive'
  | 'fantasy';

type StoryArgs = {
  label: string;
  isSelected: boolean;
  inCooldown: boolean;
  transform: CssTransform | 'none';
  fontFamily: FontFamily;
  fontSizePx: number;
  onTap: () => void;
};

const toTile = (args: StoryArgs): SpotAllTileData => ({
  id: 'story-tile',
  label: args.label,
  isCorrect: true,
  transform: args.transform === 'none' ? undefined : args.transform,
  tileStyle: {
    fontFamily:
      args.fontFamily === 'inherit' ? undefined : args.fontFamily,
    fontSizePx: args.fontSizePx,
  },
});

const meta: Meta<StoryArgs> = {
  title: 'Games/SpotAll/SpotAllTile',
  component: SpotAllTile as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    label: 'b',
    isSelected: false,
    inCooldown: false,
    transform: 'none',
    fontFamily: 'inherit',
    fontSizePx: 32,
    onTap: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    isSelected: { control: 'boolean' },
    inCooldown: { control: 'boolean' },
    transform: {
      control: { type: 'select' },
      options: [
        'none',
        'scaleX(-1)',
        'scaleY(-1)',
        'rotate(180deg)',
      ] satisfies (CssTransform | 'none')[],
    },
    fontFamily: {
      control: { type: 'select' },
      options: [
        'inherit',
        'monospace',
        'serif',
        'cursive',
        'fantasy',
      ] satisfies FontFamily[],
    },
    fontSizePx: {
      control: { type: 'range', min: 16, max: 64, step: 2 },
    },
  },
  render: (args) => (
    <SpotAllTile
      tile={toTile(args)}
      isSelected={args.isSelected}
      inCooldown={args.inCooldown}
      onTap={args.onTap}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
