import { useEffect } from 'react';

import { withDb } from '../../../../.storybook/decorators/withDb';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { SentenceWithGaps } from './SentenceWithGaps';
import { Slot } from './Slot';
import { SlotRow } from './SlotRow';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { SlotRenderProps } from './useSlotBehavior';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import {
  DiceFace,
  DominoTile,
} from '@/games/number-match/NumeralTileBank/NumeralTileBank';

type SlotVariant = 'letter' | 'dice' | 'domino' | 'inline-gap';
type DragPreview = 'none' | 'target-empty' | 'target-swap';

interface StoryArgs {
  variant: SlotVariant;
  label: string;
  diceValue: number;
  dominoValue: number;
  filled: boolean;
  isWrong: boolean;
  dragPreview: DragPreview;
  // Raw SlotRow props (the meta `component`) that StoryArgs doesn't
  // cover. Declared here only to hide their react-docgen-inferred rows
  // from the Controls panel.
  className?: never;
  children?: never;
}

const baseConfig: AnswerGameConfig = {
  gameId: 'slot-storybook',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const makeTile = (id: string, label: string): TileItem => ({
  id,
  label,
  value: label,
});

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

const variantConfig: Record<
  SlotVariant,
  { slotClass: string; contentClass: string }
> = {
  letter: {
    slotClass: 'size-14 rounded-lg',
    contentClass: 'text-xl font-bold',
  },
  dice: {
    slotClass: 'size-20 rounded-xl',
    contentClass: 'text-2xl font-bold',
  },
  domino: {
    slotClass: 'h-[136px] w-[72px] rounded-xl',
    contentClass: 'text-3xl font-bold',
  },
  'inline-gap': { slotClass: '', contentClass: '' },
};

const PlaygroundInner = ({
  variant,
  dragPreview,
  slotClass,
  renderContent,
  renderPreview,
}: {
  variant: SlotVariant;
  dragPreview: DragPreview;
  slotClass: string;
  renderContent: (props: SlotRenderProps) => ReactNode;
  renderPreview?: (previewLabel: string) => ReactNode;
}) => {
  const dispatch = useAnswerGameDispatch();

  useEffect(() => {
    if (dragPreview === 'none') {
      dispatch({ type: 'SET_DRAG_ACTIVE', tileId: null });
      dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: null });
      return;
    }
    // Both previews drag tile t0 over zone 1.
    dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't0' });
    dispatch({ type: 'SET_DRAG_HOVER', zoneIndex: 1 });
  }, [dispatch, dragPreview]);

  if (variant === 'inline-gap') {
    return (
      <div className="p-4">
        <SentenceWithGaps sentence="The {0} sat on the mat." />
      </div>
    );
  }

  return (
    <SlotRow className="gap-3">
      {[0, 1, 2].map((i) => (
        <Slot
          key={i}
          index={i}
          className={slotClass}
          renderPreview={renderPreview}
        >
          {(props) => renderContent(props)}
        </Slot>
      ))}
    </SlotRow>
  );
};

const meta: Meta<StoryArgs> = {
  component: SlotRow as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/Slot',
  tags: ['autodocs'],
  decorators: [withDb],
  args: {
    variant: 'letter',
    label: 'a',
    diceValue: 5,
    dominoValue: 8,
    filled: true,
    isWrong: false,
    dragPreview: 'none',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'letter',
        'dice',
        'domino',
        'inline-gap',
      ] satisfies SlotVariant[],
    },
    label: {
      control: 'text',
      if: { arg: 'variant', eq: 'letter' },
    },
    diceValue: {
      control: { type: 'range', min: 0, max: 6, step: 1 },
      description: 'Pip count (0-6) rendered as a 3×3 dice face.',
      if: { arg: 'variant', eq: 'dice' },
    },
    dominoValue: {
      control: { type: 'range', min: 1, max: 12, step: 1 },
      description:
        'Sum rendered as two stacked dice faces (top = smaller half).',
      if: { arg: 'variant', eq: 'domino' },
    },
    filled: { control: 'boolean' },
    isWrong: { control: 'boolean' },
    dragPreview: {
      control: { type: 'select' },
      options: [
        'none',
        'target-empty',
        'target-swap',
      ] satisfies DragPreview[],
    },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  render: ({
    variant,
    label,
    diceValue,
    dominoValue,
    filled,
    isWrong,
    dragPreview,
  }) => {
    const { slotClass, contentClass } = variantConfig[variant];

    // Per-variant tile label + content renderer. Tiles feed into the
    // AnswerGameProvider so Slot sees a real placed tile; renderContent
    // draws the face inside the Slot render-prop. renderPreview mirrors
    // the face during drag-hover previews (otherwise Slot would fall
    // back to a plain `<span>{previewLabel}</span>` that shows the raw
    // numeric label for dice/domino).
    const tileLabel =
      variant === 'letter'
        ? label || 'a'
        : variant === 'dice'
          ? String(diceValue)
          : variant === 'domino'
            ? String(dominoValue)
            : label || 'cat';

    const renderContent = (props: SlotRenderProps) => {
      // Only render the face when the slot has a placed tile label.
      // Empty slots pass label=null; falling through to null keeps them
      // empty (matches the letter branch's `props.label ?? ''`).
      if (props.label === null) return null;
      if (variant === 'dice') {
        return <DiceFace value={Number(props.label) || 0} />;
      }
      if (variant === 'domino') {
        return <DominoTile value={Number(props.label) || 0} />;
      }
      return <span className={contentClass}>{props.label}</span>;
    };

    const renderPreview =
      variant === 'dice'
        ? (previewLabel: string) => (
            <div className="opacity-50">
              <DiceFace value={Number(previewLabel) || 0} />
            </div>
          )
        : variant === 'domino'
          ? (previewLabel: string) => (
              <div className="opacity-50">
                <DominoTile value={Number(previewLabel) || 0} />
              </div>
            )
          : undefined;

    // Build tiles/zones depending on variant + flags.
    const tiles: TileItem[] =
      variant === 'inline-gap'
        ? [makeTile('s0', tileLabel)]
        : [
            makeTile('t0', tileLabel),
            makeTile('t1', variant === 'letter' ? 'b' : '2'),
            makeTile('t2', variant === 'letter' ? 'c' : '3'),
          ];

    const zones: AnswerZone[] =
      variant === 'inline-gap'
        ? [makeZone(0, filled ? 's0' : null, isWrong)]
        : dragPreview === 'target-swap'
          ? [
              makeZone(0, 't0'),
              makeZone(1, 't1', isWrong),
              makeZone(2, 't2'),
            ]
          : [
              makeZone(0, filled ? 't0' : null, isWrong),
              makeZone(1),
              makeZone(2),
            ];

    return (
      <div className="p-4">
        <AnswerGameProvider
          config={{
            ...baseConfig,
            gameId: `slot-${variant}-${String(filled)}-${dragPreview}`,
            initialTiles: tiles,
            initialZones: zones,
          }}
        >
          <PlaygroundInner
            variant={variant}
            dragPreview={dragPreview}
            slotClass={slotClass}
            renderContent={renderContent}
            renderPreview={renderPreview}
          />
        </AnswerGameProvider>
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
