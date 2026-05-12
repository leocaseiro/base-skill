import { useNavigate, useParams } from '@tanstack/react-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { buildSortRound } from '../build-sort-round';
import { sortNumbersDefinition } from '../definition';
import { SortNumbersTileBank } from '../SortNumbersTileBank/SortNumbersTileBank';
import type { SortNumbersEngineContext } from '../definition';
import type { SortNumbersConfig } from '../types';
import type {
  AnswerGameAction,
  AnswerGameConfig,
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { UseGameEngineResult } from '@/lib/game-engine/definition-types';
import type { GameSkin } from '@/lib/skin';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { LevelCompleteOverlay } from '@/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import { getNumericTileFontClass } from '@/components/answer-game/tile-font';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { buildRoundOrder } from '@/games/build-round-order';
import { useGameEngine } from '@/lib/game-engine/useGameEngine';
import { getGameEventBus } from '@/lib/game-event-bus';
import { useGameSkin } from '@/lib/skin';

interface SortNumbersProps {
  config: SortNumbersConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  seed?: string;
}

type SortNumbersEngine = UseGameEngineResult<SortNumbersEngineContext>;

const SortNumbersSession = ({
  sortNumbersConfig,
  roundOrder,
  skin,
  onRestartSession,
  engine,
}: {
  sortNumbersConfig: SortNumbersConfig;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
  engine: SortNumbersEngine;
}) => {
  const { t } = useTranslation('games');
  const dispatch = useAnswerGameDispatch();
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });

  const phase = engine.phase;
  const roundIndex = engine.roundIndex;
  const retryCount = engine.retryCount;
  const levelIndex = engine.context.levelIndex;
  const zones = engine.context.zones;
  const showRoundComplete = phase === 'roundComplete';
  const showLevelComplete = phase === 'levelComplete';
  const showGameOver = phase === 'gameOver';

  const configRoundIndex = roundOrder[roundIndex];
  const round =
    configRoundIndex === undefined
      ? undefined
      : sortNumbersConfig.rounds[configRoundIndex];
  // In endless level mode the engine's `roundIndex` accumulates across
  // levels, so it can index past `roundOrder.length`. The engine's
  // `context.zones` is authoritative for what to render — it's reset on
  // every ADVANCE_LEVEL — so we don't gate on `round` when level mode
  // is active.
  const isLevelMode = sortNumbersConfig.levelMode !== undefined;

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

  // Round-advance is driven by XState's `after: 750` and `always`
  // transitions. When the machine settles in `waitingForNext`, compute
  // the next round's tiles/zones and dispatch ADVANCE_ROUND via the
  // reducer dispatch — AnswerGameProvider mirrors it to the engine via
  // engineDispatch, so reducer and engine advance together.
  useEffect(() => {
    if (engine.phase !== 'waitingForNext') return;
    const nextConfigIndex = roundOrder[engine.roundIndex + 1];
    const nextRound =
      nextConfigIndex === undefined
        ? undefined
        : sortNumbersConfig.rounds[nextConfigIndex];
    if (!nextRound) return;
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
      roundIndex: engine.roundIndex + 1,
    });
  }, [
    engine.phase,
    engine.roundIndex,
    dispatch,
    roundOrder,
    sortNumbersConfig.gameId,
    sortNumbersConfig.rounds,
    sortNumbersConfig.direction,
    sortNumbersConfig.tileBankMode,
    sortNumbersConfig.distractors,
    sortNumbersConfig.range,
  ]);

  if (!round && !isLevelMode) return null;
  if (zones.length === 0) return null;

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
        <skin.RoundCompleteEffect visible={showRoundComplete} />
      ) : (
        <ScoreAnimation visible={showRoundComplete} />
      )}
      {showLevelComplete ? (
        skin.LevelCompleteOverlay ? (
          <skin.LevelCompleteOverlay
            level={levelIndex + 1}
            onNextLevel={handleNextLevel}
            onDone={handleDone}
            nextLevelEnabled={showLevelComplete}
          />
        ) : (
          <LevelCompleteOverlay
            level={levelIndex + 1}
            onNextLevel={handleNextLevel}
            onDone={handleDone}
            nextLevelEnabled={showLevelComplete}
          />
        )
      ) : null}
      {showGameOver ? (
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

interface SortNumbersInstanceProps {
  config: SortNumbersConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
  tiles: TileItem[];
  zones: AnswerZone[];
}

/**
 * One game session. Holds the XState engine and forwards every reducer
 * dispatch to it via `engineDispatch`. Re-mounted (via key changes in the
 * outer SortNumbers component) when the player taps "Play again", which
 * destroys the engine actor and starts a fresh one from round 0.
 */
const SortNumbersInstance = ({
  config,
  initialState,
  sessionId,
  roundOrder,
  skin,
  onRestartSession,
  tiles,
  zones,
}: SortNumbersInstanceProps) => {
  const answerGameConfig = useMemo<AnswerGameConfig>(
    () => ({
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
      hud: config.hud,
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
      config.hud,
      tiles,
      zones,
    ],
  );

  const engine = useGameEngine<unknown, SortNumbersEngineContext>(
    sortNumbersDefinition,
    {
      input: {
        totalRounds: config.rounds.length,
        maxLevels: config.levelMode?.maxLevels ?? null,
        wrongTileBehavior: config.wrongTileBehavior,
      },
      totalRounds: config.rounds.length,
      levelSize:
        config.levelMode?.maxLevels !== undefined &&
        config.levelMode.maxLevels > 0
          ? Math.ceil(config.rounds.length / config.levelMode.maxLevels)
          : config.rounds.length,
      // PR 1b regression fix (handoff 2026-05-12): endless level mode
      // (simple-config: `levelMode` defined, no `maxLevels`) must not
      // transition the engine to `gameOver` after the last configured
      // round. The guards in `useGameEngine.buildEngineGuards` need both
      // signals to disambiguate "endless levels" from "no level mode".
      isLevelMode: config.levelMode !== undefined,
      maxLevels: config.levelMode?.maxLevels ?? null,
      envelope: { gameId: config.gameId },
    },
  );

  // Stable engineDispatch that always forwards to the latest engine.send
  // (which changes identity on every machine snapshot).
  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);
  const engineDispatch = useCallback((action: AnswerGameAction) => {
    engineRef.current.send(action as never);
  }, []);

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
      skin={skin}
      engineDispatch={engineDispatch}
      engineRoundIndex={engine.roundIndex}
    >
      <SortNumbersSession
        sortNumbersConfig={config}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={onRestartSession}
        engine={engine}
      />
    </AnswerGame>
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

  if (!round0) return null;

  return (
    <div
      className={`game-container skin-${skin.id}`}
      style={skin.tokens as React.CSSProperties}
    >
      {skin.SceneBackground ? <skin.SceneBackground /> : null}
      <SortNumbersInstance
        key={sessionEpoch}
        config={config}
        initialState={sessionEpoch === 0 ? initialState : undefined}
        sessionId={sessionId}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
        tiles={tiles}
        zones={zones}
      />
    </div>
  );
};
