/** Aligned with docs/game-engine.md §3 (expand in M4 as needed). */
export type GradeBand =
  | 'pre-k'
  | 'k'
  | 'year1-2'
  | 'year3-4'
  | 'year5-6';

export type GameEventType =
  | 'game:start'
  | 'game:instructions_shown'
  | 'game:action'
  | 'game:evaluate'
  | 'game:score'
  | 'game:hint'
  | 'game:retry'
  | 'game:time_up'
  | 'game:end'
  | 'game:round-advance'
  | 'game:level-advance'
  | 'game:drag-start'
  | 'game:drag-over-zone'
  | 'game:tile-ejected';

export interface BaseGameEvent {
  type: GameEventType;
  gameId: string;
  sessionId: string;
  profileId: string;
  timestamp: number;
  roundIndex: number;
}

export interface GameStartEvent extends BaseGameEvent {
  type: 'game:start';
  locale: string;
  difficulty: string;
  gradeBand: GradeBand;
}

export interface GameInstructionsShownEvent extends BaseGameEvent {
  type: 'game:instructions_shown';
}

export interface GameActionEvent extends BaseGameEvent {
  type: 'game:action';
  actionType: string;
  payload: Record<string, string | number | boolean>;
}

export interface GameEvaluateEvent extends BaseGameEvent {
  type: 'game:evaluate';
  answer: string | string[] | number;
  correct: boolean;
  nearMiss: boolean;
  /** Index of the slot the tile was placed into. */
  zoneIndex: number;
  /** Expected value for the target slot — provides confusion pair for SRS. */
  expected?: string;
}

export interface GameScoreEvent extends BaseGameEvent {
  type: 'game:score';
  pointsAwarded: number;
  totalScore: number;
  streak: number;
}

export interface GameHintEvent extends BaseGameEvent {
  type: 'game:hint';
  hintType: string;
}

export interface GameRetryEvent extends BaseGameEvent {
  type: 'game:retry';
  retryCount: number;
}

export interface GameTimeUpEvent extends BaseGameEvent {
  type: 'game:time_up';
}

export interface GameEndEvent extends BaseGameEvent {
  type: 'game:end';
  finalScore: number;
  totalRounds: number;
  correctCount: number;
  durationMs: number;
  retryCount: number;
}

export interface GameRoundAdvanceEvent extends BaseGameEvent {
  type: 'game:round-advance';
}

export interface GameLevelAdvanceEvent extends BaseGameEvent {
  type: 'game:level-advance';
  levelIndex: number;
}

export interface GameDragStartEvent extends BaseGameEvent {
  type: 'game:drag-start';
  tileId: string;
}

export interface GameDragOverZoneEvent extends BaseGameEvent {
  type: 'game:drag-over-zone';
  zoneIndex: number;
}

export interface GameTileEjectedEvent extends BaseGameEvent {
  type: 'game:tile-ejected';
  zoneIndex: number;
  tileId: string | null;
}

export type GameEvent =
  | GameStartEvent
  | GameInstructionsShownEvent
  | GameActionEvent
  | GameEvaluateEvent
  | GameScoreEvent
  | GameHintEvent
  | GameRetryEvent
  | GameTimeUpEvent
  | GameEndEvent
  | GameRoundAdvanceEvent
  | GameLevelAdvanceEvent
  | GameDragStartEvent
  | GameDragOverZoneEvent
  | GameTileEjectedEvent;

export interface GameEventBus {
  emit: (event: GameEvent) => void;
  subscribe: (
    type: GameEventType | 'game:*',
    handler: (event: GameEvent) => void,
  ) => () => void;
}
