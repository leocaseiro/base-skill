import { useEffect } from 'react';
import { withDarkMode } from '../../../../.storybook/decorators';
import { withDb } from '../../../../.storybook/decorators/withDb';
import { SortNumbersTileBank } from './SortNumbersTileBank';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

const config: AnswerGameConfig = {
  gameId: 'sort-numbers-story',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
  initialTiles: [
    { id: 't1', label: '3', value: '3' },
    { id: 't2', label: '7', value: '7' },
    { id: 't3', label: '1', value: '1' },
    { id: 't4', label: '5', value: '5' },
  ],
  initialZones: [
    {
      id: 'z1',
      index: 0,
      expectedValue: '1',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z2',
      index: 1,
      expectedValue: '3',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z3',
      index: 2,
      expectedValue: '5',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
    {
      id: 'z4',
      index: 3,
      expectedValue: '7',
      placedTileId: null,
      isWrong: false,
      isLocked: false,
    },
  ],
};

const withProvider = (Story: React.ComponentType) => (
  <AnswerGameProvider config={config}>
    <Story />
  </AnswerGameProvider>
);

const meta: Meta<typeof SortNumbersTileBank> = {
  component: SortNumbersTileBank,
  tags: ['autodocs'],
  decorators: [withDb, withProvider],
};
export default meta;

type Story = StoryObj<typeof SortNumbersTileBank>;

export const Default: Story = {};

export const DefaultDark: Story = {
  decorators: [withDarkMode],
};

const SortNumbersDragHoverSetup = ({
  children,
}: {
  children: ReactNode;
}) => {
  const dispatch = useAnswerGameDispatch();
  useEffect(() => {
    dispatch({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 0 });
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't3' });
    dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: 't1' });
  }, [dispatch]);
  return <>{children}</>;
};

/** Tile `1` is in the first slot; dashed hover on bank tile `3`. */
export const DragHoverBankTile: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // The drag-simulation setup briefly creates aria-hidden elements
            // that still contain the focusable tile, triggering this rule.
            // This is a transient state specific to this story's drag fixture.
            id: 'aria-hidden-focus',
            enabled: false,
          },
        ],
      },
    },
  },
  decorators: [
    withDb,
    (Story) => (
      <AnswerGameProvider config={config}>
        <SortNumbersDragHoverSetup>
          <Story />
        </SortNumbersDragHoverSetup>
      </AnswerGameProvider>
    ),
  ],
};
