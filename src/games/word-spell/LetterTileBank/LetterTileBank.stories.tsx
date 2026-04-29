import { withDb } from '../../../../.storybook/decorators/withDb';
import { LetterTileBank } from './LetterTileBank';
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
  { id: 't1', label: 'c', value: 'c' },
  { id: 't2', label: 'a', value: 'a' },
  { id: 't3', label: 'a', value: 't' },
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
];

const InitProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
};

const meta: Meta<typeof LetterTileBank> = {
  component: LetterTileBank,
  title: 'Games/WordSpell/LetterTileBank',
  tags: ['autodocs'],
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

type Story = StoryObj<typeof LetterTileBank>;

export const Default: Story = {};

const distractorConfig: AnswerGameConfig = {
  ...config,
  tileBankMode: 'distractors',
  distractorCount: 2,
};
const distractorTiles: TileItem[] = [
  ...tiles,
  { id: 'td1', label: 'X', value: 'X' },
  { id: 'td2', label: 'Z', value: 'Z' },
];

const DistractorInitProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles: distractorTiles, zones });
  return <>{children}</>;
};

export const WithDistractors: Story = {
  decorators: [
    withDb,
    (Story) => (
      <AnswerGameProvider config={distractorConfig}>
        <DistractorInitProvider>
          <Story />
        </DistractorInitProvider>
      </AnswerGameProvider>
    ),
  ],
};

/** Slot tile `t1` is placed; dashed hover highlight on bank tile `t2` (swap / return target). */
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
