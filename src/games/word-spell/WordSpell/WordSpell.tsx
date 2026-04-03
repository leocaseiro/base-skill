import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { LetterTileBank } from '../LetterTileBank/LetterTileBank';
import { OrderedLetterSlots } from '../OrderedLetterSlots/OrderedLetterSlots';
import type { WordSpellConfig } from '../types';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';

function segmentsForWord(
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): string[] {
  const trimmed = word.trim();
  if (tileUnit === 'word') return [trimmed];
  if (tileUnit === 'syllable') {
    const parts = trimmed.split(/[-\s]+/).filter(Boolean);
    return parts.length > 0 ? parts : [trimmed];
  }
  return [...trimmed.toUpperCase()];
}

function buildTilesAndZones(
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  const segments = segmentsForWord(word, tileUnit);
  const values = segments.map((s) => s.toUpperCase());
  const zones: AnswerZone[] = values.map((value, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: value,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));
  const shuffled = [...values].toSorted((a, b) => a.localeCompare(b));
  const tiles: TileItem[] = shuffled.map((value) => ({
    id: nanoid(),
    label: value,
    value,
  }));
  return { tiles, zones };
}

interface WordSpellProps {
  config: WordSpellConfig;
}

export const WordSpell = ({ config }: WordSpellProps) => {
  const round = config.rounds[0];
  const roundWord = round?.word.trim() ? round.word : '';

  const { tiles, zones } = useMemo(() => {
    if (!roundWord)
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };
    return buildTilesAndZones(roundWord, config.tileUnit);
  }, [roundWord, config.tileUnit]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      totalRounds: config.rounds.length,
      ttsEnabled: config.ttsEnabled,
      initialTiles: tiles,
      initialZones: zones,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.distractorCount,
      config.rounds.length,
      config.ttsEnabled,
      tiles,
      zones,
    ],
  );

  if (!round) return null;

  const showImage =
    config.mode !== 'recall' &&
    Boolean(round.image ?? round.sceneImage);
  const imageSrc = round.sceneImage ?? round.image;

  return (
    <AnswerGame config={answerGameConfig}>
      <AnswerGame.Question>
        {config.mode === 'sentence-gap' && round.sentence ? (
          <p className="max-w-md text-center text-lg text-foreground">
            {round.sentence}
          </p>
        ) : null}
        {showImage && imageSrc ? (
          <ImageQuestion src={imageSrc} prompt={round.word} />
        ) : null}
        <AudioButton prompt={round.word} />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <OrderedLetterSlots />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <LetterTileBank />
      </AnswerGame.Choices>
    </AnswerGame>
  );
};
