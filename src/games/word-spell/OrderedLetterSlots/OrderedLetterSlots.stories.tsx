import { OrderedLetterSlots } from './OrderedLetterSlots';
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
  { id: 't1', label: 'C', value: 'C' },
  { id: 't2', label: 'A', value: 'A' },
  { id: 't3', label: 'T', value: 'T' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'C',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 'T',
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
  prePlace?: string;
}) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  if (prePlace)
    dispatch({ type: 'PLACE_TILE', tileId: prePlace, zoneIndex: 0 });
  return <>{children}</>;
};

const meta: Meta<typeof OrderedLetterSlots> = {
  component: OrderedLetterSlots,
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

type Story = StoryObj<typeof OrderedLetterSlots>;

export const Default: Story = {};
export const PartiallyFilled: Story = {
  decorators: [
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitProvider prePlace="t1">
          <Story />
        </InitProvider>
      </AnswerGameProvider>
    ),
  ],
};
