import { useMachine } from '@xstate/react';
import { createContext, useContext, useMemo } from 'react';
import { executeSideEffects } from './side-effects';
import type {
  CelebrationConfig,
  GameDefinition,
  RoundOutput,
  UseGameEngineResult,
} from './definition-types';
import type { SoundKey } from '@/lib/audio/AudioFeedback';
import type { LifecycleEvent } from '@/lib/lifecycle-tts/types';
import type { GameEvent } from '@/types/game-events';
import { playSound } from '@/lib/audio/AudioFeedback';

export interface GameEngineContextValue<TRound = unknown> {
  definition: GameDefinition<TRound>;
  engine: UseGameEngineResult;
}

export const GameEngineContext =
  createContext<GameEngineContextValue | null>(null);

export const useGameEngineContext = <
  TRound,
>(): GameEngineContextValue<TRound> => {
  const ctx = useContext(GameEngineContext);
  if (!ctx) {
    throw new Error(
      'useGameEngineContext must be used within GameEngineContext.Provider',
    );
  }
  return ctx as GameEngineContextValue<TRound>;
};

interface EngineEnvelope {
  gameId: string;
  sessionId: string;
  profileId: string;
  roundIndex: number;
}

export const buildEngineGuards = (
  totalRounds: number,
  levelSize: number,
) => ({
  isMidLevelRound: ({
    context,
  }: {
    context: { roundIndex: number; levelIndex: number };
  }): boolean => {
    const positionInLevel =
      (context.roundIndex + 1) % Math.max(levelSize, 1);
    return (
      positionInLevel !== 0 && context.roundIndex + 1 < totalRounds
    );
  },
  isLastRoundOfLevel: ({
    context,
  }: {
    context: { roundIndex: number };
  }): boolean => {
    const positionInLevel =
      (context.roundIndex + 1) % Math.max(levelSize, 1);
    return (
      positionInLevel === 0 && context.roundIndex + 1 < totalRounds
    );
  },
  isLastRound: ({
    context,
  }: {
    context: { roundIndex: number };
  }): boolean => context.roundIndex + 1 >= totalRounds,
});

export interface UseGameEngineOptions {
  input?: unknown;
  envelope?: Partial<EngineEnvelope>;
  totalRounds?: number;
  levelSize?: number;
}

const readContextField = <T>(
  ctx: unknown,
  field: string,
  fallback: T,
): T => {
  if (typeof ctx === 'object' && ctx !== null && field in ctx) {
    const value = (ctx as Record<string, unknown>)[field];
    if (value !== undefined) return value as T;
  }
  return fallback;
};

export const useGameEngine = <TRound>(
  definition: GameDefinition<TRound>,
  options?: UseGameEngineOptions,
): UseGameEngineResult => {
  const envelope: EngineEnvelope = useMemo(
    () => ({
      gameId: definition.id,
      sessionId: options?.envelope?.sessionId ?? '',
      profileId: options?.envelope?.profileId ?? '',
      roundIndex: options?.envelope?.roundIndex ?? 0,
    }),
    [
      definition.id,
      options?.envelope?.sessionId,
      options?.envelope?.profileId,
      options?.envelope?.roundIndex,
    ],
  );

  const machineWithImpls = useMemo(() => {
    const totalRounds = options?.totalRounds ?? 0;
    const levelSize = options?.levelSize ?? totalRounds;

    return definition.machine.provide({
      guards: buildEngineGuards(totalRounds, levelSize),
      actions: {
        speak: (_, params) => {
          const typed = params as { lifecycleEvent: LifecycleEvent };
          executeSideEffects(
            [{ type: 'speak', lifecycleEvent: typed.lifecycleEvent }],
            envelope,
          );
        },
        emit: (_, params) => {
          const typed = params as { event: GameEvent };
          executeSideEffects(
            [{ type: 'emit', event: typed.event }],
            envelope,
          );
        },
        completeGame: ({ context }) => {
          const totalRoundsFromCtx = readContextField<number>(
            context,
            'totalRounds',
            options?.totalRounds ?? 0,
          );
          const retryCountFromCtx = readContextField<number>(
            context,
            'retryCount',
            0,
          );
          executeSideEffects(
            [
              {
                type: 'emit',
                event: {
                  ...envelope,
                  timestamp: Date.now(),
                  type: 'game:end',
                  finalScore: 0,
                  totalRounds: totalRoundsFromCtx,
                  correctCount: 0,
                  durationMs: 0,
                  retryCount: retryCountFromCtx,
                },
              },
            ],
            envelope,
          );
        },
        playSound: (_, params) => {
          const typed = params as { sound: SoundKey };
          playSound(typed.sound);
        },
      },
    });
    // adapter + dispatch dropped per PR 1a Spec Delta — XState-first means
    // no caller routes through a reducer in PR 1a. Memo on the inputs that
    // actually drive the machine.
  }, [definition, options?.totalRounds, options?.levelSize, envelope]);

  const useMachineOptions =
    options?.input === undefined ? undefined : { input: options.input };
  const [state, send] = useMachine(machineWithImpls, useMachineOptions);

  return useMemo<UseGameEngineResult>(() => {
    const totalRounds = readContextField<number>(
      state.context,
      'totalRounds',
      options?.totalRounds ?? 0,
    );
    const roundIndex = readContextField<number>(
      state.context,
      'roundIndex',
      0,
    );
    const levelIndex = readContextField<number>(
      state.context,
      'levelIndex',
      0,
    );
    const currentRound = readContextField<RoundOutput>(
      state.context,
      'lastRoundOutput',
      {} as RoundOutput,
    );
    return {
      phase:
        typeof state.value === 'string'
          ? state.value
          : (Object.keys(state.value)[0] ?? 'unknown'),
      currentRound,
      roundIndex,
      levelIndex,
      totalRounds,
      isLastRound: roundIndex + 1 >= totalRounds,
      send: (event) => send(event as never),
      // PR 1a Spec Delta 2: PR 1b populates from context.activeCelebration.
      celebrating: null as CelebrationConfig | null,
    };
  }, [state, send, options?.totalRounds]);
};
