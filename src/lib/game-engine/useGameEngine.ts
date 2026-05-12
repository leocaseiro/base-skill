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

export interface EngineGuards {
  isMidLevelRound: (input: {
    context: { roundIndex: number; levelIndex: number };
  }) => boolean;
  isLastRoundOfLevel: (input: {
    context: { roundIndex: number };
  }) => boolean;
  isLastRound: (input: { context: { roundIndex: number } }) => boolean;
}

export interface BuildEngineGuardsConfig {
  /**
   * True when the surrounding config defines a `levelMode` block, even if
   * `maxLevels` is absent. Required to distinguish "endless level mode"
   * (e.g. SortNumbers simple-config: every round IS a level, generated on
   * demand by `levelMode.generateNextLevel`) from "no level mode"
   * (NumberMatch / WordSpell today). Without this signal, `maxLevels: null`
   * is ambiguous between the two — and the engine wrongly transitions to
   * `gameOver` after the last configured round in endless mode.
   */
  isLevelMode?: boolean;
  /** `null` means "no cap" (endless), `number` means finite levels. */
  maxLevels?: number | null;
}

export const buildEngineGuards = (
  totalRounds: number,
  levelSize: number,
  config: BuildEngineGuardsConfig = {},
): EngineGuards => {
  const isLevelMode = config.isLevelMode ?? false;
  const maxLevels = config.maxLevels ?? null;
  const isEndlessLevelMode = isLevelMode && maxLevels === null;

  return {
    isMidLevelRound: ({ context }) => {
      const positionInLevel =
        (context.roundIndex + 1) % Math.max(levelSize, 1);
      if (positionInLevel === 0) return false;
      if (isEndlessLevelMode) return true;
      return context.roundIndex + 1 < totalRounds;
    },
    isLastRoundOfLevel: ({ context }) => {
      const positionInLevel =
        (context.roundIndex + 1) % Math.max(levelSize, 1);
      if (positionInLevel !== 0) return false;
      if (isEndlessLevelMode) return true;
      return context.roundIndex + 1 < totalRounds;
    },
    isLastRound: ({ context }) => {
      if (isEndlessLevelMode) return false;
      return context.roundIndex + 1 >= totalRounds;
    },
  };
};

export interface UseGameEngineOptions {
  input?: unknown;
  envelope?: Partial<EngineEnvelope>;
  totalRounds?: number;
  levelSize?: number;
  /** See `BuildEngineGuardsConfig.isLevelMode`. */
  isLevelMode?: boolean;
  /** See `BuildEngineGuardsConfig.maxLevels`. */
  maxLevels?: number | null;
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

export const useGameEngine = <TRound, TContext = unknown>(
  definition: GameDefinition<TRound>,
  options?: UseGameEngineOptions,
): UseGameEngineResult<TContext> => {
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
      guards: buildEngineGuards(totalRounds, levelSize, {
        isLevelMode: options?.isLevelMode,
        maxLevels: options?.maxLevels,
      }),
      actions: {
        speak: (_, params: { lifecycleEvent: LifecycleEvent }) => {
          executeSideEffects(
            [{ type: 'speak', lifecycleEvent: params.lifecycleEvent }],
            envelope,
          );
        },
        emit: (_, params: { event: GameEvent }) => {
          executeSideEffects(
            [{ type: 'emit', event: params.event }],
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
          const roundIndexFromCtx = readContextField<number>(
            context,
            'roundIndex',
            envelope.roundIndex,
          );
          executeSideEffects(
            [
              {
                type: 'emit',
                event: {
                  ...envelope,
                  roundIndex: roundIndexFromCtx,
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
  }, [
    definition,
    options?.totalRounds,
    options?.levelSize,
    options?.isLevelMode,
    options?.maxLevels,
    envelope,
  ]);

  const useMachineOptions =
    options?.input === undefined ? undefined : { input: options.input };
  const [state, send] = useMachine(machineWithImpls, useMachineOptions);

  return useMemo<UseGameEngineResult<TContext>>(() => {
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
    const retryCount = readContextField<number>(
      state.context,
      'retryCount',
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
      context: state.context as TContext,
      currentRound,
      roundIndex,
      levelIndex,
      totalRounds,
      retryCount,
      isLastRound: roundIndex + 1 >= totalRounds,
      send: (event) => send(event as never),
      // PR 1a Spec Delta 2: PR 1b populates from context.activeCelebration.
      celebrating: null as CelebrationConfig | null,
    };
  }, [state, send, options?.totalRounds]);
};
