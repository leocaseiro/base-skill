import { useNavigate, useParams } from '@tanstack/react-router';
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { buildSpotAllRound } from '../build-spot-all-round';
import {
  ROUND_ADVANCE_MS,
  WRONG_COOLDOWN_MS,
  createInitialSpotAllState,
  spotAllReducer,
} from '../spot-all-reducer';
import { SpotAllGrid } from '../SpotAllGrid/SpotAllGrid';
import { SpotAllPrompt } from '../SpotAllPrompt/SpotAllPrompt';
import type { SpotAllConfig } from '../types';
import type { CSSProperties, JSX } from 'react';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ProgressHUD } from '@/components/answer-game/ProgressHUD/ProgressHUD';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { buildRoundOrder } from '@/games/build-round-order';
import { playSound } from '@/lib/audio/AudioFeedback';
import { seededRandom } from '@/lib/seeded-random';
import { useGameSkin } from '@/lib/skin';

export const SpotAll = ({
  config,
  seed,
}: {
  config: SpotAllConfig;
  seed?: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });
  const skin = useGameSkin('spot-all');
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const phaseRef = useRef<string>('');

  const rounds = useMemo(() => {
    void sessionEpoch;
    const rng = seed === undefined ? Math.random : seededRandom(seed);
    const ordered = Array.from({ length: config.totalRounds }, () =>
      buildSpotAllRound(config, { rng }),
    );
    const order = buildRoundOrder(
      ordered.length,
      config.roundsInOrder,
      seed,
    );
    return order.map((index) => ordered[index]!).filter(Boolean);
  }, [config, seed, sessionEpoch]);

  const [state, dispatch] = useReducer(
    spotAllReducer,
    rounds,
    createInitialSpotAllState,
  );

  useEffect(() => {
    dispatch({ type: 'INIT_ROUNDS', rounds });
    const reset = globalThis.setTimeout(() => {
      setScoreVisible(false);
      setGameOverVisible(false);
    }, 0);
    return () => globalThis.clearTimeout(reset);
  }, [rounds]);

  useEffect(() => {
    const prev = phaseRef.current;
    phaseRef.current = state.phase;

    if (state.phase === 'round-complete' && prev !== 'round-complete') {
      const show = globalThis.setTimeout(() => {
        setScoreVisible(true);
        playSound('round-complete');
      }, 0);
      const hide = globalThis.setTimeout(() => {
        setScoreVisible(false);
        dispatch({ type: 'ADVANCE_ROUND' });
      }, ROUND_ADVANCE_MS);
      return () => {
        globalThis.clearTimeout(show);
        globalThis.clearTimeout(hide);
      };
    }

    if (state.phase === 'game-over' && prev !== 'game-over') {
      const timer = globalThis.setTimeout(() => {
        setGameOverVisible(true);
        playSound('game-complete');
      }, 400);
      return () => globalThis.clearTimeout(timer);
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.wrongCooldownIds.size === 0) return;
    const timers = [...state.wrongCooldownIds].map((tileId) =>
      globalThis.setTimeout(() => {
        dispatch({ type: 'CLEAR_WRONG_COOLDOWN', tileId });
      }, WRONG_COOLDOWN_MS),
    );
    return () => {
      for (const timer of timers) globalThis.clearTimeout(timer);
    };
  }, [state.wrongCooldownIds]);

  const handleTap = (tileId: string): void => {
    const tile = state.tiles.find((tile) => tile.id === tileId);
    if (!tile) return;
    if (state.wrongCooldownIds.has(tileId)) return;
    if (state.phase !== 'playing') return;
    if (tile.isCorrect && !state.selectedIds.has(tileId)) {
      playSound('correct');
    } else if (!tile.isCorrect) {
      playSound('wrong');
    }
    dispatch({ type: 'TAP_TILE', tileId });
  };

  const handlePlayAgain = (): void => setSessionEpoch((e) => e + 1);
  const handleHome = (): void => {
    void navigate({ to: '/$locale', params: { locale } });
  };

  const round = rounds[state.roundIndex];

  if (!round) return <></>;

  return (
    <div
      className={`game-container skin-${skin.id} flex w-full flex-col items-center gap-6`}
      style={skin.tokens as CSSProperties}
    >
      {skin.SceneBackground ? <skin.SceneBackground /> : null}
      <ProgressHUD
        roundIndex={state.roundIndex}
        totalRounds={rounds.length}
        levelIndex={0}
        isLevelMode={false}
        phase={
          state.phase === 'round-complete'
            ? 'round-complete'
            : 'playing'
        }
        showDots
        showFraction
        showLevel={false}
      />
      <SpotAllPrompt target={round.target} />
      <SpotAllGrid state={state} onTap={handleTap} />
      {skin.RoundCompleteEffect ? (
        <skin.RoundCompleteEffect visible={scoreVisible} />
      ) : (
        <ScoreAnimation visible={scoreVisible} />
      )}
      {gameOverVisible &&
        (skin.CelebrationOverlay ? (
          <skin.CelebrationOverlay
            retryCount={state.retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        ) : (
          <GameOverOverlay
            retryCount={state.retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        ))}
      <span className="sr-only" aria-live="polite">
        {t('spot-all-ui.prompt', { target: round.target })}
      </span>
    </div>
  );
};
