import type {
  EventTemplate,
  LifecycleEvent,
} from '@/lib/lifecycle-tts/types';
import type { GameEvent } from '@/types/game-events';
import type { AnyStateMachine } from 'xstate';

export type InteractionMode = 'drag-to-slot' | 'tap-select';

export type RoundOutput = Record<string, unknown>;

export interface PhaseContext {
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  isLastRound: boolean;
  gameId: string;
  previousPhase: string | null;
  currentPhase: string;
}

export interface CelebrationConfig {
  miniGame: string;
  condition?: (ctx: PhaseContext) => boolean;
  renderProps?: Record<string, unknown>;
}

export type SideEffect =
  | { type: 'emit'; event: GameEvent }
  | { type: 'speak'; lifecycleEvent: LifecycleEvent }
  | { type: 'delay'; ms: number };

export interface GameDefinition<TRound = unknown> {
  id: string;
  interaction: InteractionMode;
  slotInteraction?: 'ordered' | 'free-swap';
  machine: AnyStateMachine;
  buildRound: (ctx: PhaseContext) => TRound;
  tts?: Partial<Record<LifecycleEvent, EventTemplate>>;
}

export type GameMachineEvent =
  | { type: 'ROUND_CORRECT' }
  | { type: 'ROUND_ERROR' }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'GAME_OVER' }
  | { type: 'NEXT' }
  | { type: 'CELEBRATION_DONE'; skipMethod?: 'play-again' | 'go-home' };

export interface UseGameEngineResult {
  phase: string;
  currentRound: RoundOutput;
  roundIndex: number;
  levelIndex: number;
  totalRounds: number;
  isLastRound: boolean;
  send: (event: GameMachineEvent) => void;
  celebrating: CelebrationConfig | null;
}
