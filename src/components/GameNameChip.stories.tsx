import { GameNameChip } from './GameNameChip';
import type { Meta, StoryObj } from '@storybook/react';
import { GAME_COLOR_KEYS } from '@/lib/game-colors';

const meta: Meta<typeof GameNameChip> = {
  component: GameNameChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Coloured chip that renders a game's display name — used on GameCard, InstructionsOverlay, and across the app to identify a saved game. Set customGameName to flip the chip into custom-game mode (custom name as primary heading, gameTitle as a coloured subtitle). The AllColors auxiliary story surveys all 12 game-color keys.",
      },
    },
  },
  args: {
    title: 'Word Spell',
  },
  argTypes: {
    title: { control: 'text' },
    customGameName: { control: 'text' },
    customGameColor: {
      control: { type: 'select' },
      options: GAME_COLOR_KEYS,
    },
    subject: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof GameNameChip>;

export const Playground: Story = {};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {GAME_COLOR_KEYS.map((color) => (
        <GameNameChip
          key={color}
          title="Word Spell"
          customGameName={color}
          customGameColor={color}
        />
      ))}
    </div>
  ),
};
