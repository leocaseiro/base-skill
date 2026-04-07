import { withDb } from '../../../../.storybook/decorators/withDb';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { SentenceWithGaps } from './SentenceWithGaps';
import { Slot } from './Slot';
import { SlotRow } from './SlotRow';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { SlotRenderProps } from './useSlotBehavior';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared config & data helpers
// ---------------------------------------------------------------------------

const baseConfig: AnswerGameConfig = {
  gameId: 'slot-storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const makeZone = (
  index: number,
  placedTileId: string | null = null,
  isWrong = false,
): AnswerZone => ({
  id: `z${String(index)}`,
  index,
  expectedValue: String(index),
  placedTileId,
  isWrong,
  isLocked: false,
});

const makeTile = (id: string, label: string): TileItem => ({
  id,
  label,
  value: label,
});

// ---------------------------------------------------------------------------
// Letter-slot render child
// ---------------------------------------------------------------------------

const LetterContent = ({ label }: SlotRenderProps) => (
  <span className="text-xl font-bold">{label ?? ''}</span>
);

// ---------------------------------------------------------------------------
// Meta — using SlotRow as the component so Storybook shows a useful name.
// Each story provides its own render that sets up AnswerGameProvider.
// ---------------------------------------------------------------------------

const meta: Meta<typeof SlotRow> = {
  component: SlotRow,
  title: 'answer-game/Slot',
  tags: ['autodocs'],
  decorators: [withDb],
};
export default meta;

type Story = StoryObj<typeof SlotRow>;

// ---------------------------------------------------------------------------
// 1. EmptyLetterSlots — 3 empty letter-sized (size-14) slots in a SlotRow
// ---------------------------------------------------------------------------

export const EmptyLetterSlots: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-empty',
        initialTiles: [
          makeTile('t0', 'C'),
          makeTile('t1', 'A'),
          makeTile('t2', 'T'),
        ],
        initialZones: [makeZone(0), makeZone(1), makeZone(2)],
      }}
    >
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
        <Slot index={1} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
        <Slot index={2} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
  ),
};

// ---------------------------------------------------------------------------
// 2. FilledLetterSlots — 3 slots with letters C, A, T placed
// ---------------------------------------------------------------------------

export const FilledLetterSlots: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-filled',
        initialTiles: [
          makeTile('t0', 'C'),
          makeTile('t1', 'A'),
          makeTile('t2', 'T'),
        ],
        initialZones: [
          makeZone(0, 't0'),
          makeZone(1, 't1'),
          makeZone(2, 't2'),
        ],
      }}
    >
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
        <Slot index={1} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
        <Slot index={2} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
  ),
};

// ---------------------------------------------------------------------------
// 3. WrongPlacement — slot with a wrong tile (isWrong = true → red/shake)
// ---------------------------------------------------------------------------

export const WrongPlacement: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-wrong',
        initialTiles: [makeTile('t0', 'X')],
        initialZones: [makeZone(0, 't0', true)],
      }}
    >
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {(props) => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
  ),
};

// ---------------------------------------------------------------------------
// 4. DiceSlots — NumberMatch-style 80px square slots (size-20)
// ---------------------------------------------------------------------------

const DotContent = ({ label }: SlotRenderProps) => (
  <span className="text-2xl font-bold">{label ?? ''}</span>
);

export const DiceSlots: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-dice',
        initialTiles: [
          makeTile('d0', '3'),
          makeTile('d1', '5'),
          makeTile('d2', '1'),
        ],
        initialZones: [
          makeZone(0, 'd0'),
          makeZone(1, 'd1'),
          makeZone(2, 'd2'),
        ],
      }}
    >
      <SlotRow className="gap-3">
        <Slot index={0} className="size-20 rounded-xl">
          {(props) => <DotContent {...props} />}
        </Slot>
        <Slot index={1} className="size-20 rounded-xl">
          {(props) => <DotContent {...props} />}
        </Slot>
        <Slot index={2} className="size-20 rounded-xl">
          {(props) => <DotContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
  ),
};

// ---------------------------------------------------------------------------
// 5. DominoSlots — NumberMatch-style rectangle slots (h-[72px] w-32)
// ---------------------------------------------------------------------------

const DominoContent = ({ label }: SlotRenderProps) => (
  <span className="text-3xl font-bold">{label ?? ''}</span>
);

export const DominoSlots: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-domino',
        initialTiles: [makeTile('dom0', '4'), makeTile('dom1', '2')],
        initialZones: [makeZone(0, 'dom0'), makeZone(1, 'dom1')],
      }}
    >
      <SlotRow className="gap-3">
        <Slot index={0} className="h-[72px] w-32 rounded-xl">
          {(props) => <DominoContent {...props} />}
        </Slot>
        <Slot index={1} className="h-[72px] w-32 rounded-xl">
          {(props) => <DominoContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
  ),
};

// ---------------------------------------------------------------------------
// 6. InlineSentenceGap — inline gap slot using SentenceWithGaps
// ---------------------------------------------------------------------------

export const InlineSentenceGap: Story = {
  render: () => (
    <AnswerGameProvider
      config={{
        ...baseConfig,
        gameId: 'slot-sentence',
        initialTiles: [makeTile('s0', 'cat')],
        initialZones: [makeZone(0, 's0')],
      }}
    >
      <div className="p-4">
        <SentenceWithGaps sentence="The {0} sat on the mat." />
      </div>
    </AnswerGameProvider>
  ),
};
