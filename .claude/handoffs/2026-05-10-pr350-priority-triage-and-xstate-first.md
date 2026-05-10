# Handoff: PR #350 — 7-finding priority triage + XState-first restructure

**Date:** 2026-05-10
**Branch:** docs/game-definition-design
**Worktree:** worktrees/docs-game-definition-design
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/docs-game-definition-design
**Git status:** clean
**Last commit:** 77c4b6016 docs(plan): commit XState-first end state; restructure PR 1a (Group G + arch shift)
**PR:** #350 — OPEN — <https://github.com/leocaseiro/base-skill/pull/350>

## Resume command

```text
/resync
cd worktrees/docs-game-definition-design
# Two priorities for next session, in order:
#   1) Run /codex review (or another adversarial pass) on the rewritten Task 8 + Task 9
#      in docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md — the XState-first
#      restructure introduced substantial new prescription that hasn't been independently
#      audited. Focus on the machine context shape, the 22-event union, the assign-action
#      bodies (most are stubs that say "Mirror reducer"), and the round-advance flow in
#      Task 9 (CELEBRATION_DONE → NEXT → ADVANCE_ROUND sequencing).
#   2) Resume triaging the ~75 remaining lower-priority Deferred / Open Questions findings
#      across the 3 plan docs (inventory below).
```

## Current state

**Task:** ce-doc-review round 3 on PR #350 — priority triage + architectural restructure
**Phase:** review (priority 7 findings landed; lower-priority findings still deferred for follow-up triage)
**Progress:** 7 of 7 priority findings resolved this session. PR #350 has 8 new commits (7 group fixes + 1 prior handoff). XState-first end state committed in design doc; PR 1a plan substantially rewritten.

## What we did

Triaged the 7 PR-merge-blocker findings from the prior session's handoff (PR 1a F1/F2/F3, TTS F1/F3+F4/F7, design F6) one group at a time with per-group preview and commit. Each group's resolution amended the relevant plan section AND marked the deferred finding "Resolved 2026-05-10" with a one-line pointer. **Group G expanded into a major architectural commitment:** the user chose to restructure PR 1a around XState-first rather than ship the transitional phase-bridge pattern. Tasks 8 and 9 were rewritten substantially; the design doc's Phase authority section was rewritten with a three-layer mental model and a "no phase bridge for migrated games" stake.

## Decisions made

- **Group A — `useGameSounds` gate-removal deferred to PR 1b.** PR 1a leaves `useGameSounds.ts` untouched; NumberMatch retains the `useGameSounds()` call but stops destructuring booleans (overlays gate on `engine.phase`). PR 1b absorbs the full hook simplification when WordSpell + SortNumbers migrate.
- **Group B — `incrementRoundIndex` injected via `assign`.** XState-native fix; NumberMatch machine's `waitingForNext.NEXT.[playing]` actions array is `['incrementRoundIndex', 'buildRound', 'advanceRound']`. Design doc samples updated to match (incl. `incrementLevelIndex` for PR 1b).
- **Group C — Task 11 prescribes append-don't-overwrite.** Three MDX files already exist on disk with legacy content; Task 11 now reads them first and appends XState sections alongside (visual separation: `## Legacy engine` vs `## XState engine`).
- **Group D — bus.subscribe handler bugs.** `bus.subscribe()` returns `() => void`, not `{ unsubscribe }`; handler narrows `GameEvent` discriminated union via `if (event.type !== 'lifecycle:speak') return;` before reading `event.lifecycleEvent`.
- **Group E — Full TTS interpolation contract.** `AnswerGameConfig` adds required `gradeBand: GradeBand` and `talkativeness: TalkativenessPreset`, plus optional `gameTitle` and `events`. New file `src/lib/lifecycle-tts/useRoundContext.tsx` provides round-level `currentWord`/`currentCount`/`gameTitle`. Each game wraps TTS-aware UI in `RoundContextProvider`.
- **Group F — RxDB Settings v3 → v4 migration.** Bump schema, add `migrationStrategies[4]` mapping `ttsEnabled → { autoSpeak, ttsOnDemandAllowed }` (both inherit user intent) plus `talkativeness: 'default'`. Group E's persisted `talkativeness` field absorbed into the same migration so users experience one schema bump.
- **Group G — XState-first end-state committed.** Reducer unification moved from Phase 2 to end of Phase 1: `answer-game-reducer.ts` is deleted in PR 1c, `useAnswerGameContext` is removed (or shimmed), `SessionRecorderGate` migrates to `engine.phase`. PR 1a delivers full NumberMatch state migration (no `useReducer`, no phase bridge); PR 1b applies the same pattern to WordSpell + SortNumbers; PR 1d does SpotAll. Tasks 8 and 9 in the PR 1a plan rewritten substantially.

## Spec / Plan

- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md` — design doc (binding source of truth; XState-first end-state committed; Phase authority rewritten; PR map updated)
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — TTS lifecycle plan (interpolation contract pinned; RxDB migration added)
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md` — PR 1a implementation plan (Tasks 8 + 9 rewritten for XState-first; Architectural Shift section added at the top of Spec Deltas)

## Key files

- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:15` — "Architectural Shift — XState-first" section announcing the change. Read this before reviewing Tasks 8 + 9 below.
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1300` — Task 8 (NumberMatch GameDefinition, full XState machine: 22-event union, full game-state context, assign actions for state mutations).
- `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md:1795` — Task 9 (NumberMatch.tsx integration, no `useReducer`, no phase bridge — component dispatches all state via `engine.send`).
- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md:103` — Phase 1 PR map (PR 1a: foundation + NumberMatch full migration / PR 1b: WordSpell + SortNumbers full migration / PR 1c: reducer removal & cleanup / PR 1d: SpotAll).
- `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md:333` — "Phase authority — XState-first end state" section with the three-layer model (outer route lifecycle / per-game answer reducer / XState engine).
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md:301` — Task 3 Step 3 (extended `AnswerGameConfig` with `gradeBand`/`talkativeness`/`gameTitle`/`events`).
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md:354` — Task 3 Step 3.5 (RxDB Settings v3 → v4 migration).

## Open questions / blockers

### 1) Codex / adversarial review of Tasks 8 + 9 (highest priority next session)

The XState-first restructure is significant and the rewrites have not been independently audited:

- **Task 8 machine context shape** — does it cover everything the existing answer-game reducer holds for NumberMatch? Anything missed (e.g., transient drag flags on a sub-state)?
- **Task 8 event union** — 22 events lifted from `AnswerGameAction`. Are the assign-action bodies (most are `// Mirror reducer 'X' case` stubs) sufficient prescription, or should they be fleshed out before merge?
- **Task 8 root-level `on:` handlers** — drag events (`SET_DRAG_*`) and `INIT_ROUND` / `RESUME_ROUND` are root-level so they fire in any state. Is that semantically correct? (Drag events shouldn't cause state changes during `roundComplete`.)
- **Task 9 round-advance sequencing** — component sends `CELEBRATION_DONE` → `NEXT` → `ADVANCE_ROUND` in three sequential calls. XState v5 processes `send` synchronously, but is the ordering right? Does `ADVANCE_ROUND` get handled by the new `playing` state (which lists it under `on:`) immediately after `NEXT` lands the machine in `playing`?
- **Task 9 ROUND_CORRECT detection** — the new `useEffect` infers correctness by inspecting `zones` and `allTiles`. Is that a regression vs the reducer-driven approach (which dispatched ROUND_CORRECT based on the user's last action, not a derivative observation)?
- **`buildRound` + injected actions** — under XState-first, the engine-injected `buildRound` / `advanceRound` / `completeGame` actions become no-ops for migrated games (NumberMatch). Is that documented clearly enough? Should `useGameEngine` accept an "engine-only" mode that skips the injection?

Run `/codex review` against the latest commit (77c4b6016) and fold findings back into the plan, OR spawn a fresh `ce-adversarial-reviewer` agent on the diff.

### 2) Lower-priority Deferred / Open Questions findings (~75 across 3 docs)

The 7 priority findings are resolved. The remaining ~75 lower-priority findings stay deferred. Inventory:

**TTS plan — `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`** (~31 findings open of ~36 in deferred section; 5 marked Resolved):

- Coherence reviewer (~9 findings) — task ordering issues (Task 11 imports useLifecycleTTS before Task 7 creates it; Task 9 calls lifecycleTTS.speakAuto without initializing; Task 12 routes through wrong hook; SpotAllPrompt hardcoding; `speakPrompt` semantics vs Task 7 usage; i18n key enumeration vagueness)
- Feasibility reviewer (~3 still-open after F1/F2/F3/F4/F7 resolved) — Task 9 calls `useLifecycleTTS()` outside `GameEngineProvider` context; spec reference file not in worktree; two `speakOnDemand` hooks coexist with incompatible signatures
- Scope-guardian reviewer (~5 findings) — `speakAuto` duplicates bus path; Task 3 + Task 7 test stubs lack assertions (TDD violation); Task 16 ARIA depends on undefined state source; QUIET preset duplication
- Adversarial reviewer (~6 findings) — N-fold speech repetition (multiple `useLifecycleTTS()` consumers); Task 9 emits wrong event for M1 game.prepare; `useRoundTTS` + lifecycle TTS double-speak; bus subscription churn on settings tweaks; missing `isSpeechActive` guard; two `game:prepare` emit sources
- Design-lens reviewer (~5 findings) — AudioButton in-flight state; Talkativeness section placement; ARIA live region content + politeness; QuestionRow focus order; Quiet/Chatty preset rationale

**Design doc — `docs/superpowers/plans/2026-05-07-game-definition-engine-design.md`** (~33 findings open of ~35 in deferred section; 2 marked Resolved):

- Coherence reviewer (~8 findings) — `buildRound` sync contract phrasing; OQ#1 already answered elsewhere; Premise 4 "widening = additive" overstatement; Phase 1 vs Phase 2 celebration capability mismatch; PR 1c MDX file list vagueness; TTS plan revision sequencing; `InteractionAdapter` SpotAll asymmetry; Premise 1 vague metric
- Feasibility reviewer (~5 still-open after F6 resolved + useGameSounds finding resolved) — React 18 vs 19 constraint; `machine: AnyStateMachine` type erasure; WordSpell async/sync boundary; SpotAll INIT_ROUNDS ordering; `InteractionAdapter` TRound generic
- Scope-guardian reviewer (~5 findings) — `phonemeSequenceActor` shipped without consumer; `CelebrationConfig.miniGame` registry undefined; provisional Phase 1 conditions; `interaction-adapter.ts` separate file premature; `GameEngineContext` for absent consumer
- Adversarial reviewer (~6 findings) — replay-on-resume celebration idempotency; type contract pin lacks enforcement; concurrent celebration + game-over path; PR 1d integration tests baseline; PR 1a NumberMatch lacks levels for engine validation; XState v5 default behavior asserted without verification
- Product-lens reviewer (~7 findings) — 6+ games premise unproven; SRS v1 timeline opportunity cost; "boring engine" identity drift; solo-developer maintenance cost; LOC target framing; "design wide, implement narrow" bet; Approach B opportunity-cost weighing; failure-mode inversion missing

**PR 1a plan — `docs/superpowers/plans/2026-05-10-spec-1a-pr1a-game-engine.md`** (~8 findings open of ~12 in deferred section; 3 marked Resolved + 1 marked Obsolete):

- Feasibility reviewer (~4 still-open after F1/F2/F3 resolved) — `setup({ actors: undefined as never })` unconventional + unverified in XState v5; `renderHook(toThrow)` test pattern unreliable in React 19; test step missing for Tasks 4 + 7
- Scope-guardian reviewer (~3 findings) — `LEVEL_COMPLETE` bridge branch dead code in PR 1a (note: bridge is now gone — re-read in light of XState-first); `isLastRoundOfLevel` ships in PR 1a but not exercised; `phonemeSequenceActor` injected with no PR 1a consumer
- Adversarial reviewer (~1 still-open after Phase Bridge finding obsoleted) — `gameOver` final state invokes 60s timer before `completeGame` fires; `@xstate/react@^5` peer-dep against React 19 unverified

Some lower-priority findings may now be **obsolete or transformed** by the XState-first restructure (e.g., several scope-guardian items about phonemeSequenceActor, the LEVEL_COMPLETE bridge branch, etc.). Re-read each finding through the new architecture before deciding to fix or defer.

## Next steps

1. [ ] **Run `/codex review` on commit 77c4b6016** focusing on Tasks 8 + 9 of the PR 1a plan. Fold findings back into the plan.
2. [ ] Walk lower-priority deferred findings in batches (suggested order: PR 1a plan first since it's smallest and most concrete, then design doc, then TTS plan). Mark each Resolved / Obsolete / Still Deferred. Per-batch commit.
3. [ ] **Re-read scope-guardian PR 1a findings through the XState-first lens** — `LEVEL_COMPLETE bridge branch dead code in PR 1a` is now likely Obsolete (bridge is gone); `isLastRoundOfLevel ships but never exercised` may also be obsolete since under XState-first the guards do real work via `incrementRoundIndex`.
4. [ ] After all triage closes, refresh the PR #350 description with the architectural shift and ship-readiness summary.
5. [ ] Decide whether PR #350 (docs) merges as-is or whether the substantial Task 8 + Task 9 rewrites warrant another planning round (e.g., `ce-plan` in a fresh worktree to refactor Tasks 8/9 with full implementation detail rather than `// Mirror reducer` stubs).

## Context to remember

- **Worktree convention:** Worktrees live at `<root>/worktrees/<branch>` — never `.claude/worktrees/`. The current worktree is `worktrees/docs-game-definition-design` (correct).
- **Push policy:** User has memory entry "Commit freely; push freely for features, confirm for bug fixes." All 7 group commits + this handoff push without explicit confirmation. PR review happens on GitHub, not pre-push.
- **`SKIP_PREPUSH=1` policy:** All 7 group commits used `SKIP_PREPUSH=1` because they are docs-only. Pre-push CI ran on the actual push and passed (vitest 42 tests). Do **not** add `SKIP_PREPUSH=1` for code commits without justification.
- **Per-finding protocol:** Per memory `feedback_doc_review_batched_protocol.md`, group findings by dependency and present in rounds (not strictly one-by-one). Bulk preview before applying.
- **Bulk-defer offer:** Per memory `feedback_bulk_defer_review_findings.md`, offer to bulk-defer when the user defers 2-3 findings in a row. The 7 priority items were all resolved (no deferrals), so no bulk-defer was needed this session.
- **Markdownlint MD060 trap:** When extending the Modified files / PR map tables in plans, long content rows trigger MD060 alignment errors. Either (a) keep new row content within the existing column width (~60 chars), or (b) replace the table with a numbered list. We hit this twice this session; resolved both by shortening row content.
- **XState-first commitment is binding** (saved as `project_xstate_first_commitment.md`). New game-engine work must use XState as the canonical state substrate; don't re-introduce `useReducer` for game state. Phase 2's "reducer unification" is now Phase 1's PR 1c.
- **Tasks 8 + 9 in the PR 1a plan are partly skeletal.** Most assign-action bodies are `// Mirror reducer 'X' case` stubs. The implementer fills in details from `src/components/answer-game/answer-game-reducer.ts` cases. If reviewers want the plan to be implementation-ready end-to-end, the next session should expand those stubs.
- **Design doc Phase authority section** (line 333) is the new canonical reference for the three phase layers. Cite it when explaining why `SessionRecorderGate` doesn't migrate until PR 1c.
