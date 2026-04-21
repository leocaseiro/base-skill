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
import type { CSSProperties, ComponentType } from 'react';
import { classicSkin } from '@/lib/skin';

type SlotVariant = 'letter' | 'dice' | 'domino' | 'inline-gap';
type DragPreview = 'none' | 'target-empty' | 'target-swap';

interface StoryArgs {
  variant: SlotVariant;
  label: string;
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
    slotClass: 'h-[72px] w-32 rounded-xl',
    contentClass: 'text-3xl font-bold',
  },
  'inline-gap': { slotClass: '', contentClass: '' },
};

const PlaygroundInner = ({
  variant,
  dragPreview,
  contentClass,
  slotClass,
}: {
  variant: SlotVariant;
  dragPreview: DragPreview;
  contentClass: string;
  slotClass: string;
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

  const renderContent = ({ label }: SlotRenderProps) => (
    <span className={contentClass}>{label ?? ''}</span>
  );

  return (
    <SlotRow className="gap-3">
      {[0, 1, 2].map((i) => (
        <Slot key={i} index={i} className={slotClass}>
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
    label: 'A',
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
    label: { control: 'text' },
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
  render: ({ variant, label, filled, isWrong, dragPreview }) => {
    const { slotClass, contentClass } = variantConfig[variant];

    // Build tiles/zones depending on variant + flags.
    const tiles: TileItem[] =
      variant === 'inline-gap'
        ? [makeTile('s0', label || 'cat')]
        : [
            makeTile('t0', label || 'a'),
            makeTile('t1', 'b'),
            makeTile('t2', 'c'),
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
      <div
        className={`game-container skin-${classicSkin.id} p-4`}
        style={classicSkin.tokens as CSSProperties}
      >
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
            contentClass={contentClass}
            slotClass={slotClass}
          />
        </AnswerGameProvider>
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: {
    label: 'a',
    isWrong: false,
  },
};
