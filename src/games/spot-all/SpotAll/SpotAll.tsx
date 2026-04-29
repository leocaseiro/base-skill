import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { buildSpotAllRound } from '../build-spot-all-round';
import {
  createInitialSpotAllState,
  spotAllReducer,
} from '../spot-all-reducer';
import { SpotAllGrid } from '../SpotAllGrid/SpotAllGrid';
import { SpotAllPrompt } from '../SpotAllPrompt/SpotAllPrompt';
import type { SpotAllConfig } from '../types';
import type { JSX } from 'react';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { buildRoundOrder } from '@/games/build-round-order';

export const SpotAll = ({
  config,
  seed,
}: {
  config: SpotAllConfig;
  seed?: string;
}): JSX.Element => {
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const rounds = useMemo(() => {
    void sessionEpoch;
    const ordered = Array.from({ length: config.totalRounds }, () =>
      buildSpotAllRound(config),
    );
    const order = buildRoundOrder(
      ordered.length,
      config.roundsInOrder === true,
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
  }, [rounds]);

  useEffect(() => {
    if (state.phase !== 'round-complete') return;
    const timer = globalThis.setTimeout(() => {
      dispatch({ type: 'ADVANCE_ROUND' });
    }, 700);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [state.phase]);

  if (state.phase === 'game-over') {
    return (
      <GameOverOverlay
        retryCount={0}
        onPlayAgain={() => setSessionEpoch((value) => value + 1)}
        onHome={() =>
          void navigate({ to: '/$locale', params: { locale } })
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <SpotAllPrompt target={rounds[state.roundIndex]?.target ?? '?'} />
      <SpotAllGrid
        state={state}
        onToggleTile={(tileId) => {
          dispatch({ type: 'TOGGLE_TILE', tileId });
        }}
      />
      <div className="flex items-center justify-center">
        <button
          type="button"
          className="rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
          onClick={() => dispatch({ type: 'SUBMIT' })}
        >
          Check
        </button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Round {state.roundIndex + 1} of {rounds.length}
      </p>
    </div>
  );
};
