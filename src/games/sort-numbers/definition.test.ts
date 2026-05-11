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

describe('SortNumbers machine — levelComplete', () => {
  it('after roundComplete on last round of level (not last round), advances to levelComplete', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    // Round 2 (last of level 1 with levelSize: 2):
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
    const levelCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'level-complete',
    );
    expect(levelCompleteCalls).toHaveLength(1);
  });

  it('ADVANCE_LEVEL from levelComplete increments levelIndex and returns to playing with reset round state', () => {
    vi.useFakeTimers();
    const { actor, context } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    playRound();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');

    const nextLevelTiles = [
      tile('t4', '4'),
      tile('t5', '5'),
      tile('t6', '6'),
    ];
    const nextLevelZones = [slot(0, '4'), slot(1, '5'), slot(2, '6')];
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: nextLevelTiles,
      zones: nextLevelZones,
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().levelIndex).toBe(1);
    expect(context().roundIndex).toBe(0);
    expect(context().retryCount).toBe(0);
  });

  it('COMPLETE_GAME from levelComplete jumps to gameOver', () => {
    vi.useFakeTimers();
    const { actor } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const playRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };
    playRound();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');

    actor.send({ type: 'COMPLETE_GAME' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });
});
