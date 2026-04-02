// src/lib/game-engine/replay.test.ts
import { describe, expect, it } from 'vitest';
import { replayToStep } from './replay';
import type {
  GameEngineState,
  Move,
  MoveHandler,
  MoveLog,
  ResolvedContent,
} from './types';

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'What is 1+1?' }, correctAnswer: '2' },
    { id: 'r2', prompt: { en: 'What is 2+2?' }, correctAnswer: '4' },
  ],
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

const baseLog: MoveLog = {
  gameId: 'test-game',
  sessionId: 'sess-1',
  profileId: 'prof-1',
  seed: 'seed-1',
  initialContent: content,
  initialState,
  moves: [],
};

// A simple handler that sets the answer and bumps score if correct
const submitHandler: MoveHandler = (state, args) => ({
  ...state,
  score:
    args['answer'] ===
    state.content.rounds[state.roundIndex].correctAnswer
      ? state.score + 1
      : state.score,
  currentRound: {
    ...state.currentRound,
    answer: args['answer'] as string,
  },
});

const moveHandlers: Record<string, MoveHandler> = {
  SUBMIT_ANSWER: submitHandler,
};

function makeMove(type: Move['type'], args: Move['args'] = {}): Move {
  return { type, args, timestamp: Date.now() };
}

describe('replayToStep', () => {
  it('returns initialState when moves array is empty', () => {
    const result = replayToStep(baseLog, 0, moveHandlers);
    expect(result).toEqual(initialState);
  });

  it('applies a single move correctly', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [makeMove('SUBMIT_ANSWER', { answer: '2' })],
    };
    const result = replayToStep(log, 0, moveHandlers);
    expect(result.score).toBe(1);
    expect(result.currentRound.answer).toBe('2');
  });

  it('replays up to stepIndex (not beyond)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }),
        makeMove('SUBMIT_ANSWER', { answer: '2' }),
      ],
    };
    // replay only step 0
    const result = replayToStep(log, 0, moveHandlers);
    expect(result.score).toBe(0); // wrong answer
    expect(result.currentRound.answer).toBe('wrong');
  });

  it('handles a single UNDO move (rolls back to targetStep)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }), // step 0
        makeMove('UNDO', { targetStep: 0 }), // step 1: undo step 0
      ],
    };
    // After UNDO at step 1 targeting step 0 (before step 0 was applied),
    // state should be initialState (score=0, answer=null)
    const result = replayToStep(log, 1, moveHandlers);
    expect(result.score).toBe(0);
    expect(result.currentRound.answer).toBe(null);
  });

  it('handles double UNDO correctly', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [
        makeMove('SUBMIT_ANSWER', { answer: 'wrong' }), // step 0
        makeMove('UNDO', { targetStep: 0 }), // step 1: undo to before step 0
        makeMove('SUBMIT_ANSWER', { answer: 'also-wrong' }), // step 2
        makeMove('UNDO', { targetStep: 0 }), // step 3: undo again
      ],
    };
    const result = replayToStep(log, 3, moveHandlers);
    expect(result.score).toBe(0);
    expect(result.currentRound.answer).toBe(null);
  });

  it('ignores unknown move types (no handler = identity)', () => {
    const log: MoveLog = {
      ...baseLog,
      moves: [makeMove('REQUEST_HINT', { hintIndex: 0 })],
    };
    const result = replayToStep(log, 0, moveHandlers);
    // No handler for REQUEST_HINT → state unchanged
    expect(result).toEqual(initialState);
  });
});
