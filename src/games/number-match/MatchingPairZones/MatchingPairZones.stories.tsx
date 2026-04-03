import { MatchingPairZones } from './MatchingPairZones';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

const config: AnswerGameConfig = {
  gameId: 'storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: '5',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const InitProvider = ({
  children,
  prePlace,
}: {
  children: ReactNode;
  prePlace?: { tileId: string; zoneIndex: number };
}) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  if (prePlace) {
    dispatch({
      type: 'PLACE_TILE',
      tileId: prePlace.tileId,
      zoneIndex: prePlace.zoneIndex,
    });
  }
  return <>{children}</>;
};

const meta: Meta<typeof MatchingPairZones> = {
  component: MatchingPairZones,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MatchingPairZones>;

export const Default: Story = {};

export const PartiallyFilled: Story = {
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider prePlace={{ tileId: 't1', zoneIndex: 0 }}>
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
