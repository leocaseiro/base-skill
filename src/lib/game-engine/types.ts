// src/lib/game-engine/types.ts
import type { GradeBand } from '@/types/game-events';

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'instructions'
  | 'playing'
  | 'evaluating'
  | 'scoring'
  | 'next-round'
  | 'retry'
  | 'game-over';

export interface RoundDefinition {
  id: string;
  prompt: Record<string, string>; // locale-keyed: { en: '...', 'pt-BR': '...' }
  correctAnswer: string;
  distractors?: string[];
}

export interface ResolvedContent {
  rounds: RoundDefinition[];
}

export interface RoundState {
  roundId: string;
  answer: string | null;
  hintsUsed: number;
}

export interface GameEngineState {
  phase: GamePhase;
  roundIndex: number;
  score: number;
  streak: number;
  retryCount: number;
  content: ResolvedContent;
  currentRound: RoundState;
}

export type MoveType =
  | 'SUBMIT_ANSWER'
  | 'REQUEST_HINT'
  | 'SKIP_INSTRUCTIONS'
  | 'UNDO';

export interface Move {
  type: MoveType | string; // string allows game-specific types in M5
  args: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface MoveLog {
  gameId: string;
  sessionId: string;
  profileId: string;
  seed: string;
  initialContent: ResolvedContent;
  initialState: GameEngineState;
  moves: Move[];
}

export interface ResolvedGameConfig {
  gameId: string;
  title: Record<string, string>; // { en: '...', 'pt-BR': '...' }
  gradeBand: GradeBand;
  maxRounds: number;
  maxRetries: number;
  maxUndoDepth: number | null; // null = unlimited; 0 = no undo
  timerVisible: boolean;
  timerDurationSeconds: number | null;
  difficulty: string;
}

export type MoveHandler = (
  state: GameEngineState,
  args: Move['args'],
) => GameEngineState;

export interface SessionMeta {
  profileId: string;
  gameId: string;
  gradeBand: GradeBand;
  seed: string;
  initialContent: ResolvedContent;
  initialState: GameEngineState;
}

export { type GradeBand } from '@/types/game-events';
