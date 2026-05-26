# Handoff: Lifecycle TTS spec — ce-doc-review walkthrough PAUSED at §13.1.G

**Date:** 2026-05-26 (paused mid-§13.1.G walk)
**Branch:** `docs/spec-lifecycle-tts-xstate`
**Worktree:** `worktrees/spec-lifecycle-tts-xstate`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/spec-lifecycle-tts-xstate`
**Git status:** clean / pushed (no local-ahead commits)
**Last commit:** `53798dc48 docs(spec): apply ce-doc-review §13.1.E locks (#23-29, 21/32 findings closed)`
**PR:** [#391](https://github.com/leocaseiro/base-skill/pull/391) — open, head `53798dc48`

## Resume command

```bash
/resync
cd worktrees/spec-lifecycle-tts-xstate
# Next: resume mid-§13.1.G walk
#   - Apply §13.1.F + §13.1.G partial locks (8 sub-decisions: #30, #31, #32, #33, #34, #35)
#   - Walk remaining: §13.1.G #36-40 + §13.1.G ack (5 findings + ack)
# Spec doc: docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md
# 27 of 32 findings closed (locked); applied through #29 — 21 of 32 on disk
```

## Current state

**Task:** Section-by-section walkthrough of 32 ce-doc-review findings on the M1 lifecycle-tts spec.
**Phase:** Review — paused mid-§13.1.G.
**Progress:** **27 of 32 findings locked** (decision made); **21 of 32 applied to spec** (on disk). Locks pending apply: 6 sub-decisions in §13.1.F + 4 sub-decisions in §13.1.G partial. Remaining walk: 5 findings + section ack.

## What's been done this session (2026-05-24 → 2026-05-26)

1. Verified `/resync` against origin; PR #391 in sync (0 behind / 4 ahead at session start).
2. **§13.1.D Security & privacy (4 findings, 11 sub-decisions)** — walked + locked + applied. Commit `e8ebe4da6`. Followed by §5.7 step 2 prose/code consistency fix in commit `14981cebc`.
3. **§13.1.E Design & UX (7 findings, 17 sub-decisions)** — walked + locked + applied. Commit `53798dc48`. Includes `processLocally → useOfflineVoicesOnly` field rename cascade (44 references across 22 sections).
4. **§13.1.F Product (2 findings, 4 sub-decisions)** — walked + locked. **NOT YET APPLIED** to spec.
5. **§13.1.G Implementation gaps** — partial: 4 of 9 findings walked + locked. 5 findings + ack remaining.
6. **PR [#394](https://github.com/leocaseiro/base-skill/pull/394) plan PR** — fully aligned with §13.1.A-E locks via 4 new commits (`c5c9dd814` + `c5a0605d5` + `04c6a10dc` + `67a6abd67`). All 7 CI checks PASS. Mergeable.
7. **PR [#409](https://github.com/leocaseiro/base-skill/pull/409) voice UI** — verified safe to merge; spec §7.2 forward-looking note added (commit `4df20ba69`) crediting its `VoiceUnavailableDialogProvider` for the M1 unavailability flow.
8. **Two durable memories written:** `project_m1_six_goals` (G-1 to G-6 + no-deferral-for-in-goal directive) and `feedback_individual_questions_for_complex_locks` (separate AUQs for multi-part finding locks).

## Decisions locked but NOT YET applied to spec

### §13.1.F (Product) — 4 sub-decisions

#### #30 — i18n investment justification (`A3` chosen)

- **Lock:** Add §2 note acknowledging i18n key indirection + 4-layer resolver as a deliberate forward-looking ADR per `project_m1_six_goals` — enables M3 skin TTS overrides via translated keys (G-2) and any future locale rollout without resolver rewrite. Locale-shipping schedule TBD; no kill criterion.

#### #31 — Done-once shield + commit tiering

- **Part A (lock):** Add tier column to §11.4 commit table mapping each of 25 commits to {G-1..G-6, foundation, polish}. Bus rename (commits 1-4) tagged `foundation (indirect G-1/G-3)`. Makes scope negotiable without cutting.
- **Part B (skip):** Keep §10 preamble "comprehensive over YAGNI" phrasing — durable directive lives in `project_m1_six_goals` memory; no spec churn needed.

### §13.1.G partial (Implementation gaps) — 4 sub-decisions of 9 findings

#### #32 — Bus access pattern (REVISED per user pushback — `getGameEventBus()` is correct)

- **Lock:** Add §3.1.X "Bus access pattern" — components and hooks access the bus via existing `getGameEventBus()` module singleton. **No new `useGameEventBus` hook file.** Update spec samples in §8.5 + §10.3 to call `getGameEventBus()` directly. Tests mock via `vi.mock('@/lib/game-event-bus', ...)`.

#### #33 — `LifecycleTtsProvider` mount site

- **Lock:** Add §5.5.1 "Provider mount site" naming `src/routes/__root.tsx` (inside `ServiceWorkerProvider`, outside route outlet). DEV singleton-guard via React code (e.g., `useId` or context-existence check). Update §11.3 modified files list.

#### #34 — `game.prepare` / `game.start` / `game.resume` envelope source (HYBRID A1 + A2)

- **Lock — hybrid:**
  - `game.prepare` (overlay mount, pre-engine) → **A1** — create `useCurrentProfile()` + `useCurrentSession()` hooks (data source: RxDB `sessions.findOne()`, `ANONYMOUS_PROFILE_ID`); GameOptionsOverlay emits with envelope. Add 2 hook files + tests to §11.2.
  - `game.start` (after "Let's go", engine mounted) → **A2** — engine `loading.entry` action emits with envelope from engine context. Single emit site.
  - `game.resume` (remount with `initialState` prop present) → **A2** — same path as `game.start`; engine detects via `initialState` heuristic.

#### #35 — `pickTtsSettings` signature alignment

- **Lock:** Change signature from `(s: SettingsDoc | undefined)` to `(s: UseSettingsResult['settings'])`. Delete the misleading "still resolving" sentence in §5.5 — `useSettings()` masks RxDB latency internally and never returns undefined. Boundary defaults still apply for partial docs. ~5 lines edited.

## Pending walk (5 findings + ack)

### §13.1.G #36 — `WebSpeechSpeaker` construction site (critical)

> Speaker takes `(settings, bus)` per §13.1.D #19 lock; XState actor invokes `speakerAdapter.speak(input)`. Spec never names who **constructs** the speaker singleton or wires `updateSettings()`.

**Proposed lock:** Add §7.2.1 "Speaker lifecycle" — speaker constructed inside `LifecycleTtsProvider` via `useMemo(() => new WebSpeechSpeaker(settings, bus), [])`; SETTINGS_CHANGED forwarded via machine action calling `speaker.updateSettings(settings)`; unavailable-event handler added to §11.2 as a named sibling.

### §13.1.G #37 — `game.start` / `game.resume` emission CONTRACT (critical)

> #34 hybrid already locks the WIRING. What's left: spec the contract explicitly — single emit site, no double-fire, resume detection.

**Proposed lock:** Add §4.2.1 "game.start and game.resume emission contract" — engine `loading.entry` action is the SINGLE emit site for both. `AnswerGameProvider` does NOT emit. Distinguish via `initialState` prop. Concrete code sample updating `src/lib/game-engine/side-effects.ts`.

### §13.1.G #38 — New events not declared on `GameEvent` union (major)

> §4.3 adds 4 new event interfaces (`LifecycleTtsPlayedEvent`, `LifecycleCancelEvent`, `LifecycleTtsUnavailableEvent`, `LifecycleTtsCloudFallbackEvent`) but `GameEvent` discriminated union + `GameEventType` literal union are not updated.

**Proposed lock:** Insert into §4.3 the full `GameEvent` union diff + 4 new `GameEventType` literals (`'lifecycle.cancel'`, `'lifecycle.tts.played'`, `'lifecycle.tts.unavailable'`, `'lifecycle.tts.cloud-fallback'`). Reference `src/types/game-events.ts` location explicitly.

### §13.1.G #39 — Hook contracts unspecified (major)

> `useSpeakButton` / `useLifecycleTts` are listed in §11.2 but spec never shows: how they obtain actor ref, throw-vs-noop when context missing, Storybook decorator pattern, empty-payload fallback in `useSpeakButton` when `RoundContext` is absent (SettingsPanel preview renders an `AudioButton` without round context).

**Proposed lock:** Add §6.1.1 "Hook contracts" with concrete signatures, context dependency, throw-vs-noop contract, Storybook decorator example, empty-payload fallback rules.

### §13.1.G #40 — `roundIndex` envelope unsourced for `GameOptionsOverlay` (major)

> Sample in §8.5 hardcodes `roundIndex: 0` for `game.prepare`, but `roundIndex` is the SRS correlation key + transition discriminator (§10.2). Collides with mid-game back-navigation when overlay re-mounts.

**Proposed lock:** Either source from a session-scoped context (add to §11.2) OR declare `game.prepare` always carries `roundIndex: 0` AND SRS recorder filters `game.prepare` out. Document the back-navigation case explicitly in §4.2.

### §13.1.G ack — section wrap-up + apply

After #40 is locked, apply all §13.1.F + §13.1.G (32 of 32 findings) in two consolidated commits or one combined commit.

## Pending alternates (parked unless reconsidered)

- **Alt-A (#13.1.G):** Bus colon→dot rename — verify no durable string refs in SRS recorder or persisted analytics rows.
- **Alt-B (#13.1.G):** `talkativeness` on per-game config — currently dropped per §13.1.B #11 (user-setting only). Resolve in §8.1 whether per-game override survives or stays collapsed.
- **Alt-C (#13.1.G):** `subject` coercion via `createTtsPlayedEvent()` factory vs at emit boundary. Currently at emit boundary; factory pattern would centralize.

## What to do on resume

1. **In a new session, run `/resync`, `cd worktrees/spec-lifecycle-tts-xstate`.**
2. **Read this handoff** to load context.
3. **Resume §13.1.G #36-40 walkthrough** — present each finding with brief prose + AskUserQuestion (one finding at a time, lock-as-recommended bias per `project_m1_six_goals`). User explicitly chose "Walk one-by-one with brief prose per finding" via `[Q-§13.1.G.bulk]` answer.
4. **§13.1.G ack** — wrap-up question once #40 is locked.
5. **Dispatch apply subagent** for §13.1.F + §13.1.G combined commit (or two separate commits — F first, then G).
6. **Optional verification** of the §13.1.F+G apply (user previously chose to verify §13.1.D + §13.1.E sections after each apply; pattern is established).
7. **All 32 findings closed** → spec is review-complete. Next phase: M1 plan refinement (PR [#394](https://github.com/leocaseiro/base-skill/pull/394) is already aligned with §13.1.A-E locks; pending sync for §13.1.F + §13.1.G additions if any plan-side changes are needed).

## Spec / Plan

- **Spec doc:** `docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md` (now 2011+ lines after §13.1.E apply; will grow further on F+G apply).
- **Plan PR:** [#394](https://github.com/leocaseiro/base-skill/pull/394) — synced through §13.1.A-E locks. All CI green. Mergeable now or after spec is final.
- **PR #409 voice UI:** [#409](https://github.com/leocaseiro/base-skill/pull/409) — verified safe to merge; spec §7.2 references its `VoiceUnavailableDialogProvider`.

## Key files (master, referenced during review)

- [src/db/schemas/settings.ts](../../src/db/schemas/settings.ts) — current `SettingsDoc` v3 schema
- [src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts) — canonical settings hook pattern (returns `DEFAULT_SETTINGS & Partial<SettingsDoc>` — never undefined; relevant for #35 lock)
- [src/components/SettingsPanel/SettingsPanel.tsx](../../src/components/SettingsPanel/SettingsPanel.tsx) — existing `useSettings()` consumer
- [src/components/answer-game/useGameTTS.ts](../../src/components/answer-game/useGameTTS.ts) — current `speechRate` consumer (deprecated by M1)
- [src/lib/lifecycle-tts/types.ts](../../src/lib/lifecycle-tts/types.ts) — PR 1a pinned types
- [src/types/game-events.ts](../../src/types/game-events.ts) — `LifecycleEvent` union (relevant for #38 lock)
- [src/lib/game-event-bus.ts](../../src/lib/game-event-bus.ts) — `TypedGameEventBus` module singleton (relevant for #32 lock — `getGameEventBus()` is the access pattern)
- [src/lib/game-engine/side-effects.ts](../../src/lib/game-engine/side-effects.ts) — existing bus emit path (relevant for #37 lock)
- [src/routes/\_\_root.tsx](../../src/routes/__root.tsx) — root composition site for `LifecycleTtsProvider` mount (relevant for #33 lock)
- [src/providers/VoiceUnavailableDialogProvider.tsx](../../src/providers/VoiceUnavailableDialogProvider.tsx) — shipped in PR #409; M1 integrates per spec §7.2

## Context to remember

### User directive (highest priority — captured this session)

- **`project_m1_six_goals`** — 6 ranked product goals (G-1 XState · G-2 Skin · G-3 Mini Games · G-4 SRS · G-5 Distractions · G-6 SpotAll exempt). "Done once, done right." No deferrals for in-goal scope. Reviewer YAGNI on G-1..G-5 is categorically rejected.
- **`feedback_individual_questions_for_complex_locks`** — When a review finding bundles 3+ sub-recommendations, split the lock into separate AskUserQuestions (one per sub-part), never roll into a single multi-part option.

### Apply pattern

- Section-by-section walk via `[Q-§X.Y.N]` tagged AskUserQuestion (`feedback_section_by_section_review`).
- Per-finding prose context (`feedback_prose_dialogue_for_walkthroughs`) — verbose where complex, tight where simple.
- Multi-part findings → separate AUQs (`feedback_individual_questions_for_complex_locks`).
- Apply per-section via subagent (commits as review checkpoints per `feedback_commit_as_checkpoint`).

### Memory references actively used this session

- `feedback_section_by_section_review` — `[Q-§X.Y.N]` tag pattern
- `feedback_individual_questions_for_complex_locks` — separate AUQs for multi-part locks (saved this session)
- `feedback_prose_dialogue_for_walkthroughs` — verbose prose when complex
- `feedback_full_worktree_paths` — full paths when referencing files
- `feedback_decision_routing` — route decisions to spec/memory/commit appropriately
- `feedback_commit_as_checkpoint` — commits as review checkpoints
- `feedback_confirm_before_memory_save` — propose memory writes before saving
- `feedback_batch_related_questions` — max 4 questions per AUQ
- `feedback_codex_fallback_to_ce_subagents` — parallel persona reviewers for finding reconstruction
- `feedback_ideal_patterns_directive` — code-side equivalent of comprehensive spec
- **`project_m1_six_goals`** — G-1 to G-6 + comprehensive directive (saved this session)
- **`project_m1_scope_philosophy`** — predecessor; reinforced + extended by `project_m1_six_goals`

### Things to confirm with user on resume

- **§13.1.F + §13.1.G apply strategy:** one combined commit or two separate (F first, then G)?
- **§10.4 escape-hatch caveat reference:** subagent left a `project_m1_six_goals` memory reference verbatim per the brief — confirm this is fine (the memory exists; reference is correct).
- **Alternates A/B/C in §13.1.G:** parked. User can choose to walk them or leave parked.
