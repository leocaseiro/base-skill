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

  it('PLACE_TILE on correct slot updates placedTileId, removes tile from bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(context().bankTileIds).toEqual(['t2', 't3']);
  });

  it('TYPE_TILE on empty slot creates a virtual tile and marks correct', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: 'c',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBe('typed-z0');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(
      (context().allTiles as TileItem[]).some(
        (t) => t.id === 'typed-z0',
      ),
    ).toBe(true);
  });

  it('REMOVE_TILE on placed slot returns real tile to bank and clears slot', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t1');
  });

  it('completing all zones via PLACE_TILE transitions atomically to roundComplete', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
  });

  it('roundComplete entry fires playSound("round-complete")', () => {
    const { actor, mocks } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(mocks.playSound).toHaveBeenCalledTimes(1);
    expect(mocks.playSound.mock.calls[0]?.[1]).toEqual({
      sound: 'round-complete',
    });
  });

  it('after 750ms in roundComplete on last round, advances to gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({ totalRounds: 1 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.playSound).toHaveBeenCalledWith(expect.anything(), {
      sound: 'game-complete',
    });
    expect(mocks.speak).toHaveBeenCalledWith(expect.anything(), {
      lifecycleEvent: 'game.over',
    });
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('ADVANCE_ROUND from waitingForNext increments roundIndex and returns to playing', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });

    const nextTiles = [
      tile('t4', 'd'),
      tile('t5', 'o'),
      tile('t6', 'g'),
    ];
    const nextZones = [slot(0, 'd'), slot(1, 'o'), slot(2, 'g')];
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: nextTiles,
      zones: nextZones,
    });

    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(1);
    expect(context().allTiles).toEqual(nextTiles);
    expect(context().retryCount).toBe(0);
  });
});

describe('WordSpell machine — edge cases', () => {
  it('PLACE_TILE on wrong slot (lock-auto-eject) locks the tile, bumps retry', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t2');
    expect(zones()[0]?.isWrong).toBe(true);
    expect(zones()[0]?.isLocked).toBe(true);
    expect(context().retryCount).toBe(1);
  });

  it('TYPE_TILE with wrong value (reject mode) bumps retryCount, leaves slot empty', () => {
    const { actor, zones, context } = startActor({
      wrongTileBehavior: 'reject',
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: 'x',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().retryCount).toBe(1);
  });

  it('EJECT_TILE on a wrong-locked slot clears it and returns tile to bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t2');
  });

  it('SWAP_TILES exchanges two placed slots and recomputes correctness', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 1 });
    actor.send({
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 1,
    });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[1]?.placedTileId).toBe('t2');
    expect(zones()[1]?.isWrong).toBe(false);
  });
});
