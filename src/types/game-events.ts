/** Aligned with docs/game-engine.md §3 (expand in M4 as needed). */
export type GradeBand = 'pre-k' | 'k' | 'year1-2' | 'year3-4' | 'year5-6'

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

export interface BaseGameEvent {
  type: GameEventType
  gameId: string
  sessionId: string
  profileId: string
  timestamp: number
  roundIndex: number
}

export interface GameStartEvent extends BaseGameEvent {
  type: 'game:start'
  locale: string
  difficulty: string
  gradeBand: GradeBand
}

export interface GameInstructionsShownEvent extends BaseGameEvent {
  type: 'game:instructions_shown'
}

export interface GameActionEvent extends BaseGameEvent {
  type: 'game:action'
  actionType: string
  payload: Record<string, string | number | boolean>
}

export interface GameEvaluateEvent extends BaseGameEvent {
  type: 'game:evaluate'
  answer: string | string[] | number
  correct: boolean
  nearMiss: boolean
}

export interface GameScoreEvent extends BaseGameEvent {
  type: 'game:score'
  pointsAwarded: number
  totalScore: number
  streak: number
}

export interface GameHintEvent extends BaseGameEvent {
  type: 'game:hint'
  hintType: string
}

export interface GameRetryEvent extends BaseGameEvent {
  type: 'game:retry'
  retryCount: number
}

export interface GameTimeUpEvent extends BaseGameEvent {
  type: 'game:time_up'
}

export interface GameEndEvent extends BaseGameEvent {
  type: 'game:end'
  finalScore: number
  totalRounds: number
  correctCount: number
  durationMs: number
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

export interface GameEventBus {
  emit: (event: GameEvent) => void
  subscribe: (
    type: GameEventType | 'game:*',
    handler: (event: GameEvent) => void,
  ) => () => void
}
