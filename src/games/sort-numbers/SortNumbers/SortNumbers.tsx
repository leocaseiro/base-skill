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
import type { GameSkin } from '@/lib/skin';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { LevelCompleteOverlay } from '@/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useGameSounds } from '@/components/answer-game/useGameSounds';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { buildRoundOrder } from '@/games/build-round-order';
import { getGameEventBus } from '@/lib/game-event-bus';
import { resolveTiming, useGameSkin } from '@/lib/skin';

interface SortNumbersProps {
  config: SortNumbersConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  seed?: string;
}

const SortNumbersSession = ({
  sortNumbersConfig,
  roundOrder,
  skin,
  onRestartSession,
}: {
  sortNumbersConfig: SortNumbersConfig;
  roundOrder: readonly number[];
  skin: GameSkin;
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
      getGameEventBus().emit({
        type: 'game:level-advance',
        gameId: sortNumbersConfig.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: 0,
        levelIndex: levelIndex + 1,
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
    const delayMs = resolveTiming(
      'roundAdvanceDelay',
      skin,
      sortNumbersConfig.timing,
    );
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
      getGameEventBus().emit({
        type: 'game:round-advance',
        gameId: sortNumbersConfig.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: roundIndex + 1,
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
    skin,
    sortNumbersConfig.gameId,
    sortNumbersConfig.rounds,
    sortNumbersConfig.direction,
    sortNumbersConfig.tileBankMode,
    sortNumbersConfig.distractors,
    sortNumbersConfig.range,
    sortNumbersConfig.timing,
  ]);

  if (!round) return null;

  return (
    <>
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6">
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
                skin={skin}
                className="size-14 rounded-lg"
              >
                {({ label }) => (
                  <span
                    className={`${getNumericTileFontClass(label?.length ?? 0, 56)} font-bold tabular-nums`}
                  >
                    {label}
                  </span>
                )}
              </Slot>
            ))}
          </SlotRow>
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <SortNumbersTileBank skin={skin} />
        </AnswerGame.Choices>
      </div>
      {skin.RoundCompleteEffect ? (
        <skin.RoundCompleteEffect visible={confettiReady} />
      ) : (
        <ScoreAnimation visible={confettiReady} />
      )}
      {levelCompleteReady ? (
        skin.LevelCompleteOverlay ? (
          <skin.LevelCompleteOverlay
            level={levelIndex + 1}
            onNextLevel={handleNextLevel}
            onDone={handleDone}
          />
        ) : (
          <LevelCompleteOverlay
            level={levelIndex + 1}
            onNextLevel={handleNextLevel}
            onDone={handleDone}
          />
        )
      ) : null}
      {gameOverReady ? (
        skin.CelebrationOverlay ? (
          <skin.CelebrationOverlay
            retryCount={retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        ) : (
          <GameOverOverlay
            retryCount={retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        )
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
  const skin = useGameSkin('sort-numbers', config.skin);
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
    <div
      className={`game-container skin-${skin.id}`}
      style={skin.tokens as React.CSSProperties}
    >
      {skin.SceneBackground ? <skin.SceneBackground /> : null}
      <AnswerGame
        key={sessionEpoch}
        config={answerGameConfig}
        initialState={sessionEpoch === 0 ? initialState : undefined}
        sessionId={sessionId}
      >
        <SortNumbersSession
          sortNumbersConfig={config}
          roundOrder={roundOrder}
          skin={skin}
          onRestartSession={() => {
            setSessionEpoch((e) => e + 1);
          }}
        />
      </AnswerGame>
    </div>
  );
};
