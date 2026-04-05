import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildNumeralRound } from '../build-numeral-round';
import { MatchingPairZones } from '../MatchingPairZones/MatchingPairZones';
import { NumeralTileBank } from '../NumeralTileBank/NumeralTileBank';
import type { NumberMatchConfig } from '../types';
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
import { useGameSounds } from '@/components/answer-game/useGameSounds';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { DotGroupQuestion } from '@/components/questions/DotGroupQuestion/DotGroupQuestion';
import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';
import { buildRoundOrder } from '@/games/build-round-order';

interface NumberMatchProps {
  config: NumberMatchConfig;
}

const NumberMatchSession = ({
  numberMatchConfig,
  roundOrder,
  onRestartSession,
}: {
  numberMatchConfig: NumberMatchConfig;
  roundOrder: readonly number[];
  onRestartSession: () => void;
}) => {
  const { phase, roundIndex, retryCount } = useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { confettiReady, gameOverReady } = useGameSounds();
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });
  const completionToken = useRef(0);

  const configRoundIndex = roundOrder[roundIndex];
  const round =
    configRoundIndex === undefined
      ? undefined
      : numberMatchConfig.rounds[configRoundIndex];

  useRoundTTS(String(round?.value ?? ''));

  const handleHome = () => {
    void navigate({ to: '/$locale', params: { locale } });
  };

  const handlePlayAgain = () => {
    onRestartSession();
  };

  useEffect(() => {
    if (phase !== 'round-complete' || !confettiReady) return;

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
          : numberMatchConfig.rounds[nextConfigIndex];
      const value = nextRound?.value;
      if (value === undefined) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }
      const { tiles, zones } = buildNumeralRound(value, {
        tileBankMode: numberMatchConfig.tileBankMode,
        distractorCount: numberMatchConfig.distractorCount,
        range: numberMatchConfig.range,
      });
      dispatch({ type: 'ADVANCE_ROUND', tiles, zones });
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [
    phase,
    confettiReady,
    roundIndex,
    dispatch,
    roundOrder,
    numberMatchConfig.rounds,
    numberMatchConfig.tileBankMode,
    numberMatchConfig.distractorCount,
    numberMatchConfig.range,
  ]);

  if (!round) return null;

  const showTextQuestion =
    numberMatchConfig.mode === 'numeral-to-group' ||
    numberMatchConfig.mode === 'numeral-to-word' ||
    numberMatchConfig.mode === 'word-to-numeral';

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
        <AnswerGame.Question>
          {showTextQuestion ? (
            <TextQuestion text={String(round.value)} />
          ) : (
            <DotGroupQuestion
              count={round.value}
              prompt={String(round.value)}
            />
          )}
          <AudioButton prompt={String(round.value)} />
        </AnswerGame.Question>
        <AnswerGame.Answer>
          <MatchingPairZones />
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <NumeralTileBank tileStyle={numberMatchConfig.tileStyle} />
        </AnswerGame.Choices>
      </div>
      <ScoreAnimation visible={confettiReady} />
      {gameOverReady ? (
        <GameOverOverlay
          retryCount={retryCount}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      ) : null}
    </>
  );
};

export const NumberMatch = ({ config }: NumberMatchProps) => {
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
  const roundValue = round0?.value;

  const { tiles, zones } = useMemo(() => {
    if (roundValue === undefined) {
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };
    }
    return buildNumeralRound(roundValue, {
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      range: config.range,
    });
  }, [
    roundValue,
    config.tileBankMode,
    config.distractorCount,
    config.range,
  ]);

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
      <NumberMatchSession
        numberMatchConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
};
