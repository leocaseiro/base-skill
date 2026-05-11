import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { sortNumbersDefinition } from './definition';
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

const buildRound = () => ({
  tiles: [tile('t1', '1'), tile('t2', '2'), tile('t3', '3')],
  zones: [slot(0, '1'), slot(1, '2'), slot(2, '3')],
});

interface StartActorOptions {
  totalRounds?: number;
  maxLevels?: number | null;
  levelSize?: number;
  wrongTileBehavior?: 'reject' | 'lock-manual' | 'lock-auto-eject';
}

interface StartedActor {
  actor: Actor<AnyStateMachine>;
  mocks: {
    playSound: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
  context: () => Record<string, unknown>;
  zones: () => AnswerZone[];
}

const liveActors: Actor<AnyStateMachine>[] = [];

const startActor = (options: StartActorOptions = {}): StartedActor => {
  const totalRounds = options.totalRounds ?? 3;
  const levelSize = options.levelSize ?? totalRounds;
  const guards = buildEngineGuards(totalRounds, levelSize);
  const mocks = {
    playSound: vi.fn(),
    speak: vi.fn(),
    completeGame: vi.fn(),
    emit: vi.fn(),
  };
  const actor = createActor(
    sortNumbersDefinition.machine.provide({ guards, actions: mocks }),
    {
      input: {
        totalRounds,
        maxLevels: options.maxLevels ?? null,
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
  while (liveActors.length > 0) liveActors.pop()?.stop();
  vi.useRealTimers();
});

const initEvent = (tiles: TileItem[], zones: AnswerZone[]) =>
  ({ type: 'INIT_ROUND', tiles, zones }) as const;

describe('SortNumbers machine — INIT_ROUND + level flags', () => {
  it('starts in playing with levelIndex 0', () => {
    const { actor, context } = startActor({
      maxLevels: 3,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('playing');
    expect(context().levelIndex).toBe(0);
    expect(context().isLevelMode).toBe(true);
  });

  it('maxLevels: null leaves isLevelMode false', () => {
    const { actor, context } = startActor({ maxLevels: null });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(context().isLevelMode).toBe(false);
  });
});
