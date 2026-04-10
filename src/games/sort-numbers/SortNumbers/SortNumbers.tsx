import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildSortRound } from '../build-sort-round';
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
import { LevelCompleteOverlay } from '@/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
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
  const { phase, roundIndex, retryCount, zones, levelIndex } =
    useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { confettiReady, levelCompleteReady, gameOverReady } =
    useGameSounds();
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

  const handleNextLevel = () => {
    const generateNextLevel =
      sortNumbersConfig.levelMode?.generateNextLevel;
    if (!generateNextLevel) return;

    const nextLevel = generateNextLevel(levelIndex);
    if (nextLevel) {
      dispatch({
        type: 'ADVANCE_LEVEL',
        tiles: nextLevel.tiles,
        zones: nextLevel.zones,
      });
    } else {
      dispatch({ type: 'COMPLETE_GAME' });
    }
  };

  const handleDone = () => {
    dispatch({ type: 'COMPLETE_GAME' });
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

      const distractor =
        sortNumbersConfig.tileBankMode === 'distractors'
          ? {
              config: sortNumbersConfig.distractors,
              range: sortNumbersConfig.range,
            }
          : undefined;

      const { tiles: nextTiles, zones: nextZones } = buildSortRound(
        nextRound.sequence,
        sortNumbersConfig.direction,
        distractor,
      );
      dispatch({
        type: 'ADVANCE_ROUND',
        tiles: nextTiles,
        zones: nextZones,
      });
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
    sortNumbersConfig.tileBankMode,
    sortNumbersConfig.distractors,
    sortNumbersConfig.range,
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
          <SlotRow className="gap-2">
            {zones.map((zone, i) => (
              <Slot
                key={zone.id}
                index={i}
                className="size-14 rounded-lg"
              >
                {({ label }) => (
                  <span className="text-2xl font-bold">{label}</span>
                )}
              </Slot>
            ))}
          </SlotRow>
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <SortNumbersTileBank />
        </AnswerGame.Choices>
      </div>
      <ScoreAnimation visible={confettiReady} />
      {levelCompleteReady ? (
        <LevelCompleteOverlay
          level={levelIndex + 1}
          onNextLevel={handleNextLevel}
          onDone={handleDone}
        />
      ) : null}
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
    const distractor =
      config.tileBankMode === 'distractors'
        ? { config: config.distractors, range: config.range }
        : undefined;
    return buildSortRound(
      round0.sequence,
      config.direction,
      distractor,
    );
  }, [
    round0,
    config.direction,
    config.tileBankMode,
    config.distractors,
    config.range,
  ]);

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
      slotInteraction: 'free-swap' as const,
      levelMode: config.levelMode,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.rounds.length,
      config.roundsInOrder,
      config.ttsEnabled,
      config.levelMode,
      tiles,
      zones,
    ],
  );

  if (!round0) return null;

  return (
    <AnswerGame
      key={sessionEpoch}
      config={answerGameConfig}
      initialState={sessionEpoch === 0 ? initialState : undefined}
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
