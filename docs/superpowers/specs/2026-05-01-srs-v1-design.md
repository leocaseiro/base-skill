# Spaced-Repetition Scheduling (SRS) v1 — Design

**Date:** 2026-05-01
**Games in scope (v1):** WordSpell only
**Game-agnostic foundation:** Yes — adapter pattern designed for SortNumbers,
NumberMatch, SpotAll, Sort-by-Group ([#250](https://github.com/leocaseiro/base-skill/issues/250)),
Connect-Answers ([#228](https://github.com/leocaseiro/base-skill/issues/228))

**Related issues:**

- [#257](https://github.com/leocaseiro/base-skill/issues/257) — `useGameRound`
  hook (SRS integration point; critical-path dependency)
- [#260](https://github.com/leocaseiro/base-skill/issues/260) — WordSpell
  adopts `useGameRound` (bundled with SRS v1 per the **Z** ordering decision)
- [#295](https://github.com/leocaseiro/base-skill/issues/295) — Onboarding:
  placement assessment (cold-start input source for SRS)
- [#296](https://github.com/leocaseiro/base-skill/issues/296) — HUD + scoring:
  accuracy target (natural follow-up surface for SRS error data)

## Problem

BaseSkill today picks rounds via per-game generators that are blind to the
player's history. A child who has nailed `"cat"` ten times sees it as often as
a child who has missed `"twirl"` five times in a row. There is no concept of
**when** a word should reappear, **which** mistakes are systematic, or **how
fluent** the child has become with each item.

Concretely, today the engine records:

- Session-level aggregates (`finalScore`, `duration`, `status`, `seed`) in
  `session_history_index`.
- Raw move events (`{action, payload, result: null}`) in `session_history`.
- A flat list of seen words per `(profile, signature)` in
  `word_spell_seen_words`.

What it does **not** record:

- Per-round correctness as an explicit flag (`result` is always `null`).
- Per-round response time (only session-wide duration is persisted).
- Which distractor was picked when a placement was wrong.
- Hint usage timing, undo events, TTS replays.
- Any per-item identity → per-item history mapping.

Without this data the app cannot decide which word to bring back, when, or
why. The goal of SRS v1 is to add that capability — modelled on Anki's SM-2
algorithm, adapted for kids — and to capture the rich per-attempt signal that
makes future skill-level diagnostics (the v2 layer) possible without schema
churn.

## Goals

- Per-item scheduling that brings struggled-with words back sooner and
  mastered words back later, using a kid-tuned SM-2 variant.
- Rich per-attempt event log that records every signal the algorithm and any
  future analytics could need (timing split, mistakes, distractor sources,
  TTS plays, hints, undos).
- Game-agnostic foundation under `src/lib/srs/` so SortNumbers, NumberMatch,
  SpotAll, and future games plug in via adapters.
- Schemas shaped from day one to absorb the v2 skill-pattern layer (grapheme
  / phoneme tagging, mistake-confusion aggregation) without migration.
- 100% client-side. No backend dependency. Storage in IndexedDB via RxDB.
- Predictable session length (no surprise stretching past `totalRounds`).
- Honest defaults that do not punish struggling readers or kids who skip
  days.
- Recording infrastructure that can be enabled independently of scheduling,
  so we can capture data before flipping the algorithm on.

## Non-goals

- **Skill-level / mistake-pattern aggregation** (the "always picks `u` for
  `oo`" behaviour). v1 records the data; v2 implements the aggregation and
  round-selector boost.
- **Adaptive difficulty for SpotAll, SortNumbers, NumberMatch** in v1. They
  inherit the foundation; their adapters land later.
- **Profile reset / SRS reset.** Deferred. No v1 work.
- **Cloud sync of SRS state.** Local-only in v1. A follow-up will decide
  whether to sync `srs_attempts` or just `srs_items`.
- **Echo reading** (auto-TTS the correct answer after a lapse). Filed as v2
  follow-up.
- **HUD accuracy target / star rating overhaul.** Tracked in
  [#296](https://github.com/leocaseiro/base-skill/issues/296).
- **Placement assessment.** Tracked in
  [#295](https://github.com/leocaseiro/base-skill/issues/295). v1 cold-starts
  with all-new items until placement ships.
- **FSRS algorithm.** SM-2 is intentionally simpler; FSRS can supersede later
  with no schema change because every input signal is recorded.

## Architecture

Three game-agnostic layers under `src/lib/srs/`, plus one adapter per game.
WordSpell is the only adapter for v1.

```text
src/lib/srs/                              (game-agnostic, pure)
├── types.ts                              Item, Attempt, ItemState, MistakeEvent, …
├── sm2.ts                                applyGrade(state, grade, now) — pure
├── sm2-config.ts                         All SM-2 constants, JSDoc'd
├── grade-derivation.ts                   deriveGrade(attempt, expected) — pure
├── round-selector.ts                     composeSession + handleRoundResolved
├── round-selector-config.ts              All round-selector constants
├── recorder.ts                           Subscribes to game lifecycle → writes
├── content-registry.ts                   ContentSource registry
└── adapters/
    ├── types.ts                          SrsAdapter interface
    └── word-spell.ts                     WordSpell adapter (v1)
        word-spell-typing.ts              Typed-input mistake helpers

src/db/schemas/                           (RxDB collections, all per-profile)
├── srs_items.ts                          Per-(profile, gameId, itemId) state
└── srs_attempts.ts                       Append-only attempt log
```

V2's skill-pattern aggregation will introduce two additional
collections (`srs_skill_state`, `srs_mistake_patterns`) but **they are
not declared in v1**. RxDB handles adding new collections cleanly; the
"shaped from day one" promise is satisfied by recording the input
fields v2 will aggregate (`confusionTags`, `skillTags`,
`distractorSource`) on `srs_attempts` from day one — not by declaring
empty collections that carry migration / test surface cost without
holding any data.

### The adapter contract

The seam that makes the foundation game-agnostic. Every game integrates by
implementing this interface:

```ts
interface SrsAdapter<TRound, TMove> {
  gameId: string;

  // -- selection side --
  candidateItems(
    profile: ProfileContext,
    gameConfig: TGameConfig,
  ): string[];
  instantiateRound(
    itemId: string,
    profile: ProfileContext,
    rng: Rng,
  ): TRound;

  // -- recording side --
  itemIdFor(round: TRound): string;
  skillsFor(round: TRound): SkillTag[];
  classifyMove(move: TMove, round: TRound): MoveClassification;
  buildAttempt(
    events: TMove[],
    round: TRound,
    timing: Timings,
  ): SrsAttempt;

  // -- grade-derivation expectations (profile-relative thresholds) --
  expectedExecution(
    round: TRound,
    ctx: { profileStats: ProfileStats },
  ): ExecutionExpectation;
  expectedDecision(
    round: TRound,
    ctx: { profileStats: ProfileStats },
  ): DecisionExpectation;
}
```

**Contract maturity.** The adapter interface is provisional in v1: it
is validated against WordSpell only. The next game to integrate
("game #2", which could be NumberMatch, SortNumbers, or SpotAll) is
expected to surface contract gaps — particularly SortNumbers, whose
items are skill descriptors rather than concrete rounds, and SpotAll,
whose mistake mechanics involve multiple correct slots per round.
Minor adapter-contract changes are pre-authorised when game #2 lands;
they should not require a new design-decision review.

**Paper-prototype gate during v1 implementation.** Before the WordSpell
adapter is considered "done", the implementation work must include a
**paper sketch** of one future adapter — most likely SortNumbers, since
its skill-descriptor item shape is the most divergent from WordSpell
and therefore the strongest stress-test for the contract. The paper
sketch is not shipped code: it walks every adapter method through a
representative SortNumbers round, identifies any contract changes
needed, and either (a) lands those changes in v1 alongside the
WordSpell adapter so the contract is proven against two games, or
(b) explicitly defers them with a note in this spec describing what
breaks. This is the v1 quality gate that prevents the "abstraction
proven against one game" risk.

### Why these specific layers

- **`sm2.ts`** is a pure function. No IO, no React, no DB. Trivially
  unit-testable. Easy to swap for FSRS later if data justifies.
- **`grade-derivation.ts`** is a rules engine, also pure. Translates the
  rich attempt signals into the discrete 0–5 grade SM-2 expects.
- **`round-selector.ts`** is the only layer that knows about session shape.
  Both pre-session composition and in-session re-insertion live here.
- **`recorder.ts`** is the only layer that touches the existing game-engine
  event stream. Subscribes; never mutates game state.
- **`content-registry.ts`** is the abstraction for "any game can consume any
  content library" — words, numbers, and future libraries register
  themselves; adapters resolve content sources by id.

### Game integration via `useGameRound` (post-#257)

SRS plumbs into `useGameRound` (the unified hook from
[#257](https://github.com/leocaseiro/base-skill/issues/257)) at two points:

1. **Round provider injection** — `useGameRound` accepts an optional
   `roundProvider` whose `composeInitial`, `handleResolved`, and
   `instantiateRound` come from the SRS round selector.
2. **Side-effect subscription** — a `useSrsRecording(adapter)` hook
   subscribes to the lifecycle event stream (round-shown, first-action,
   mistake, tts-played, visibility-change, round-resolved) and writes
   `srs_attempts` + updates `srs_items`. `useGameRound` itself is not
   modified.

If `useSrsRecording` is unmounted (e.g. SRS feature flag off), gameplay is
unaffected.

## Data model

Two new RxDB collections, all keyed per-profile.

### `srs_items` — per-item SM-2 state

Lazy creation: a row exists once the player encounters the item for the first
time. Cold-start enumerates `candidateItems` and creates rows as needed.

```ts
type ItemSrsState = {
  // identity
  id: string; // composite: `${profileId}:${itemId}`
  profileId: string;
  gameId: string;
  contentSource: string;
  itemId: string;

  // SM-2 core state
  repetitions: number; // consecutive successful reviews
  easeFactor: number; // SM-2 EF; starts at STARTING_EASE
  intervalMs: number; // current interval (ms)
  dueAt: number; // ms epoch — when next due

  // lifecycle
  createdAt: number;
  firstSeenAt: number | null;
  lastAttemptAt: number | null;
  lastCorrectAt: number | null;
  lastLapseAt: number | null; // set in applyGrade lapse branch; powers weakPool

  // denormalized aggregates (fast queries without scanning attempts)
  attemptCount: number;
  correctCount: number;
  lapseCount: number;
  consecutiveCorrect: number;

  // denormalized for round-selector convenience
  skillTags: string[];

  schemaVersion: 1;
};
```

### `srs_attempts` — append-only event log

One document per round played. Never mutated, never deleted (except via
profile reset, when one ships). Indexed on
`(profileId, gameId, itemId, startedAt)`,
`(profileId, sessionId, roundIndex)`, and `(profileId, startedAt)`.

```ts
type SrsAttempt = {
  // identity
  id: string; // UUID
  profileId: string;
  sessionId: string; // links to session_history_index
  gameId: string;
  contentSource: string;
  itemId: string;
  roundIndex: number;
  startedAt: number;
  schemaVersion: 1;

  // skill tagging (recorded v1, read v2)
  skillTags: string[];

  // timing
  firstActionAt: number | null;
  submittedAt: number;
  decisionMs: number;
  executionMs: number;
  visibilityHiddenMs: number;
  effectiveDecisionMs: number;
  effectiveExecutionMs: number;

  // outcome
  outcome: 'correct' | 'incorrect' | 'gave-up' | 'timed-out';
  firstTryCorrect: boolean;
  mistakeCount: number;
  mistakePattern:
    | 'none'
    | 'single'
    | 'multiple-varied'
    | 'multiple-same'
    | 'multiple-rotating';
  hintCount: number;
  undoCount: number;

  // mistake details (v1 records, v2 aggregates)
  mistakes: SrsMistakeEvent[];

  // TTS replays — every invocation timestamped, played text NOT recorded
  // (derivable from itemId for analysis if needed)
  ttsPlays: {
    count: number;
    firstPlayAt: number | null;
    playTimestamps: number[];
  };

  // derived grade
  derivedGrade: 0 | 1 | 2 | 3 | 4 | 5;
  gradeReason: string;

  // SRS state snapshots — kept for explainability and re-derivation;
  // archive/cloud-sync follow-up will decide retention strategy
  srsStateBefore: ItemSrsState;
  srsStateAfter: ItemSrsState;

  // typed context for re-derivation — per-adapter shape, declared by the
  // adapter that produced the attempt. Re-derivation reads `adapterVersion`
  // to pick the rules-of-its-era when the GradeContext shape evolves.
  gradeContext: AdapterGradeContext; // discriminated by adapterVersion + gameId
  adapterVersion: number; // bump when the adapter's GradeContext shape changes
  ttsUsed: boolean;
};

// Each adapter declares its own GradeContext containing exactly the
// fields its `expectedExecution`, `expectedDecision`, and `classifyMove`
// implementations read from `round`. Recorder snapshots this on attempt
// write, so re-derivation does not depend on the live round shape.
type WordSpellGradeContext = {
  inputMethod: 'drag' | 'type' | 'both';
  distractorCount: number;
  tileCount: number;
  mode: 'picture' | 'recall' | 'sentence-gap';
};

type AdapterGradeContext = WordSpellGradeContext;
/* | NumberMatchGradeContext | SortNumbersGradeContext | ... */

type SrsMistakeEvent = {
  ts: number;
  attemptIndex: number; // 1, 2, 3 within the round
  expectedTile: string | null; // null for tap-select
  actualTile: string;
  slotId: string | null;

  // multiple confusion dimensions per mistake — adapter populates
  confusionTags: string[]; // e.g. ['confusable-shape:b-d',
  //       'mirror-confusable',
  //       'font:atkinson']
  distractorSource: string | null; // 'confusable-pairs', 'phonemic-confusable'
};
```

### V2 collections (NOT declared in v1)

V2 will introduce two additional collections to support skill-level
aggregation, tracked in
[#297](https://github.com/leocaseiro/base-skill/issues/297). They are
**not declared in v1** — input fields on `srs_attempts`
(`confusionTags`, `skillTags`, `distractorSource`) carry the data; the
collections are created when v2 ships. RxDB handles adding new
collections without disrupting existing data.

For reference, the planned shapes are:

```ts
type SrsSkillState = {
  profileId: string;
  skillId: string; // 'grapheme:oo', 'category:vowel', …
  attempts: number;
  correctCount: number;
  mastery: number; // 0..1
  lastSeenAt: number;
  schemaVersion: 1;
};

type SrsMistakePattern = {
  profileId: string;
  expected: string; // 'oo'
  confusedWith: string; // 'u'
  count: number;
  lastSeenAt: number;
  context: string; // 'word-spell:words' or similar
  schemaVersion: 1;
};
```

### Per-doc `schemaVersion` rationale

RxDB has collection-level schema migration. The per-doc `schemaVersion` is
additional and serves a different purpose:

- Lets us add **optional** fields without triggering full collection
  migration: new docs get `schemaVersion: 2`, old docs stay at `1`, read
  code branches on the field.
- Provides forensics: "when did we start recording `confusionTags`? — filter
  by `schemaVersion >= 2`".
- Future-proofs cloud sync, where docs may travel between devices on
  different app versions.

Cost: a few bytes per doc. Worth it given prior incidents the team has had
with un-versioned schema changes.

### Storage estimate

- `srs_items`: ~250 bytes per item × ~500 items per profile = ~125 KB.
- `srs_attempts`: each document embeds two `ItemSrsState` snapshots
  (~250 B each) plus `mistakes[]`, `confusionTags[]`,
  `ttsPlays.playTimestamps[]`, `gradeContext`, `skillTags[]`, and
  `gradeReason`. Realistic per-attempt size is **~1.5 KB**, not the
  600 B I initially estimated. At 30 rounds/day × 365 days that's
  **~16 MB / active player / year** — and a five-sibling shared family
  tablet can reach **~80 MB / year**, close to Safari's 50 MB
  storage-warning threshold.

### Retention guard (v1)

To keep the multi-sibling case from hitting browser quotas, the
recorder runs a small pruning job at session start:

- Keep `srs_attempts` for the last **90 days OR last 5,000 attempts
  per profile** — whichever covers more data.
- Older attempts are discarded; their per-item aggregate signal is
  already preserved in `srs_items` (`attemptCount`, `correctCount`,
  `lapseCount`, `consecutiveCorrect`, `lastCorrectAt`, `lastLapseAt`,
  `firstSeenAt`).
- The `srsStateBefore`/`After` snapshots are explicitly transient under
  this policy; long-term explainability requires the cloud-sync path
  below.

This keeps per-profile `srs_attempts` storage bounded at roughly
4–8 MB regardless of how long the kid has been playing.

### Long-term: history off-device

Even with the retention guard, durable per-attempt history (for
parent reports across years, multi-device sync, longitudinal research,
or migrating to a different SRS algorithm later) cannot live in
IndexedDB indefinitely. **A future phase will sync `srs_attempts`
to a cloud store** (the same one targeted by the eventual profile-sync
work). When that lands, the local retention guard becomes a sliding
working-set cache and the cloud holds the full history. Until then,
v1 is local-only and accepts the 90-day / 5,000-attempt window as
the operating envelope.

## Algorithm — SM-2 adapted for kids

### Constants (all in `src/lib/srs/sm2-config.ts`, JSDoc'd)

```ts
export const SM2_CONFIG = {
  STARTING_EASE: 2.5, // Anki standard
  MIN_EASE: 1.3, // Anki standard

  INTERVAL_AFTER_REP_1_MS: 10 * 60 * 1000, // 10 min
  INTERVAL_AFTER_REP_2_MS: 24 * 60 * 60 * 1000, // 1 day
  INTERVAL_AFTER_REP_3_MS: 3 * 24 * 60 * 60 * 1000, // 3 days
  // From rep 4 onward: standard SM-2 (interval × easeFactor)

  LAPSE_INTERVAL_MS: 30 * 60 * 1000, // 30 min cross-session — long enough that back-to-back sessions don't immediately re-surface a just-lapsed item; in-session re-insertion handles immediate practice.
  LAPSE_EASE_DROP: 0.2,
  LAPSE_FORGIVENESS_WINDOW_MS: 14 * 24 * 60 * 60 * 1000, // 14 days
};
```

### Why softened intervals

Standard Anki SM-2 uses 1d / 6d for first/second successful reviews — tuned
for adult vocabulary learners doing ~20 minutes a day. BaseSkill kids do
shorter, more frequent sessions. 10 min / 1d / 3d ramps faster, surfacing
new items multiple times per session, and falls back to standard SM-2 math
from rep 4 onward (so long-term spacing still benefits from ease expansion).

### Lapse forgiveness

Anki uses pure wall-clock for ease penalties. For kids who may skip days or
weeks, that is unfair: missing a word after a 2-week gap is **expected
forgetting**, not a real lapse. Rule:

- **First lapse ever** on an item → no ease drop (graceful first-attempt).
- **Subsequent lapses on never-correct items** → ease drops by
  `LAPSE_EASE_DROP` each (the kid is genuinely struggling; SM-2 should
  schedule shorter intervals). Expected-forgetting does NOT apply when
  there has been no prior correctness to forget.
- **Subsequent lapses on previously-correct items, within
  `LAPSE_FORGIVENESS_WINDOW_MS` of last correct** → ease drops by
  `LAPSE_EASE_DROP` (real lapse).
- **Subsequent lapses on previously-correct items, outside the window**
  → no ease drop (expected forgetting).

`dueAt` math stays calendar-based so the queue still builds naturally
during gaps; only the ease penalty considers recency.

### The pure function

```ts
type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export const applyGrade = (
  state: ItemSrsState,
  grade: Grade,
  now: number,
): ItemSrsState => {
  const base = {
    ...state,
    attemptCount: state.attemptCount + 1,
    lastAttemptAt: now,
    firstSeenAt: state.firstSeenAt ?? now,
  };

  if (grade < 3) {
    const isFirstLapse = state.lapseCount === 0;
    // Expected-forgetting only applies when the item HAS been correct at
    // least once. Never-correct items have no mastery to forget — they
    // should accrue ease drops on subsequent lapses so SM-2 schedules
    // shorter intervals.
    const isExpectedForgetting =
      state.lastCorrectAt !== null &&
      now - state.lastCorrectAt >
        SM2_CONFIG.LAPSE_FORGIVENESS_WINDOW_MS;
    const easeDrop =
      isFirstLapse || isExpectedForgetting
        ? 0
        : SM2_CONFIG.LAPSE_EASE_DROP;

    return {
      ...base,
      repetitions: 0,
      intervalMs: SM2_CONFIG.LAPSE_INTERVAL_MS,
      dueAt: now + SM2_CONFIG.LAPSE_INTERVAL_MS,
      easeFactor: Math.max(
        SM2_CONFIG.MIN_EASE,
        state.easeFactor - easeDrop,
      ),
      lapseCount: state.lapseCount + 1,
      lastLapseAt: now,
      consecutiveCorrect: 0,
    };
  }

  const newReps = state.repetitions + 1;
  const newInterval =
    newReps === 1
      ? SM2_CONFIG.INTERVAL_AFTER_REP_1_MS
      : newReps === 2
        ? SM2_CONFIG.INTERVAL_AFTER_REP_2_MS
        : newReps === 3
          ? SM2_CONFIG.INTERVAL_AFTER_REP_3_MS
          : Math.round(state.intervalMs * state.easeFactor);

  const newEase = Math.max(
    SM2_CONFIG.MIN_EASE,
    state.easeFactor +
      (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)),
  );

  return {
    ...base,
    repetitions: newReps,
    intervalMs: newInterval,
    dueAt: now + newInterval,
    easeFactor: newEase,
    correctCount: state.correctCount + 1,
    consecutiveCorrect: state.consecutiveCorrect + 1,
    lastCorrectAt: now,
  };
};
```

## Grade derivation

A precedence-ordered rules engine, also pure. Translates `srs_attempts`
signals into a 0–5 grade.

```ts
export const deriveGrade = (
  attempt: SrsAttempt,
  expectedExecution: ExecutionExpectation,
  expectedDecision: DecisionExpectation,
): { grade: Grade; reason: string } => {
  // -- HARD FAILURES --
  if (attempt.outcome === 'gave-up')
    return { grade: 0, reason: 'gave-up' };
  if (attempt.outcome === 'timed-out')
    return { grade: 0, reason: 'timed-out' };
  if (attempt.outcome === 'incorrect')
    return { grade: 1, reason: 'wrong-answer' };

  // -- MISTAKE-PATTERN BRANCHES --
  if (attempt.mistakePattern === 'multiple-same') {
    return {
      grade: 1,
      reason: `same-mistake-x${attempt.mistakeCount}`,
    };
  }
  if (
    attempt.mistakePattern === 'multiple-varied' ||
    attempt.mistakePattern === 'multiple-rotating'
  ) {
    return {
      grade: 2,
      reason: `correct-after-${attempt.mistakeCount}-mistakes`,
    };
  }
  if (attempt.mistakeCount === 1) {
    return { grade: 3, reason: 'correct-after-1-mistake' };
  }

  // -- FIRST-TRY CORRECT, but used aids → cap at 4 --
  if (attempt.hintCount > 0) {
    return {
      grade: 4,
      reason: `first-try-with-${attempt.hintCount}-hints`,
    };
  }
  if (attempt.ttsPlays.count >= 3) {
    return {
      grade: 4,
      reason: `first-try-with-${attempt.ttsPlays.count}-tts-plays`,
    };
  }
  if (attempt.undoCount > 0) {
    return {
      grade: 4,
      reason: `first-try-with-${attempt.undoCount}-undos`,
    };
  }

  // -- FIRST-TRY CORRECT, no aids — speed differentiates 3 / 4 / 5 --
  const decisionSpeed = classifyDecisionSpeed(
    attempt.effectiveDecisionMs,
    expectedDecision,
  );
  const executionSpeed = classifyExecutionSpeed(
    attempt.effectiveExecutionMs,
    expectedExecution,
  );

  if (decisionSpeed === 'fast' && executionSpeed === 'fast') {
    return {
      grade: 5,
      reason: 'first-try, automatic (fast decision + fast execution)',
    };
  }
  if (executionSpeed === 'slow') {
    return {
      grade: 3,
      reason: `first-try, slow execution (uncertain) — decision: ${decisionSpeed}`,
    };
  }
  return {
    grade: 4,
    reason: `first-try, deliberated (decision: ${decisionSpeed}, execution: ${executionSpeed})`,
  };
};
```

### Why this shape

- **No magic blends.** Every rule is a clear branch with a `reason` string.
  When something feels wrong in production, you read the reason and adjust
  _that branch_, not retune a weighted formula.
- **Decision-time matters.** A child who takes 30 s to think and then taps
  fast has _solved_ the puzzle, not _internalised_ it. Grade-5
  ("automaticity") requires both fast decision AND fast execution. This
  matches established reading-fluency research (decoded vs automatic).
- **`multiple-same` is grade 1, not 2.** The same wrong tile picked multiple
  times indicates a strong misconception ("kid believes `cat` starts with
  `a`"), pedagogically different from scattered exploratory mistakes.
- **Decision-time deliberately excluded from the grade-3 branch.** Slow
  execution dominates because motor hesitation while _executing_ is the
  reliable uncertainty signal; slow decision can mean either deep thinking
  (good) or distraction (no signal).
- **Re-derivation safe.** All input signals are stored in `srs_attempts`;
  if rules change, a `recomputeGradesFromAttempts(profileId)` utility
  re-runs the derivation and updates `srs_items` without replay.

### Adapter-supplied expectations

```ts
type ExecutionExpectation = {
  fastThresholdMs: number;
  mediumThresholdMs: number;
};

type DecisionExpectation = {
  fastThresholdMs: number;
  mediumThresholdMs: number;
};

// Adapter receives a profileStats context derived from the active
// profile's recent srs_attempts (e.g. running median of the last 30
// attempts' effectiveDecisionMs / effectiveExecutionMs).
type ProfileStats = {
  medianDecisionMs: number | null; // null when fewer than 10 attempts exist
  medianExecutionMs: number | null;
};
```

Thresholds are **per-profile-relative** to avoid penalising slower
decoders (e.g. struggling readers) against a typical-reader benchmark.
A "fast decision" is fast _for this kid_, not fast in absolute terms.
Cold-start (fewer than 10 recorded attempts for the profile) falls back
to absolute thresholds derived from the round shape.

WordSpell example branches on `inputMethod`, `distractorCount`, and
the profile's recent stats:

```ts
expectedExecution(round, ctx: { profileStats: ProfileStats }) {
  const tileCount = round.expectedTiles.length;
  const isTyping = round.config.inputMethod === 'type';

  // Profile-relative path: this kid is fast/medium/slow relative to
  // their own running median.
  if (ctx.profileStats.medianExecutionMs !== null) {
    const mid = ctx.profileStats.medianExecutionMs;
    return { fastThresholdMs: mid * 0.7, mediumThresholdMs: mid * 1.5 };
  }

  // Cold-start: absolute thresholds derived from round shape.
  const baseMsPerUnit = isTyping ? 1500 : 600;
  const distractorPenalty =
    (round.config.distractorCount ?? 0) * (isTyping ? 0 : 200);
  const fast = tileCount * baseMsPerUnit + distractorPenalty;
  return { fastThresholdMs: fast, mediumThresholdMs: fast * 2 };
}

expectedDecision(round, ctx: { profileStats: ProfileStats }) {
  const isTyping = round.config.inputMethod === 'type';

  if (ctx.profileStats.medianDecisionMs !== null) {
    const mid = ctx.profileStats.medianDecisionMs;
    return { fastThresholdMs: mid * 0.7, mediumThresholdMs: mid * 1.5 };
  }

  return {
    fastThresholdMs: isTyping ? 3000 : 2000,
    mediumThresholdMs: isTyping ? 9000 : 6000,
  };
}
```

The `profileStats` object is computed once per round in the recorder
(IndexedDB query for the last 30 attempts of this profile) and passed
into the adapter — adapters do not query the DB themselves.

## Round selector — session composition + in-session re-insertion

### Pre-session pass — `composeSession`

```text
1. duePool   = items where dueAt <= now, sorted most-overdue first
                (tie-breaks: oldest firstSeenAt, then itemId for full determinism)
2. newPool   = adapter.candidateItems() filtered to never-seen, capped at newPoolMax
3. weakPool  = items where dueAt > now AND lastLapseAt != null AND (now - lastLapseAt) <= weakRecencyMs, sorted most-lapsed first

4. reviews   = first min(duePool.length, reviewCap) items from duePool
5. news      = first min(newPool.length, newBudget) items from newPool
6. remaining = totalRounds - reviews.length - news.length

7. fill = first `remaining` items from: weakPool, then newPool overflow, then duePool overflow

8. interleave([reviews, news, fill]) — pools are disjoint by construction
   and each item appears at most once, so no explicit spacing constraint
   is needed in v1.
```

### Constants (`src/lib/srs/round-selector-config.ts`)

```ts
export const ROUND_SELECTOR_CONFIG = {
  reviewCap: 7,
  newBudget: 3,
  newPoolMax: 50,
  weakRecencyMs: 7 * 24 * 60 * 60 * 1000,
  addNewItemsDuringBacklog: true, // kid-app stance: variety > backlog discipline
  lapseReinsertOffset: 2,
  lapseReinsertMaxPerItem: 3,
};
```

### Worked scenarios (totalRounds=10)

| Scenario                | duePool | newPool | weakPool | Resulting session                          |
| ----------------------- | ------- | ------- | -------- | ------------------------------------------ |
| Day 1, brand-new player | 0       | 200     | 0        | 0 review + 3 new + 7 new-overflow = 10 new |
| Day 7, regular player   | 4       | 180     | 6        | 4 review + 3 new + 3 weak                  |
| Day 14, skipped a week  | 25      | 150     | 8        | 7 review (cap) + 3 new                     |
| Mature, all caught up   | 2       | 30      | 5        | 2 review + 3 new + 5 weak                  |

### In-session pass — `handleRoundResolved`

After each round resolves, the selector adjusts the _remaining_ queue.

**Total rounds stays fixed at `totalRounds`.** The session loop pops the
played item off the front before invoking `handleRoundResolved`, so
`remainingQueue` does NOT contain the just-resolved item. On a lapse,
the item is re-inserted at `lapseReinsertOffset`, then the queue is
trimmed back to its pre-call length — re-insertion displaces an item
from the **end** of the queue (preserving the front, which holds items
most needing exposure). When there is no slack to displace (queue
shorter than the offset), the trim drops the just-inserted item itself
and SM-2's cross-session schedule (`LAPSE_INTERVAL_MS = 30 min`) picks
it up in the next session. A per-item cap (`lapseReinsertMaxPerItem`)
prevents pathological cycling on a single very-hard item.

```ts
export const handleRoundResolved = (
  remainingQueue: string[], // does NOT contain the just-played item
  resolvedItemId: string,
  outcome: 'correct' | 'incorrect' | 'gave-up' | 'timed-out',
  reinsertCounts: Map<string, number>, // accumulated across the session
  config: RoundSelectorConfig,
): string[] => {
  if (outcome === 'correct') return remainingQueue;

  // Cap per-item re-insertions across the session.
  const reinsertCount = reinsertCounts.get(resolvedItemId) ?? 0;
  if (reinsertCount >= config.lapseReinsertMaxPerItem)
    return remainingQueue;

  // Skip re-insertion if the item is already scheduled within the offset
  // window (e.g. composeSession placed it at positions 1 and 4, so the
  // next occurrence will arrive naturally before the offset).
  const alreadyComingSoon = remainingQueue.indexOf(resolvedItemId);
  if (
    alreadyComingSoon !== -1 &&
    alreadyComingSoon < config.lapseReinsertOffset
  ) {
    return remainingQueue;
  }

  const originalLength = remainingQueue.length;
  const insertAt = Math.min(config.lapseReinsertOffset, originalLength);
  const inserted = [
    ...remainingQueue.slice(0, insertAt),
    resolvedItemId,
    ...remainingQueue.slice(insertAt),
  ];
  const trimmed = inserted.slice(0, originalLength);

  // Only count the reinsertion if it actually persists after the trim
  // (i.e. it landed inside the kept slice).
  if (trimmed.includes(resolvedItemId)) {
    reinsertCounts.set(resolvedItemId, reinsertCount + 1);
  }
  return trimmed;
};
```

A child who lapses every item in a 5-round session
`[twirl, cat, dog, hat, sun]` (worst-case stress test):

| R   | `remainingQueue` going in | Played | Outcome | After `handleRoundResolved`                    |
| --- | ------------------------- | ------ | ------- | ---------------------------------------------- |
| 1   | `[cat, dog, hat, sun]`    | twirl  | ❌      | `[cat, dog, twirl, hat]` (sun dropped)         |
| 2   | `[dog, twirl, hat]`       | cat    | ❌      | `[dog, twirl, cat]` (hat dropped)              |
| 3   | `[twirl, cat]`            | dog    | ❌      | `[twirl, cat]` (dog reinsert canceled by trim) |
| 4   | `[cat]`                   | twirl  | ❌      | `[cat]` (twirl reinsert canceled by trim)      |
| 5   | `[]`                      | cat    | ❌      | `[]` (session ends)                            |

Session is exactly 5 rounds, every time. Reinsertions persist when
slack exists (R1, R2 above) and dissolve into SM-2's cross-session
schedule when it doesn't (R3, R4, R5). For a single struggling item,
`lapseReinsertMaxPerItem = 3` means up to four exposures of that item
within one session if slack holds.

A simpler worked example — kid only struggles with `twirl`:

| R   | `remainingQueue` going in | Played | Outcome | After `handleRoundResolved`              |
| --- | ------------------------- | ------ | ------- | ---------------------------------------- |
| 1   | `[cat, dog, hat, sun]`    | twirl  | ❌      | `[cat, dog, twirl, hat]` (sun dropped)   |
| 2   | `[dog, twirl, hat]`       | cat    | ✓       | `[dog, twirl, hat]`                      |
| 3   | `[twirl, hat]`            | dog    | ✓       | `[twirl, hat]`                           |
| 4   | `[hat]`                   | twirl  | ❌      | `[hat]` (no slack, twirl handed to SM-2) |
| 5   | `[]`                      | hat    | ✓       | `[]`                                     |

5 rounds. `twirl` got 2 attempts in-session; SM-2 schedules it for
30 min from now (next session, per `LAPSE_INTERVAL_MS`).

### HUD behaviour

Round count is bound to `roundQueue.length`. Re-insertion changes the
denominator honestly (`Round 4 of 10` → `Round 4 of 11` → trimmed back to
`Round 4 of 10`). v1 ships the honest version; visual polish (an animation
when the count changes) is a follow-up if needed.

## Adapter pattern — game integrations

### WordSpell adapter (v1)

Item identity: `${gameId}:${contentSource}:${word}:${mode}:${inputMethod}`.
Drag and type are tracked as **separate items** so that a typing-mode
lapse cannot regress drag-mode mastery and vice versa. The motor
demands diverge enough (typing is ~2.5× slower per unit and produces
typo-class errors that do not exist in drag) that mixing them
contaminates SM-2 state and v2 skill aggregation. Migration from
`word_spell_seen_words` defaults to `inputMethod = 'drag'` (the
dominant historical mode); the kid's first type-mode play of a word
lazily creates a sibling item.

Skill tags reuse existing `GRAPHEMES_BY_LEVEL` and `WordFilter` `(g, p)`
pair conventions to populate `skillsFor`. Future-proof for v2 skill layer
without touching the adapter.

Typed-input mistake helpers (`word-spell-typing.ts`) classify final
submissions into `confusionTags` that **carry their input-method
source** so v2 skill aggregation can filter by motor population:

- `'typo:adjacent-key:type'` — adjacent qwerty keys (typing-only).
- `'misspell:phonetic:type'` — phonetic substitution (`kat` for `cat`).
- `'misspell:k-as-c:type'` — letter-substitution pair from typing.
- `'confusable-shape:b-d:drag'` — drag-mode visual confusion (existing
  drag adapter behaviour; same `:drag` suffix convention).

`mistakeCount` for typed rounds counts wrong submissions, not wrong
keystrokes — keeping grading equitable across input methods.

### Future adapters (out of scope for v1, supported by the contract)

- **SortNumbers**: items are skill descriptors
  (`'sort:asc:len-3:range-1-20'`); `instantiateRound` generates a fresh
  shuffled sequence; `classifyMove` detects directional and digit-position
  pitfalls.
- **NumberMatch**: items are number-pair templates (`'5+3'`, `'7×2'`).
- **SpotAll**: items are confusable groups + difficulty
  (`'confusable:b-d:level-3'`); per-tap classification distinguishes target
  hits from confusable-pair false positives from random false positives.
- **Sort-by-Group ([#250](https://github.com/leocaseiro/base-skill/issues/250))**:
  items are grouping types + difficulty; misclassification data feeds the v2
  skill layer the same way confusable data does.
- **Connect-Answers ([#228](https://github.com/leocaseiro/base-skill/issues/228))**:
  items are matching themes; cross-content composition via ContentRegistry.

### ContentRegistry

```ts
interface ContentSource {
  id: string;                       // 'words' | 'numbers' | …
  enumerateItems(profile, params): string[];
  resolveItem(itemId): ContentItem;
}

const ContentRegistry = {
  register(source: ContentSource): void;
  resolve(id: string): ContentSource;
};
```

WordSpell registers `'words'`. Future games register their own. Cross-
content games (#228) consume multiple sources via the registry.

## Integration with existing code

### `useSrsRecording` — side-effect hook

Subscribes to the `useGameRound` lifecycle event stream. Does not modify
`useGameRound`. Writes `srs_attempts`, updates `srs_items`. Async,
fire-and-forget — recorder failures log and continue rather than blocking
round advance.

### `roundProvider` — optional injection into `useGameRound`

When SRS is enabled, `useGameRound` receives a `roundProvider` whose
methods are wired to the SRS round selector. When SRS is disabled, the
optional argument is omitted and `useGameRound` falls back to today's
generator.

### Events `useGameRound` must publish (upstream requirement on #257)

The recorder subscribes to a lifecycle event stream that does not yet
exist in `src/types/game-events.ts`. #257's `useGameRound` extraction
must add the following event types and ensure existing emitters publish
them. SRS v1 is blocked until these land.

- **`round-shown`** — payload `{ roundId, itemId, ts }`. Emitted by
  `useGameRound` on round mount.
- **`first-action`** — payload `{ roundId, ts, kind }` where `kind` ∈
  `'tile' | 'key' | 'tap'`. Emitted on first tile-place / keystroke /
  tap.
- **`mistake`** — payload
  `{ roundId, ts, expectedTile, actualTile, slotId, distractorSource }`.
  Emitted from `answer-game-reducer` wrong-placement branch and the
  WordSpell typed-input checker.
- **`tts-played`** — payload `{ roundId, ts }`. Emitted from
  `useGameTTS.speakPrompt` (currently uncounted).
- **`visibility-change`** — payload `{ ts, hidden }`. New listener
  bridging `document.visibilitychange`, scoped to the active session.
- **`round-resolved`** — payload `{ roundId, ts, outcome, finalAnswer? }`.
  Emitted by `useGameRound` on round complete.

The SRS adapter's `classifyMove` consumes the `mistake` event payload
to populate `confusionTags` for v2 skill aggregation. The
`visibility-change` event powers `visibilityHiddenMs` on `srs_attempts`
(idle correction, no permission prompts).

### Migration from `word_spell_seen_words`

One-time per-profile migration on first SRS-aware boot.

**Idempotency mechanism.** Migration completion is recorded on the
existing `settings` collection as a flat field — same place as the
SRS feature flags — to avoid introducing a single-boolean collection:

```ts
settings.srsV1MigrationComplete: boolean; // default false
```

The `migrationFlag` utility used in the code below is a thin wrapper
around this field (`isComplete(id, profileId) → settings.srsV1MigrationComplete`,
`markComplete(id, profileId) → settings.srsV1MigrationComplete = true`).
The `id` argument is reserved for forward compatibility with future
SRS migrations — for v1 the only valid id is `'srs-v1'`. If the boot
is interrupted between `bulkInsert` and `markComplete`, the next boot
re-runs the migration; `bulkInsert` must therefore tolerate existing
ids (use upsert semantics or check before insert).

The legacy `WordSpellSeenWordsDoc` shape is
`{ id, profileId, signature, words: string[], updatedAt }` — each
document bundles N seen words for a `(profile, signature)` pair. There
are no per-word timestamps and no per-word attempt counts. The
migration is therefore intentionally lossy: `firstSeenAt` and
`lastAttemptAt` both inherit `doc.updatedAt`, and `attemptCount`
defaults to 1 as a floor.

**`dueAt` is spread, not piled.** A naive `dueAt = now` for every
migrated item produces a "200 items all due now" cliff: the round
selector sees 200 ties at zero overdue, and the first SRS-aware session
arbitrarily picks 7. To avoid this, migrated items get `dueAt`
distributed across the next `MIGRATION_DUE_SPREAD_MS` (default 30
days) using a deterministic per-(profile, word) pseudo-random offset.
Items naturally surface a few per session over the spread window,
giving SM-2 time to calibrate from real play.

```ts
const MIGRATION_DUE_SPREAD_MS = 30 * 24 * 60 * 60 * 1000;

const migrateSeenWordsToSrsItems = async (profileId: string) => {
  if (await migrationFlag.isComplete('srs-v1', profileId)) return;
  const seen = await db.word_spell_seen_words
    .find({ profileId })
    .exec();
  const now = Date.now();
  const items: ItemSrsState[] = [];
  for (const doc of seen) {
    const updatedAtMs = new Date(doc.updatedAt).getTime();
    for (const word of doc.words) {
      // seededRandom is deterministic per (profileId, word) so the
      // same kid on the same device sees the same migration ordering
      // across reinstalls / restores.
      const offset = Math.floor(
        seededRandom(`${profileId}:${word}`) * MIGRATION_DUE_SPREAD_MS,
      );
      items.push({
        ...initialState(
          profileId,
          'word-spell',
          'words',
          `word-spell:words:${word}:recall:drag`,
          now,
        ),
        firstSeenAt: updatedAtMs,
        lastAttemptAt: updatedAtMs,
        attemptCount: 1,
        dueAt: now + offset,
      });
    }
  }
  await db.srs_items.bulkInsert(items);
  await migrationFlag.markComplete('srs-v1', profileId);
};
```

Honest defaults: items inherit best-effort timestamps from the legacy
`updatedAt` and a floor `attemptCount` of 1. No synthetic correctness
history is fabricated. Items are due immediately (`dueAt = now`) so the
round selector treats them as `duePool` candidates on first SRS-aware
boot, and SM-2 calibrates from real play.

After the migration completes successfully, `word_spell_seen_words` is
read-only for one release. RxDB collection-level migration removes it in
v1.1.

## Feature flags — profile settings

Two per-profile preferences stored on the existing `settings`
collection (flat keys alongside `ttsEnabled`, `volume`, etc.), not on
`ProfileDoc`:

```ts
settings.srsEnabled: boolean;          // default false in v1
settings.srsRecordingEnabled: boolean; // default false in v1
```

The `settings` collection schema version is bumped and a migration
sets both flags to `false` on existing rows.

**Behaviour matrix:**

- **`srsEnabled = false, srsRecordingEnabled = false`** — Default for
  v1. No SRS code path runs. Round queue uses today's generator. No
  `srs_*` writes.
- **`srsEnabled = false, srsRecordingEnabled = true`** — Opt-in
  pre-flip data capture. Recorder runs, `srs_items` is upserted,
  `applyGrade` is called, full `srs_attempts` documents are written.
  Round queue still uses today's generator (the SRS round provider is
  NOT injected).
- **`srsEnabled = true` (any recording flag)** — Full SRS. Round
  provider injected; recorder runs; `srs_items` calibrated. Recording
  is implicitly on regardless of the recording flag.

**Implementation guard:** the effective recording state is
`srsEnabled || srsRecordingEnabled`. When effective recording is on,
the recorder runs `applyGrade` and upserts `srs_items` even if the
round provider is not injected — this is what makes the data captured
in mode 2 directly comparable to data captured in mode 3.

UI: a toggle in the profile-settings screen, label _"Smart practice
(recommended)"_, helper text _"Brings back words you're still learning,
more often."_ The recording-only flag is a developer-/beta-tester-only
setting (not surfaced in the kid-facing settings), exposed via the
existing `/dev` route or a parent-PIN-gated advanced settings page.

This split lets us capture pre-flip data and tune the algorithm before
flipping the `srsEnabled` default to `true` in a future release.

## Observability

- **`srsLogger`** — leveled logger gated by `localStorage.SRS_DEBUG`.
  Logs every grade derivation with reason, every re-insertion, every state
  transition.
- **Dev-only `/dev/srs-inspector` panel** — current profile's `srs_items`:
  due-soon list, ease distribution, lapse counts, recent attempts. Useful
  during the constants-tuning period.
  Telemetry to an external analytics pipeline (`srs.attempt-recorded`,
  `srs.lapse`, `srs.mastery-reached`) is **out of scope for v1** — the
  dev inspector and `srsLogger` cover soak-period observability needs.
  Production telemetry is added in the same release that flips
  `srsEnabled` default to `true`, when production signal quality
  materially affects the team.

## Performance

- `composeSession` cost: bounded by `newPoolMax = 50`; one IndexedDB query
  per pool; ~5 ms total.
- `srs_attempts` write: single async upsert per round; failure logs and
  continues.
- `srs_items` upsert: same pattern.
- Storage growth: ~16 MB / active player / year capped at ~4–8 MB by the
  90-day / 5,000-attempt retention guard. Long-term history is the
  cloud-sync follow-up's responsibility.

## Testing strategy

Per project rule, **TDD throughout** — every algorithm function gets a
failing test before implementation.

| Layer                 | Test type                           | Example                                                                                   |
| --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `sm2.ts`              | Unit (vitest)                       | "grade 5 on rep 2 → interval = 1 day; ease unchanged at 2.5"                              |
| `grade-derivation.ts` | Unit (vitest)                       | "1 mistake + correct + fast → grade 3 with reason 'correct-after-1-mistake'"              |
| `round-selector.ts`   | Unit (vitest)                       | "5-round session, 5 lapses on same item → reinsertions capped at 3, queue stays length 5" |
| WordSpell adapter     | Unit (vitest)                       | "typed 'kat' for 'cat' → confusionTags includes 'misspell:k-as-c'"                        |
| Recorder integration  | Component (vitest + RxDB in-memory) | "play round → `srs_attempts` doc written, `srs_items` upserted"                           |
| End-to-end            | Playwright e2e                      | "play 3 sessions → due items returning correctly"                                         |
| Visual regression     | Playwright VR                       | "HUD shows updated count after re-insertion"                                              |

## Rollout

- **Initial defaults.** `srsEnabled = false` in prod, `srsEnabled = true`
  in dev. `srsRecordingEnabled = false` everywhere by default.
- **Soak data source.** Dev profiles run with `srsEnabled = true` (full
  SRS, full data). A small set of opt-in beta-tester profiles runs with
  `srsEnabled = false` AND `srsRecordingEnabled = true` — these capture
  full attempt data with the legacy round generator, so the team can
  compare scheduling-on vs scheduling-off learning trajectories on
  comparable populations. Beta opt-in is surfaced via a parent-PIN-gated
  advanced settings page (not in the kid-facing settings).
- **Soak activities.** Monitor data quality, tune constants in
  `sm2-config.ts` and `round-selector-config.ts`, validate via
  `/dev/srs-inspector`, sanity-check the SM-2 ladder against real
  player histories.
- **Exit criteria for flipping `srsEnabled` default to `true` in
  prod.** All of the following must hold across the soak cohort:
  - **Median grade-5 rate per session** — climbs by ≥ 5 percentage
    points over the first 20 sessions (learning is happening).
  - **Lapse rate on previously-mastered items** (≥ rep 3) within 14
    days — < 15% (algorithm isn't over-spacing).
  - **In-session re-insertion stretches median session length** — < 10%
    (predictability holds in practice).
  - **Soak duration** — ≥ 30 days with at least 50 active dev/beta
    profiles.
  - **Defect signal** — no SRS-attributable bug reports for 14
    consecutive days before flip.

  These are deliberately concrete so the flip decision is data-driven
  rather than vibes-driven. If a criterion misses, the data drives a
  specific tuning pass (e.g. lapse rate too high → shorten interval
  ladder), not a deferred-indefinitely retreat.

## Decision log

| Decision                      | Choice                                                              | Reason                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Algorithm                     | SM-2 (not FSRS, not Leitner)                                        | Right complexity for v1; deterministic; swap-able later because all input signals are recorded                  |
| Game scope                    | WordSpell first; foundation game-agnostic                           | Prove against strongest fit; avoid second migration                                                             |
| Item identity                 | `(gameId, contentSource, word, mode, inputMethod)`; drag/type split | Motor demands diverge; mixing contaminates SM-2 state + v2 aggregation; confusion tags suffix `:drag` / `:type` |
| Session entry UX              | Quietly woven, no separate review screen                            | Lowest friction; predictable for kids                                                                           |
| Layered v1 vs v2              | Item-SRS in v1; schemas shaped for skill layer                      | Same shipping speed as item-only; no rework when skill layer lands                                              |
| Session shape                 | Fixed `totalRounds`, explicit composition rules                     | Predictable for kids/parents; tunable mix                                                                       |
| Lapse re-insertion            | In-session re-insertion that displaces queue tail (no growth)       | Predictable session length + Nessy-style deeper practice on errors                                              |
| Lapse forgiveness window      | 14 days, no ease drop outside                                       | Fair to inconsistent young players                                                                              |
| Decision-time as grade signal | Yes — required for grade 5 (automaticity)                           | Distinguishes "decoded" from "automatic" reading                                                                |
| Mistake-pattern detection     | `multiple-same` → grade 1; `multiple-varied` → grade 2              | Same mistake = misconception; scattered = exploration                                                           |
| Per-doc `schemaVersion`       | Yes                                                                 | Project has been bitten by un-versioned schema changes                                                          |
| Feature flag                  | Per-profile setting, default off, recording independent             | Allows pre-flip data capture for tuning                                                                         |
| Profile reset                 | Deferred                                                            | Not on critical path                                                                                            |
| Cloud sync                    | Deferred                                                            | Not on critical path                                                                                            |

## Open follow-ups

Filed as separate issues so they don't block v1:

- **[#262](https://github.com/leocaseiro/base-skill/issues/262)** —
  SortNumbers adopts `useGameRound` (post-#257; SRS adapter for SortNumbers
  comes later).
- **[#295](https://github.com/leocaseiro/base-skill/issues/295)** —
  Onboarding placement assessment; cold-start input source for SRS.
- **[#296](https://github.com/leocaseiro/base-skill/issues/296)** — HUD +
  scoring accuracy target; natural surface for SRS error data.
- (To file post-spec) — Echo reading: auto-TTS the correct answer after a
  lapse.
- (To file post-spec) — Archive or cloud-sync of `srsStateBefore` /
  `srsStateAfter` snapshots once cloud is available.
- (To file post-spec) — Streak surfacing in HUD for motivation /
  engagement.
- (To file post-spec) — Mastery report for parents
  ("twirl encountered 23 times, mastered after 18 exposures").

## Glossary

- **SM-2** — SuperMemo 2 algorithm. Schedules each item based on consecutive
  successful reviews and an ease factor; the basis for Anki's classic
  scheduler.
- **Item** — the unit SRS schedules. For WordSpell, a `(word, mode)` pair.
  For other games, see the adapter section.
- **Skill** — a finer-grained concept tag attached to items
  (`'grapheme:oo'`, `'category:vowel'`). Recorded in v1; aggregated in v2.
- **Confusion tag** — a finer-grained tag attached to a single mistake
  describing why it was confusable (`'mirror-confusable'`,
  `'font:atkinson'`). Recorded in v1; aggregated in v2.
- **Lapse** — a missed review. Resets `repetitions` to 0; may drop ease
  factor depending on forgiveness rules.
- **Due item** — an item whose `dueAt <= now`.
- **Weak item** — an item lapsed within `weakRecencyMs` but not yet due
  again; eligible for fill slots in `composeSession`.
- **Automaticity** — fast decision plus fast execution; the grade-5 bar.
  From reading-fluency literature.
- **Grade derivation** — the rules engine that maps recorded attempt
  signals to a 0–5 SM-2 grade.
