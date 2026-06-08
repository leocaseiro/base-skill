# Handoff: Sync PR #394 plan with §13.1.F + §13.1.G spec additions — MIDWAY

**Date:** 2026-06-05
**Branch:** `docs/plan-365-m1-tts-xstate`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/plan-365-m1-tts-xstate`
**Git status:** clean / in sync with origin (rebased this session)
**Last commit (origin tip):** `0a94c70e51196d0d06f2a85d9ca09784fd4f5686`
**Plan PR:** [#394](https://github.com/leocaseiro/base-skill/pull/394) — OPEN

**Sibling artifacts (already complete this session):**

- **Spec PR [#391](https://github.com/leocaseiro/base-skill/pull/391):** 32/32 ce-doc-review findings closed. Head `89fff644a`. PR comment fully updated to completion status. Worktree at `worktrees/spec-lifecycle-tts-xstate`.
- **Tooling issue [#420](https://github.com/leocaseiro/base-skill/issues/420):** filed for `markdownlint --fix` corrupting the spec.

## Resume command

```
/resync
cd worktrees/plan-365-m1-tts-xstate
# Resume PR #394 plan sync at Touchpoint 5 (Round 2)
# Plan file: docs/superpowers/plans/2026-05-13-spec-1a-m1-tts-lifecycle-xstate.md (3,152 lines)
```

## Critical constraints — read FIRST

1. **NEVER run `yarn fix:md`, `markdownlint-cli2 --fix`, or any `--fix` markdown command on the spec or this plan file.** It CORRUPTS bold-around-inline-code spans and rewrote line 1 of the spec to "WebSpeechSpeaker" in a prior attempt (see issue [#420](https://github.com/leocaseiro/base-skill/issues/420)).
2. **Verify with check-only:** `npx markdownlint-cli2 <file>` (expect `0 error(s)`) plus `npx prettier --check <file>`. `prettier --write` alone is SAFE; the corrupter is `markdownlint --fix`.
3. **Commit with `SKIP_LINT=1`** to bypass the corrupting lint-staged hook. Only `.md` is staged so no typecheck triggers.

## Current state

**Task:** Sync PR #394 plan with §13.1.F (#30–31) + §13.1.G (#32–40) + Alt-A/B/C spec additions.
**Phase:** Plan sync midway — 4 of 8 touchpoints walked + approved; 4 remaining.
**Progress:** **0 plan-side commits applied yet.** All 4 approved touchpoints are awaiting batch apply (will go in ONE subagent dispatch after Round 2 acks).

## What we did this session

1. Resumed at §13.1.G #36 walk; locked + applied **all 9 §13.1.G findings + 3 alternates** to the spec via subagent (commit `89fff644a` on PR #391).
2. Walked + locked + applied **§13.1.F (#30–31)** to spec (commit `41b9dfd21`).
3. Rebased spec branch onto origin (which had been rebased onto merged voice work PR #409/#406 — voice didn't touch spec, zero conflicts), pushed clean → PR #391 head = `89fff644a`.
4. Updated PR #391 comment (replaced 2026-05-26 pause handoff with completion status).
5. Filed tooling issue #420.
6. Set up plan worktree, rebased plan branch clean.
7. Round 1 (touchpoints 1–4): all 4 acked + walks approved.
8. About to enter Round 2 (touchpoints 5–8) when user invoked `/handoff`.

## Plan-sync touchpoints — status

### Round 1 — APPROVED, NOT YET APPLIED (4 / 8)

| #   | Plan target                                                                                                                                                                                              | Source lock   | Approval                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Phase 0** (plan line 107): bus rename intro                                                                                                                                                            | Alt-A         | **Apply** as-recommended: append one paragraph noting rename is runtime-only (`session_history.action` = `Move.type` UPPER_SNAKE, separate namespace, no RxDB migration).        |
| 2   | **File Structure → New files** (line 162)                                                                                                                                                                | #34, #36, #39 | **Apply** as-recommended: add `useCurrentProfile.ts`, `useCurrentSession.ts`, `useLifecycleTtsUnavailableHandler.ts`, `tests/storybook/with-lifecycle-tts.tsx` to the inventory. |
| 3   | **Task 4 Step 3** (line 721–749) — originally framed as "Task 1" but Task 1 is `src/lib/lifecycle-tts/types.ts`; the two-tier `BaseGameEvent` restructure belongs in `src/types/game-events.ts` = Task 4 | #38, #40      | **Apply as shown** — see Chunk D content below.                                                                                                                                  |
| 4   | **Task 4 Step 1 test** (line 699–706) + **Task 16** (overlay rename) envelope-source note                                                                                                                | #34, #40      | **Apply as shown** — see Chunk E content below.                                                                                                                                  |

### Round 2 — NOT YET ASKED (4 / 8)

| #   | Plan target                                            | Source lock | Notes for the AUQ                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | **Task 7** (line 1226+): hook contracts                | #39         | use(LifecycleTtsContext) + throw (mirror useAnswerGameContext); withLifecycleTts decorator; useSpeakButton(explicit?) explicit → roundToPayload(round) → PREVIEW_PAYLOAD. Mirrors spec §6.1.1.                                                            |
| 6   | **Task 7** (sub-section): speaker lifecycle            | #36         | `useMemo(() => new WebSpeechSpeaker(settings, bus), [])` in Provider; `forwardSettings` machine action calls `speaker.updateSettings()`; `useLifecycleTtsUnavailableHandler` bridges bus → PR #409 `VoiceUnavailableDialogProvider`. Mirrors spec §7.2.1. |
| 7   | **Task 8** (line 1527+): mount site                    | #33         | `LifecycleTtsProvider` mount at `src/routes/__root.tsx` inside `ServiceWorkerProvider`, outside route outlet; DEV duplicate guard. Mirrors spec §5.5.1.                                                                                                   |
| 8   | **Task 8** (sub-section, or Task 17): single emit-site | #37         | Engine `loading.entry` action is SOLE emit site for `game.start` AND `game.resume`; `AnswerGameProvider` MUST NOT emit; `initialState` discriminates. Mirrors spec §4.2.1.                                                                                |

### Touchpoints with NO edit needed (verified pre-sync)

- **Alt-B** (no per-game talkativeness) — already collapsed per commit `c5a0605d5`.
- **Alt-C** (subject `?? null` coercion inline) — `lifecycle.tts.played` appears 20× inline in current plan; no factory present.
- **#31 tier column** — spec §11.4 owns this; plan doesn't replicate the 25-commit slicing.
- **#35 pickTtsSettings** — plan doesn't reference `pickTtsSettings` at all; nothing to update.

## Chunk D — Touchpoint 3 approved content (Task 4 Step 3 replacement)

```ts
// src/types/game-events.ts

// (a) Two-tier base — #40
export interface BaseGameEvent {
  type: GameEventType;
  gameId: string;
  sessionId: string;
  profileId: string;
  timestamp: number;
  // roundIndex REMOVED from base — see RoundScopedGameEvent below
}

export interface RoundScopedGameEvent extends BaseGameEvent {
  roundIndex: number;
}

// (b) Reclassify:
//   - Round-scoped (extends RoundScopedGameEvent): game.action, game.evaluate, game.score,
//     game.hint, game.retry, game.time_up, game.round-advance, game.drag-start,
//     game.drag-over-zone, game.tile-ejected
//   - Non-round (extends BaseGameEvent): game.start, game.instructions_shown, game.end,
//     game.level-advance, celebration.start, celebration.complete, celebration.skip
//   - Dual-natured (extends BaseGameEvent + own optional roundIndex?): LifecycleSpeakEvent

// (c) GameEventType — add 4 new lifecycle literals (#38)
export type GameEventType =
  | 'game.start'
  | 'game.prepare'              // Task 4 addition
  | /* …existing entries unchanged… */
  | 'lifecycle.speak'
  | 'lifecycle.cancel'                  // NEW
  | 'lifecycle.tts.played'              // NEW
  | 'lifecycle.tts.unavailable'         // NEW
  | 'lifecycle.tts.cloud-fallback';     // NEW

// (d) game.prepare — non-round, no roundIndex
export interface GamePrepareEvent extends BaseGameEvent {
  type: 'game.prepare';
}

// (e) New lifecycle event interfaces
export interface LifecycleCancelEvent extends BaseGameEvent {
  type: 'lifecycle.cancel';
}

export interface LifecycleTtsPlayedEvent extends BaseGameEvent {
  type: 'lifecycle.tts.played';
  lifecycleEvent: LifecycleEvent;
  subject: LifecycleSubject | null;
  source: 'auto' | 'user';
  variant: Talkativeness;
  durationMs: number;
  roundIndex?: number; // dual-natured (round verbs only)
}

export interface LifecycleTtsUnavailableEvent extends BaseGameEvent {
  type: 'lifecycle.tts.unavailable';
  subject: LifecycleSubject;
}

export interface LifecycleTtsCloudFallbackEvent extends BaseGameEvent {
  type: 'lifecycle.tts.cloud-fallback';
  subject: LifecycleSubject;
}

// (f) GameEvent discriminated union — add new members
export type GameEvent =
  | GameStartEvent
  | GamePrepareEvent
  | /* …existing entries unchanged… */
  | LifecycleSpeakEvent
  | LifecycleCancelEvent
  | LifecycleTtsPlayedEvent
  | LifecycleTtsUnavailableEvent
  | LifecycleTtsCloudFallbackEvent;
```

## Chunk E — Touchpoint 4 approved content

1. **Task 4 Step 1 test** (line 699–706): remove the `roundIndex: 0,` line from the `GamePrepareEvent` literal (covered by Chunk D reclassification — `GamePrepareEvent extends BaseGameEvent` so no `roundIndex`).
2. **Task 16** (Rename `InstructionsOverlay → GameOptionsOverlay`): add this paragraph plus snippet:

> **Envelope source for `game.prepare`** (spec §13.1.G #34 A1 path). `GameOptionsOverlay` reads `profileId` and `sessionId` for the bus envelope from the two new hooks:
>
> ```tsx
> // inside GameOptionsOverlay.tsx
> const profile = useCurrentProfile();
> const session = useCurrentSession();
> useEffect(() => {
>   getGameEventBus().emit({
>     type: 'game.prepare',
>     gameId,
>     sessionId: session.id,
>     profileId: profile.id,
>     timestamp: Date.now(),
>     // no roundIndex — `game.prepare` is non-round (spec §4.3.1)
>   });
> }, [gameId, session.id, profile.id]);
> ```
>
> `game.start` / `game.resume` are emitted by the engine `loading.entry` action (single emit-site contract, spec §4.2.1 / Touchpoint 8 below) — not by the provider or overlay.

## Next steps (resume order)

1. [ ] **Confirm cwd** is `worktrees/plan-365-m1-tts-xstate/`. Verify status clean + in sync with origin.
2. [ ] **Ask Round 2 AUQ** — 4 sub-questions (Touchpoints 5–8), each with `Apply / Walk wording first / Defer`. **CRITICAL: use lean reference-questions (`see 📖 X above`) per `feedback_structured_verbose.md` — do NOT inline long context inside the picker** (user flagged this twice).
3. [ ] For each touchpoint where user picks "Walk first", read the current Task 7 / Task 8 content and draft proposed text as a labeled chunk, then re-ack per touchpoint.
4. [ ] **Bulk apply** all 8 approved touchpoints via ONE general-purpose subagent dispatch (mirrors the §13.1.G spec apply). Brief MUST include:
   - All 8 touchpoint contents (Chunks D + E + Round 2 chunks).
   - Hard constraints: NEVER run `yarn fix:md` / `markdownlint --fix`; verify check-only; commit with `SKIP_LINT=1`.
   - Commit message: `docs(plans): sync with spec §13.1.F + §13.1.G additions (8 touchpoints, PR #394)`.
5. [ ] Verify diff (line 1 of plan still intact, lint + prettier clean, only intended touchpoints).
6. [ ] Push to PR #394.
7. [ ] Optionally: merge PR #391 (spec) — user previously chose "sync plan first, then merge #391" path.

## Decisions made / rules reinforced this session

- **AUQ per-decision granularity** — split decisions into separate sub-questions in the `questions` array; never bundle into a single question's options. Up to 4 sub-questions per call. Saved as durable memory via `feedback_auq_self_contained_context` (this session).
- **Structured verbose — chunked-response + lean reference-question** — long context goes in labeled `📖 Chunk X` blocks in the response body; the AUQ stays lean and points back by name. `feedback_structured_verbose.md` was updated by the user mid-session to reinforce this. User flagged me twice for putting long content inline in the AUQ.
- **md tooling is unsafe on this spec** — `yarn fix:md` corrupts bold-around-inline-code spans. Workaround: `SKIP_LINT=1` plus check-only verification. Filed as issue #420.
- **§13.1.G #40 supersedes the originally-proposed sentinel** — the handoff that preceded this session said "sentinel `roundIndex: 0` for `game.prepare`"; user pushed back, realized the smell was the _required_ base field, locked the two-tier restructure instead. This extends #38 (the spec apply now does both in §4.3.1).
- **§13.1.G #39 reversed twice** — original proposal: noop on missing provider. User asked about Suspense; I revised to throw (mirrors `useAnswerGameContext`). Also #39d refined to explicit-payload param + RoundContext fallback (mirrors current `AudioButton({ prompt })`).
- **Spec branch + plan branch both rebased** onto origin (which sat on top of merged voice work PR #409/#406; voice didn't touch spec or plan, so rebases were conflict-free).

## Key files

- `docs/superpowers/plans/2026-05-13-spec-1a-m1-tts-lifecycle-xstate.md` — the plan being synced.
- `docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md` — source of truth (in spec worktree, head `89fff644a`). Specifically §4.2.1, §4.3.1, §4.4, §5.5, §5.5.1, §6.1.1, §6.7, §7.2.1, §8.2 for the locks being mirrored into the plan.
- `src/types/game-events.ts` — destination for #38 / #40 in the implementation; plan describes the changes.
- `src/lib/lifecycle-tts/types.ts` — destination for Task 1 (already correct, no sync needed).
- `tests/storybook/with-lifecycle-tts.tsx` — new file (#39 decorator).
- `src/routes/__root.tsx` — mount site (#33).

## Open questions

- [ ] Round 2: are touchpoints 5–8 Apply-direct or Walk-first?
- [ ] After all 8 applied + pushed, does user want to merge PR #391 now or after plan PR review?

## Context to remember

- User is ADHD-diagnosed, medicated. Per `~/.claude/adhd-collaboration-rules.md`: structured-verbose with headers, defer option in every AUQ, acronym expansion inline, tag every Q `[Q-X.Y]`, max 4 sub-questions per AUQ call, never bundle decisions, ALWAYS use labeled `📖 Chunk` for long content + lean reference-questions in AUQ.
- User explicitly chose "Sync PR #394 plan first, then merge #391" earlier this session.
- Tasks pane this session ended with task #9 (`Sync PR #394 plan`) still `in_progress`.
- Existing worktree at `worktrees/plan-365-m1-tts-xstate/` is on the correct branch and rebased clean — no `git worktree add` needed; just `cd` into it.
- Untracked `.cursorindexingignore` in plan worktree — ignore.
