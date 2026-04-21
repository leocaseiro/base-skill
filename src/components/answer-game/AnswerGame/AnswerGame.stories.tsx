import { withDb } from '../../../../.storybook/decorators/withDb';
import { Slot } from '../Slot/Slot';
import { SlotRow } from '../Slot/SlotRow';
import { useAnswerGameContext } from '../useAnswerGameContext';
import { AnswerGame } from './AnswerGame';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties, ComponentType } from 'react';
import { LetterTileBank } from '@/games/word-spell/LetterTileBank/LetterTileBank';
import { classicSkin } from '@/lib/skin';

type InputMethod = 'drag' | 'type' | 'both';
type WrongTileBehavior = 'reject' | 'lock-manual' | 'lock-auto-eject';
type TileBankMode = 'exact' | 'distractors';

interface StoryArgs {
  inputMethod: InputMethod;
  wrongTileBehavior: WrongTileBehavior;
  tileBankMode: TileBankMode;
  totalRounds: number;
  ttsEnabled: boolean;
  // Raw AnswerGame props shadowed by StoryArgs above; declared here only
  // so we can hide their react-docgen-inferred rows from the Controls panel.
  config?: never;
  initialState?: never;
  sessionId?: never;
  skin?: never;
  children?: never;
}

const initialTiles: TileItem[] = [
  { id: 'c', label: 'c', value: 'c' },
  { id: 'a', label: 'a', value: 'a' },
  { id: 't', label: 't', value: 't' },
];

const initialZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'a',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 't',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

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
              skin={classicSkin}
              className="size-14"
            >
              {({ label }) => (
                <span className="text-xl font-bold">{label ?? ''}</span>
              )}
            </Slot>
          ))}
        </SlotRow>
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <LetterTileBank />
      </AnswerGame.Choices>
    </>
  );
};

const meta: Meta<StoryArgs> = {
  component: AnswerGame as unknown as ComponentType<StoryArgs>,
  title: 'answer-game/AnswerGame',
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
    config: { table: { disable: true } },
    initialState: { table: { disable: true } },
    sessionId: { table: { disable: true } },
    skin: { table: { disable: true } },
    children: { table: { disable: true } },
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
      <div
        className={`game-container skin-${classicSkin.id}`}
        style={classicSkin.tokens as CSSProperties}
      >
        <AnswerGame config={config} skin={classicSkin}>
          <PlayableScene />
        </AnswerGame>
      </div>
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: {
    inputMethod: 'drag',
    totalRounds: 9,
  },
};
