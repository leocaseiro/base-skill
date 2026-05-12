import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { wordSpellDefinition } from './definition';
import type {
  WordSpellEngineContext,
  wordSpellMachine,
} from './definition';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { Actor } from 'xstate';
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
  // (review #26) Typed against the concrete machine instead of AnyStateMachine.
  actor: Actor<typeof wordSpellMachine>;
  mocks: {
    playSound: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    completeGame: ReturnType<typeof vi.fn>;
  };
  // (review #25) Strongly-typed engine context for autocomplete + safety.
  context: () => WordSpellEngineContext;
  zones: () => AnswerZone[];
}

const liveActors: Actor<typeof wordSpellMachine>[] = [];

const startActor = (options: StartActorOptions = {}): StartedActor => {
  const totalRounds = options.totalRounds ?? 3;
  const guards = buildEngineGuards(totalRounds, totalRounds);
  const mocks = {
    playSound: vi.fn(),
    speak: vi.fn(),
    completeGame: vi.fn(),
  };
  const actor: Actor<typeof wordSpellMachine> = createActor(
    wordSpellDefinition.machine.provide({
      guards,
      actions: mocks,
    }) as typeof wordSpellMachine,
    {
      input: {
        totalRounds,
        maxLevels: null,
        wrongTileBehavior:
          options.wrongTileBehavior ?? 'lock-auto-eject',
      },
    },
  );
  actor.start();
  liveActors.push(actor);
  return {
    actor,
    mocks,
    context: () => actor.getSnapshot().context,
    zones: () => actor.getSnapshot().context.zones,
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
    expect(context().allTiles.some((t) => t.id === 'typed-z0')).toBe(
      true,
    );
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

  it('RESUME_ROUND restores draft fields and keeps machine in playing (review #11)', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const draft = {
      allTiles: [tile('t1', 'c'), tile('t2', 'a')],
      bankTileIds: ['t2'],
      zones: [slot(0, 'c', { placedTileId: 't1' }), slot(1, 'a')],
      activeSlotIndex: 1,
      phase: 'playing' as const,
      roundIndex: 2,
      retryCount: 1,
      levelIndex: 0,
    };
    actor.send({ type: 'RESUME_ROUND', draft });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(2);
    expect(context().retryCount).toBe(1);
    expect(context().activeSlotIndex).toBe(1);
    expect(context().dragActiveTileId).toBeNull();
  });

  it('after 750ms in roundComplete on non-last round, advances to waitingForNext (review #12)', () => {
    vi.useFakeTimers();
    const { actor } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');
  });

  it('CELEBRATION_DONE on last round routes directly to gameOver (review #13)', () => {
    const { actor } = startActor({ totalRounds: 1 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });

  it('canEject blocks EJECT_TILE when zone is correct (not wrong, not locked) (review #14)', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[0]?.isLocked).toBe(false);
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
  });

  it('REMOVE_TILE on an empty slot is a no-op (review #33)', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(context().zones).toEqual(before.zones);
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

describe('WordSpell machine — error / no-op paths', () => {
  it('PLACE_TILE with unknown tileId is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'PLACE_TILE',
      tileId: 'nonexistent',
      zoneIndex: 0,
    });
    expect(context().zones).toEqual(before.zones);
    expect(context().bankTileIds).toEqual(before.bankTileIds);
  });

  it('PLACE_TILE with out-of-range zoneIndex is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 99 });
    expect(context().zones).toEqual(before.zones);
  });

  it('ADVANCE_ROUND while in playing is ignored', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(before.roundIndex);
  });

  it('drag events during roundComplete do not mutate context', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    const dragBefore = context().dragActiveTileId;
    actor.send({ type: 'SET_DRAG_ACTIVE', tileId: 'sneaky' });
    expect(context().dragActiveTileId).toBe(dragBefore);
  });
});

describe('WordSpell machine — integration', () => {
  it('completes a full three-round game ending in gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playThrough = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    playThrough();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);

    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('root-level GAME_OVER handler is defense-in-depth', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('playing');
    actor.send({ type: 'GAME_OVER' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });

  it('root-level COMPLETE_GAME handler routes any state to gameOver (review #35)', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('playing');
    actor.send({ type: 'COMPLETE_GAME' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });

  it('INIT_ROUND from gameOver is ignored — does not reset roundIndex (review #2)', () => {
    const { actor, context } = startActor({ totalRounds: 1 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });
    expect(actor.getSnapshot().value).toBe('gameOver');

    const before = context();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(context().roundIndex).toBe(before.roundIndex);
  });

  it('RESUME_ROUND from roundComplete is ignored — celebration window is sealed (review #2)', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    const before = context();
    actor.send({
      type: 'RESUME_ROUND',
      draft: {
        allTiles: [],
        bankTileIds: [],
        zones: [],
        activeSlotIndex: 0,
        phase: 'playing' as const,
        roundIndex: 99,
        retryCount: 99,
        levelIndex: 99,
      },
    });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    expect(context().roundIndex).toBe(before.roundIndex);
    expect(context().retryCount).toBe(before.retryCount);
  });
});
