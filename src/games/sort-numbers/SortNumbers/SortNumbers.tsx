import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildSortRound } from '../build-sort-round';
import { NumberSequenceSlots } from '../NumberSequenceSlots/NumberSequenceSlots';
import { SortNumbersTileBank } from '../SortNumbersTileBank/SortNumbersTileBank';
import type { SortNumbersConfig } from '../types';
import type {
  AnswerGameConfig,
  AnswerGameDraftState,
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
import { buildRoundOrder } from '@/games/build-round-order';

interface SortNumbersProps {
  config: SortNumbersConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  seed?: string;
}

const SortNumbersSession = ({
  sortNumbersConfig,
  roundOrder,
  onRestartSession,
}: {
  sortNumbersConfig: SortNumbersConfig;
  roundOrder: readonly number[];
  onRestartSession: () => void;
}) => {
  const { t } = useTranslation('games');
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
      : sortNumbersConfig.rounds[configRoundIndex];

  const directionLabel =
    sortNumbersConfig.direction === 'ascending'
      ? t('sort-numbers-ui.ascending-label')
      : t('sort-numbers-ui.descending-label');

  useRoundTTS(directionLabel);

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
          : sortNumbersConfig.rounds[nextConfigIndex];

      if (!nextRound) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }

      const { tiles, zones } = buildSortRound(
        nextRound.sequence,
        sortNumbersConfig.direction,
      );
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
    sortNumbersConfig.rounds,
    sortNumbersConfig.direction,
  ]);

  if (!round) return null;

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
        <AnswerGame.Question>
          <p className="text-center text-lg font-semibold text-foreground">
            {directionLabel}
          </p>
        </AnswerGame.Question>
        <AnswerGame.Answer>
          <NumberSequenceSlots />
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <SortNumbersTileBank />
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

export const SortNumbers = ({
  config,
  initialState,
  sessionId,
  seed,
}: SortNumbersProps) => {
  const roundsInOrder = config.roundsInOrder === true;
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    return buildRoundOrder(config.rounds.length, roundsInOrder, seed);
  }, [config.rounds.length, roundsInOrder, seed, sessionEpoch]);

  const firstConfigIndex = roundOrder[0];
  const round0 =
    firstConfigIndex === undefined
      ? undefined
      : config.rounds[firstConfigIndex];

  const { tiles, zones } = useMemo(() => {
    if (!round0) {
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };
    }
    return buildSortRound(round0.sequence, config.direction);
  }, [round0, config.direction]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      totalRounds: config.rounds.length,
      roundsInOrder: config.roundsInOrder,
      ttsEnabled: config.ttsEnabled,
      touchKeyboardInputMode: 'numeric',
      initialTiles: tiles,
      initialZones: zones,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.rounds.length,
      config.roundsInOrder,
      config.ttsEnabled,
      tiles,
      zones,
    ],
  );

  if (!round0) return null;

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <SortNumbersSession
        sortNumbersConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
};
