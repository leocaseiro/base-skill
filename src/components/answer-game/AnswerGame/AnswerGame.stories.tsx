import { withDb } from '../../../../.storybook/decorators/withDb';
import { Slot } from '../Slot/Slot';
import { SlotRow } from '../Slot/SlotRow';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { AnswerGame } from './AnswerGame';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type InputMethod = 'drag' | 'type' | 'both';
type WrongTileBehavior = 'reject' | 'lock-manual' | 'lock-auto-eject';
type TileBankMode = 'exact' | 'distractors';

interface StoryArgs {
  inputMethod: InputMethod;
  wrongTileBehavior: WrongTileBehavior;
  tileBankMode: TileBankMode;
  totalRounds: number;
  ttsEnabled: boolean;
}

const initialTiles: TileItem[] = [
  { id: 'c', label: 'C', value: 'C' },
  { id: 'a', label: 'A', value: 'A' },
  { id: 't', label: 'T', value: 'T' },
];

const initialZones: AnswerZone[] = [
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

const TapToPlaceBank = () => {
  const { allTiles, bankTileIds, zones } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();

  const nextEmptyZoneIndex = zones.findIndex(
    (z) => z.placedTileId === null,
  );

  return (
    <div className="flex gap-2">
      {bankTileIds.map((tileId) => {
        const tile = allTiles.find((t) => t.id === tileId);
        if (!tile) return null;
        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => {
              if (nextEmptyZoneIndex === -1) return;
              dispatch({
                type: 'PLACE_TILE',
                tileId: tile.id,
                zoneIndex: nextEmptyZoneIndex,
              });
            }}
            className="flex size-14 items-center justify-center rounded-lg border-2 border-primary bg-background text-xl font-bold shadow-sm active:scale-95"
          >
            {tile.label}
          </button>
        );
      })}
    </div>
  );
};

const PlayableScene = () => {
  const { zones } = useAnswerGameContext();

  return (
    <>
      <AnswerGame.Question>
        <p className="text-center text-lg font-semibold text-foreground">
          Spell CAT
        </p>
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <SlotRow className="gap-2">
          {zones.map((zone, i) => (
            <Slot
              key={zone.id}
              index={i}
              className="size-14 rounded-lg"
            >
              {({ label }) => (
                <span className="text-xl font-bold">{label ?? ''}</span>
              )}
            </Slot>
          ))}
        </SlotRow>
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <TapToPlaceBank />
      </AnswerGame.Choices>
    </>
  );
};

const meta: Meta<StoryArgs> = {
  component: AnswerGame as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  decorators: [withDb],
  args: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    ttsEnabled: false,
  },
  argTypes: {
    inputMethod: {
      control: { type: 'select' },
      options: ['drag', 'type', 'both'] satisfies InputMethod[],
    },
    wrongTileBehavior: {
      control: { type: 'select' },
      options: [
        'reject',
        'lock-manual',
        'lock-auto-eject',
      ] satisfies WrongTileBehavior[],
    },
    tileBankMode: {
      control: { type: 'select' },
      options: ['exact', 'distractors'] satisfies TileBankMode[],
    },
    totalRounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    ttsEnabled: { control: 'boolean' },
  },
  render: ({
    inputMethod,
    wrongTileBehavior,
    tileBankMode,
    totalRounds,
    ttsEnabled,
  }) => {
    const config: AnswerGameConfig = {
      gameId: 'storybook-answer-game',
      inputMethod,
      wrongTileBehavior,
      tileBankMode,
      totalRounds,
      ttsEnabled,
      initialTiles,
      initialZones,
    };
    return (
      <AnswerGame config={config}>
        <PlayableScene />
      </AnswerGame>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const TextQuestionMode: Story = {
  args: { inputMethod: 'type' },
};

export const RejectMode: Story = {
  args: { wrongTileBehavior: 'reject' },
};

export const LockManualMode: Story = {
  args: { wrongTileBehavior: 'lock-manual' },
};
