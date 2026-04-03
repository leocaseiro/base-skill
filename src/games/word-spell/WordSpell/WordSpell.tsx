import { useNavigate } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LetterTileBank } from '../LetterTileBank/LetterTileBank';
import { OrderedLetterSlots } from '../OrderedLetterSlots/OrderedLetterSlots';
import type { WordSpellConfig } from '../types';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { EmojiQuestion } from '@/components/questions/EmojiQuestion/EmojiQuestion';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';
import { buildRoundOrder } from '@/games/build-round-order';

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
  return [...trimmed.toLowerCase()];
}

function buildTilesAndZones(
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  const segments = segmentsForWord(word, tileUnit);
  const values = segments.map((s) =>
    tileUnit === 'letter' ? s.toLowerCase() : s.toUpperCase(),
  );
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

/** Renders prompts + progression; must sit inside `AnswerGame` / provider. */
const WordSpellSession = ({
  wordSpellConfig,
  roundOrder,
  onRestartSession,
}: {
  wordSpellConfig: WordSpellConfig;
  roundOrder: readonly number[];
  onRestartSession: () => void;
}) => {
  const { phase, roundIndex, retryCount } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const navigate = useNavigate();
  const completionToken = useRef(0);

  const configRoundIndex = roundOrder[roundIndex];
  const round =
    configRoundIndex === undefined
      ? undefined
      : wordSpellConfig.rounds[configRoundIndex];

  const handleHome = () => {
    void navigate({
      to: '/$locale/dashboard',
      params: { locale: 'en' },
    });
  };

  const handlePlayAgain = () => {
    onRestartSession();
  };

  useEffect(() => {
    if (phase !== 'round-complete') return;

    const token = ++completionToken.current;
    const delayMs = 750;
    const timer = globalThis.setTimeout(() => {
      if (completionToken.current !== token) return;

      const isLastRound = roundIndex >= roundOrder.length - 1;
      if (isLastRound) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }

      const nextConfigIndex = roundOrder[roundIndex + 1];
      const nextRound =
        nextConfigIndex === undefined
          ? undefined
          : wordSpellConfig.rounds[nextConfigIndex];
      const word = nextRound?.word.trim() ?? '';
      if (!word) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }
      const { tiles, zones } = buildTilesAndZones(
        word,
        wordSpellConfig.tileUnit,
      );
      dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [
    phase,
    roundIndex,
    dispatch,
    roundOrder,
    wordSpellConfig.rounds,
    wordSpellConfig.tileUnit,
  ]);

  if (!round) return null;

  const hasEmoji =
    wordSpellConfig.mode !== 'recall' && Boolean(round.emoji?.trim());
  const imageSrc = round.sceneImage ?? round.image;
  const hasImageUrl =
    wordSpellConfig.mode !== 'recall' && Boolean(imageSrc);

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
        <AnswerGame.Question>
          {wordSpellConfig.mode === 'sentence-gap' && round.sentence ? (
            <p className="max-w-md text-center text-lg text-foreground">
              {round.sentence}
            </p>
          ) : null}
          {hasEmoji ? (
            <EmojiQuestion
              emoji={round.emoji!.trim()}
              prompt={round.word}
            />
          ) : hasImageUrl ? (
            <ImageQuestion src={imageSrc!} prompt={round.word} />
          ) : null}
          <AudioButton prompt={round.word} />
        </AnswerGame.Question>
        <AnswerGame.Answer>
          <OrderedLetterSlots />
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <LetterTileBank />
        </AnswerGame.Choices>
      </div>
      <ScoreAnimation visible={phase === 'round-complete'} />
      {phase === 'game-over' ? (
        <GameOverOverlay
          retryCount={retryCount}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      ) : null}
    </>
  );
};

export const WordSpell = ({ config }: WordSpellProps) => {
  const roundsInOrder = config.roundsInOrder === true;
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    return buildRoundOrder(config.rounds.length, roundsInOrder);
  }, [config.rounds.length, roundsInOrder, sessionEpoch]);

  const firstConfigIndex = roundOrder[0];
  const round0 =
    firstConfigIndex === undefined
      ? undefined
      : config.rounds[firstConfigIndex];
  const roundWord = round0?.word.trim() ? round0.word : '';

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
      roundsInOrder: config.roundsInOrder,
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
      config.roundsInOrder,
      config.ttsEnabled,
      tiles,
      zones,
    ],
  );

  if (!round0) return null;

  return (
    <AnswerGame config={answerGameConfig}>
      <WordSpellSession
        wordSpellConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
};
