import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { wordSpellDefinition } from './definition';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { Actor, AnyStateMachine } from 'xstate';
import { buildEngineGuards } from '@/lib/game-engine/useGameEngine';

const tile = (id: string, value: string): TileItem => ({
  id,
  label: value,
  value,
});

const slot = (
  index: number,
  expectedValue: string,
  overrides: Partial<AnswerZone> = {},
): AnswerZone => ({
  id: `z${index}`,
  index,
  expectedValue,
  placedTileId: null,
  isWrong: false,
  isLocked: false,
  ...overrides,
});

// "cat" — three single-letter tiles to three slots.
const buildRound = () => ({
  tiles: [tile('t1', 'c'), tile('t2', 'a'), tile('t3', 't')],
  zones: [slot(0, 'c'), slot(1, 'a'), slot(2, 't')],
});

interface StartActorOptions {
  totalRounds?: number;
  wrongTileBehavior?: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

interface StartedActor {
  actor: Actor<AnyStateMachine>;
  mocks: {
    playSound: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
  };
  context: () => Record<string, unknown>;
  zones: () => AnswerZone[];
}

const liveActors: Actor<AnyStateMachine>[] = [];

const startActor = (options: StartActorOptions = {}): StartedActor => {
  const totalRounds = options.totalRounds ?? 3;
  const guards = buildEngineGuards(totalRounds, totalRounds);
  const mocks = {
    playSound: vi.fn(),
    speak: vi.fn(),
    completeGame: vi.fn(),
  };
  const actor = createActor(
    wordSpellDefinition.machine.provide({
      guards,
      actions: mocks,
    }),
    {
      input: {
        totalRounds,
        maxLevels: null,
        wrongTileBehavior:
          options.wrongTileBehavior ?? 'lock-auto-eject',
      },
    },
  ) as Actor<AnyStateMachine>;
  actor.start();
  liveActors.push(actor);
  return {
    actor,
    mocks,
    context: () =>
      actor.getSnapshot().context as Record<string, unknown>,
    zones: () =>
      (actor.getSnapshot().context as { zones: AnswerZone[] }).zones,
  };
};

afterEach(() => {
  while (liveActors.length > 0) {
    liveActors.pop()?.stop();
  }
  vi.useRealTimers();
});

const initEvent = (tiles: TileItem[], zones: AnswerZone[]) =>
  ({ type: 'INIT_ROUND', tiles, zones }) as const;

describe('WordSpell machine — happy path', () => {
  it('starts in playing with roundIndex 0 after INIT_ROUND', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('playing');
    expect(context().roundIndex).toBe(0);
    expect(context().bankTileIds).toEqual(['t1', 't2', 't3']);
  });
});
