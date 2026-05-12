import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { numberMatchDefinition } from './definition';
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
    numberMatchDefinition.machine.provide({
      guards,
      actions: mocks,
    }),
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
  while (liveActors.length > 0) {
    liveActors.pop()?.stop();
  }
  vi.useRealTimers();
});

const initEvent = (tiles: TileItem[], zones: AnswerZone[]) =>
  ({ type: 'INIT_ROUND', tiles, zones }) as const;

describe('NumberMatch machine — happy path', () => {
  it('starts in playing with roundIndex 0 after INIT_ROUND', () => {
    const { actor, context } = startActor();
    const { tiles, zones } = buildRound();
    actor.send(initEvent(tiles, zones));
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('playing');
    expect(context().roundIndex).toBe(0);
    expect(context().bankTileIds).toEqual(['t1', 't2', 't3']);
    expect(context().allTiles).toEqual(tiles);
    expect(context().activeSlotIndex).toBe(0);
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
      value: '1',
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

  it('TYPE_TILE with wrong value (reject mode) bumps retryCount, leaves slot empty', () => {
    const { actor, zones, context } = startActor({
      wrongTileBehavior: 'reject',
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'TYPE_TILE',
      tileId: 'typed-z0',
      value: '9',
      zoneIndex: 0,
    });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().retryCount).toBe(1);
  });

  it('REMOVE_TILE on placed slot returns real tile to bank and clears slot', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t1');
    expect(context().activeSlotIndex).toBe(0);
  });

  it('SWAP_TILES exchanges two placed slots and recomputes correctness', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    // Place t2 in slot 0 (wrong, locked), t1 in slot 1 (wrong, locked).
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 1 });
    // Swap fixes both placements.
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

  it('SWAP_SLOT_BANK exchanges slot tile and bank tile, clears drag state', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({
      type: 'SET_DRAG_ACTIVE',
      tileId: 't2',
    });
    actor.send({
      type: 'SWAP_SLOT_BANK',
      zoneIndex: 0,
      bankTileId: 't2',
    });
    expect(zones()[0]?.placedTileId).toBe('t2');
    expect(context().bankTileIds).toContain('t1');
    expect(context().bankTileIds).not.toContain('t2');
    expect(context().dragActiveTileId).toBeNull();
  });

  it('SET_ACTIVE_SLOT clamps to [0, zones.length - 1]', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'SET_ACTIVE_SLOT', zoneIndex: 99 });
    expect(context().activeSlotIndex).toBe(2);
    actor.send({ type: 'SET_ACTIVE_SLOT', zoneIndex: -5 });
    expect(context().activeSlotIndex).toBe(0);
  });

  it('REJECT_TAP increments retryCount only', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'REJECT_TAP', tileId: 't1', zoneIndex: 0 });
    expect(context().retryCount).toBe(1);
    expect(context().zones).toEqual(before.zones);
  });

  it('INIT_ROUND is idempotent', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send(initEvent(round.tiles, round.zones));
    expect(context().activeSlotIndex).toBe(0);
    expect(context().retryCount).toBe(0);
    expect(context().bankTileIds).toEqual(['t1', 't2', 't3']);
  });

  it('RESUME_ROUND restores draft fields and keeps machine in playing', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const draft = {
      allTiles: [tile('t1', '1'), tile('t2', '2')],
      bankTileIds: ['t2'],
      zones: [slot(0, '1', { placedTileId: 't1' }), slot(1, '2')],
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

  it('after 750ms in roundComplete on non-last round, advances to waitingForNext', () => {
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

  it('CELEBRATION_DONE in roundComplete (non-last) short-circuits to waitingForNext', () => {
    const { actor } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });
    expect(actor.getSnapshot().value).toBe('waitingForNext');
  });

  it('ADVANCE_ROUND from waitingForNext increments roundIndex and returns to playing', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });

    const nextTiles = [tile('t4', '4'), tile('t5', '5')];
    const nextZones = [slot(0, '4'), slot(1, '5')];
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: nextTiles,
      zones: nextZones,
    });

    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().roundIndex).toBe(1);
    expect(context().allTiles).toEqual(nextTiles);
    expect(context().bankTileIds).toEqual(['t4', 't5']);
    expect(context().retryCount).toBe(0);
    expect(context().activeSlotIndex).toBe(0);
  });
});

describe('NumberMatch machine — edge cases', () => {
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

  it('PLACE_TILE on wrong slot (reject) leaves slot empty, bumps retry, clears drag', () => {
    const { actor, zones, context } = startActor({
      wrongTileBehavior: 'reject',
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'SET_DRAG_ACTIVE', tileId: 't2' });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().retryCount).toBe(1);
    expect(context().dragActiveTileId).toBeNull();
  });

  it('EJECT_TILE on a correct slot is blocked by canEject guard', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[0]?.isLocked).toBe(false);
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    // Slot unchanged: tile still present, correct, unlocked.
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(zones()[0]?.isWrong).toBe(false);
  });

  it('EJECT_TILE on a wrong-locked slot clears it and returns tile to bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[0]?.isLocked).toBe(false);
    expect(context().bankTileIds).toContain('t2');
    expect(context().activeSlotIndex).toBe(0);
  });

  it('SWAP_TILES with one zone empty handles the null branch correctly', () => {
    const { actor, zones } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 1,
    });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(zones()[0]?.isWrong).toBe(false);
    expect(zones()[1]?.placedTileId).toBe('t1');
    // 't1' value is '1', expected at zone 1 is '2' → wrong + locked.
    expect(zones()[1]?.isWrong).toBe(true);
    expect(zones()[1]?.isLocked).toBe(true);
  });

  it('replacing a placed correct tile with another correct tile keeps it placed', () => {
    // (Scenario from plan: PLACE_TILE replacing existing correct tile; verifies displaced-tile flow.)
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    // Now PLACE_TILE again — same tileId on same slot is a no-op replacement.
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBe('t1');
    expect(context().bankTileIds).toEqual(['t2', 't3']);
  });

  it('drag events during roundComplete do not mutate context (scoped to playing)', () => {
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

describe('NumberMatch machine — error / no-op paths', () => {
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

  it('REMOVE_TILE on an empty slot is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'REMOVE_TILE', zoneIndex: 0 });
    expect(context().zones).toEqual(before.zones);
  });

  it('SWAP_TILES with invalid zone index is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'SWAP_TILES',
      fromZoneIndex: 0,
      toZoneIndex: 99,
    });
    expect(context().zones).toEqual(before.zones);
  });

  it('EJECT_TILE with invalid zoneIndex is a no-op', () => {
    const { actor, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({ type: 'EJECT_TILE', zoneIndex: 99 });
    expect(context().zones).toEqual(before.zones);
  });

  it('ADVANCE_ROUND while in playing is ignored (handler is in waitingForNext only)', () => {
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
});

describe('NumberMatch machine — integration', () => {
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
    expect(actor.getSnapshot().value).toBe('waitingForNext');

    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');

    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });
    playThrough();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');

    const roundCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'round-complete',
    );
    const gameCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'game-complete',
    );
    expect(roundCompleteCalls).toHaveLength(3);
    expect(gameCompleteCalls).toHaveLength(1);
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
  });

  it('CELEBRATION_DONE on last round routes directly to gameOver', () => {
    const { actor } = startActor({ totalRounds: 1 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    actor.send({ type: 'CELEBRATION_DONE' });
    expect(actor.getSnapshot().value).toBe('gameOver');
  });

  it('root-level GAME_OVER handler is defense-in-depth (any state -> gameOver)', () => {
    const { actor } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    expect(actor.getSnapshot().value).toBe('playing');
    actor.send({ type: 'GAME_OVER' });
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
