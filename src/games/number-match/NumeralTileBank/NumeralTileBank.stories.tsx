import { withDb } from '../../../../.storybook/decorators/withDb';
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

const wordTiles: TileItem[] = [
  { id: 'w1', label: 'one', value: '1' },
  { id: 'w2', label: 'two', value: '2' },
  { id: 'w3', label: 'three', value: '3' },
  { id: 'w4', label: 'seventeen', value: '17' },
  { id: 'w5', label: 'twenty-two', value: '22' },
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

const InitWordProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles: wordTiles, zones });
  return <>{children}</>;
};

const meta: Meta<typeof NumeralTileBank> = {
  component: NumeralTileBank,
  tags: ['autodocs'],
  args: { tileStyle: 'dots', tilesShowGroup: true },
  decorators: [
    withDb,
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

export const Default: Story = {
  args: { tileStyle: 'dots', tilesShowGroup: true },
};
export const FingersStyle: Story = {
  args: { tileStyle: 'fingers', tilesShowGroup: true },
};
export const ObjectsStyle: Story = {
  args: { tileStyle: 'objects', tilesShowGroup: true },
};

export const WordTiles: Story = {
  args: { tileStyle: 'dots', tilesShowGroup: false },
  decorators: [
    withDb,
    (Story) => (
      <AnswerGameProvider config={config}>
        <InitWordProvider>
          <Story />
        </InitWordProvider>
      </AnswerGameProvider>
    ),
  ],
};

const DragHoverBankTileSetup = ({
  children,
}: {
  children: ReactNode;
}) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
  dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't1' });
  dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: 't2' });
  return <>{children}</>;
};

export const DragHoverBankTile: Story = {
  args: { tileStyle: 'dots', tilesShowGroup: true },
  decorators: [
    withDb,
    (Story) => (
      <AnswerGameProvider config={config}>
        <DragHoverBankTileSetup>
          <Story />
        </DragHoverBankTileSetup>
      </AnswerGameProvider>
    ),
  ],
};
