import { NumeralTileBank } from './NumeralTileBank';
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
  { id: 't1', label: '1', value: '1' },
  { id: 't2', label: '2', value: '2' },
  { id: 't3', label: '3', value: '3' },
  { id: 't4', label: '4', value: '4' },
  { id: 't5', label: '5', value: '5' },
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
];

const InitProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
};

const meta: Meta<typeof NumeralTileBank> = {
  component: NumeralTileBank,
  tags: ['autodocs'],
  args: { tileStyle: 'dots' },
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

type Story = StoryObj<typeof NumeralTileBank>;

export const DotsStyle: Story = { args: { tileStyle: 'dots' } };
export const FingersStyle: Story = { args: { tileStyle: 'fingers' } };
export const ObjectsStyle: Story = { args: { tileStyle: 'objects' } };
