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
  isLevelMode?: boolean;
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
  const maxLevels = options.maxLevels ?? null;
  const guards = buildEngineGuards(totalRounds, levelSize, {
    isLevelMode: options.isLevelMode ?? maxLevels !== null,
    maxLevels,
  });
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
    // Plan deviation: engine roundIndex accumulates across level
    // boundaries (incrementRoundIndex fires on ADVANCE_LEVEL) so the
    // isLastRound guard (`roundIndex + 1 >= totalRounds`) fires
    // correctly on the last round of the last level. The reducer
    // resets roundIndex to 0 on ADVANCE_LEVEL; the engine intentionally
    // diverges. After 2 rounds + 1 level advance, roundIndex is 2
    // (1 from the second ADVANCE_ROUND-like increment baked into
    // ADVANCE_LEVEL on top of roundIndex=1 from the previous
    // ADVANCE_ROUND in this test).
    expect(context().roundIndex).toBe(2);
    expect(context().retryCount).toBe(0);
  });

  it('endless level mode (simple-config shape) reaches levelComplete, not gameOver, after the only round', () => {
    // Regression for PR #357 manual smoke (handoff 2026-05-12):
    // `resolveSimpleConfig` ships `totalRounds: 1`, `levelMode` defined,
    // and no `maxLevels`. Pre-fix the engine guard `isLastRound` fired
    // (1+1>=1) and the actor went to `gameOver`, so the user saw the
    // `Game complete` overlay instead of `Level 1 Complete`. After the
    // fix, `isLastRound` is suppressed in endless level mode and
    // `isLastRoundOfLevel` fires at every levelSize boundary, so the
    // actor reaches `levelComplete` and the user can advance.
    vi.useFakeTimers();
    const { actor } = startActor({
      totalRounds: 1,
      isLevelMode: true,
      maxLevels: null,
      levelSize: 1,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
  });

  it('endless level mode continues advancing levels across multiple ADVANCE_LEVEL events', () => {
    vi.useFakeTimers();
    const { actor, context } = startActor({
      totalRounds: 1,
      isLevelMode: true,
      maxLevels: null,
      levelSize: 1,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));

    const playOnlyRound = () => {
      actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
      actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    };

    // Level 1
    playOnlyRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: round.tiles,
      zones: round.zones,
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().levelIndex).toBe(1);

    // Level 2 — same shape; the engine must reach levelComplete again
    // rather than gameOver. This is the loop the simple-config user
    // expects.
    playOnlyRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
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

describe('SortNumbers machine — happy path', () => {
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

  it('RESUME_ROUND restores draft fields and keeps machine in playing (review #11)', () => {
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

  it('after 750ms in roundComplete on last round (no levels), advances to gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
      totalRounds: 1,
      maxLevels: null,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');
    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
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

describe('SortNumbers machine — edge cases', () => {
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

  it('EJECT_TILE on a wrong-locked slot clears it and returns tile to bank', () => {
    const { actor, zones, context } = startActor();
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
    actor.send({ type: 'EJECT_TILE', zoneIndex: 0 });
    expect(zones()[0]?.placedTileId).toBeNull();
    expect(context().bankTileIds).toContain('t2');
  });
});

describe('SortNumbers machine — error / no-op paths', () => {
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

  it('ADVANCE_LEVEL while in playing is ignored', () => {
    const { actor, context } = startActor({
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    const before = context();
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('playing');
    expect(context().levelIndex).toBe(before.levelIndex);
  });

  it('ADVANCE_LEVEL while in roundComplete (celebration window) is ignored', () => {
    // Race: user clicks "Next level" during the 750ms after-timer
    // before the machine has reached levelComplete. The reducer mirror
    // dispatches ADVANCE_LEVEL via engineDispatch; the engine must
    // ignore it because the handler is scoped to levelComplete.
    const { actor, context } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    // Complete round 1.
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    const before = context();
    // Try to advance level while still in roundComplete.
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: [tile('tX', 'X')],
      zones: [slot(0, 'X')],
    });
    expect(actor.getSnapshot().value).toBe('roundComplete');
    expect(context().levelIndex).toBe(before.levelIndex);
  });
});

describe('SortNumbers machine — integration', () => {
  it('completes a full two-level (4-round) game ending in gameOver', () => {
    vi.useFakeTimers();
    const { actor, mocks } = startActor({
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

    // Level 1, round 1 (mid-level).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 1, round 2 (last of level 1).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');
    actor.send({
      type: 'ADVANCE_LEVEL',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 2, round 3 (mid-level).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('waitingForNext');
    actor.send({
      type: 'ADVANCE_ROUND',
      tiles: round.tiles,
      zones: round.zones,
    });

    // Level 2, round 4 (last round overall).
    playRound();
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('gameOver');

    expect(mocks.completeGame).toHaveBeenCalledTimes(1);
    const roundCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'round-complete',
    );
    const levelCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'level-complete',
    );
    const gameCompleteCalls = mocks.playSound.mock.calls.filter(
      (call) => call[1]?.sound === 'game-complete',
    );
    expect(roundCompleteCalls).toHaveLength(4);
    expect(levelCompleteCalls).toHaveLength(1);
    expect(gameCompleteCalls).toHaveLength(1);
  });

  it('root-level GAME_OVER handler is defense-in-depth', () => {
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

  it('RESUME_ROUND prefers engineRoundIndex over draft.roundIndex (review #3)', () => {
    const { actor, context } = startActor({
      totalRounds: 4,
      maxLevels: 2,
      levelSize: 2,
    });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'RESUME_ROUND',
      draft: {
        allTiles: round.tiles,
        bankTileIds: round.tiles.map((t) => t.id),
        zones: round.zones,
        activeSlotIndex: 0,
        phase: 'playing' as const,
        // Reducer's per-level counter — 0 because we just started level 1.
        roundIndex: 0,
        retryCount: 0,
        levelIndex: 1,
        // Engine's accumulated counter — 2 because we've completed two
        // rounds (the second was the last round of level 1).
        engineRoundIndex: 2,
      },
    });
    expect(context().roundIndex).toBe(2);
    expect(context().levelIndex).toBe(1);
  });

  it('RESUME_ROUND falls back to draft.roundIndex when engineRoundIndex is undefined (review #3)', () => {
    const { actor, context } = startActor({ totalRounds: 3 });
    const round = buildRound();
    actor.send(initEvent(round.tiles, round.zones));
    actor.send({
      type: 'RESUME_ROUND',
      draft: {
        allTiles: round.tiles,
        bankTileIds: round.tiles.map((t) => t.id),
        zones: round.zones,
        activeSlotIndex: 0,
        phase: 'playing' as const,
        roundIndex: 1,
        retryCount: 0,
        levelIndex: 0,
      },
    });
    expect(context().roundIndex).toBe(1);
  });

  it('RESUME_ROUND from levelComplete is ignored — celebration window is sealed (review #2)', () => {
    vi.useFakeTimers();
    const { actor, context } = startActor({
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
    actor.send({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
    actor.send({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 1 });
    actor.send({ type: 'PLACE_TILE', tileId: 't3', zoneIndex: 2 });
    vi.advanceTimersByTime(751);
    expect(actor.getSnapshot().value).toBe('levelComplete');

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
    expect(actor.getSnapshot().value).toBe('levelComplete');
    expect(context().roundIndex).toBe(before.roundIndex);
    expect(context().levelIndex).toBe(before.levelIndex);
  });
});
