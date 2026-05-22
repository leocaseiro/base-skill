# Handoff: Lifecycle TTS spec — ce-doc-review walkthrough in progress

**Date:** 2026-05-22
**Branch:** `docs/spec-lifecycle-tts-xstate`
**Worktree:** `worktrees/spec-lifecycle-tts-xstate`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/spec-lifecycle-tts-xstate`
**Git status:** clean / **1 unpushed commit ahead of origin**
**Last commit:** `baa764484 docs(spec): #365 — Lifecycle TTS XState design (M1 Spec 1a revised)`
**PR:** [#391](https://github.com/leocaseiro/base-skill/pull/391) — open

## Resume command

```bash
/resync
cd worktrees/spec-lifecycle-tts-xstate
# Next: continue ce-doc-review walkthrough at §13.1.C (Scope & deliverability, findings #15-18)
# Spec doc: docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md
# Open questions section: lines 1564-1648 (§13.1)
```

## Current state

**Task:** Section-by-section walkthrough of 32 ce-doc-review findings on the M1 lifecycle-tts spec.
**Phase:** Review (spec drafted + reviewed + iteratively closing findings).
**Progress:** 6 of 32 findings closed (§13.1.A, §13.1.B).

## What we did

Across this session:

1. Designed the M1 lifecycle-tts spec end-to-end through ~30 turns of section-by-section conversation (§§4–9 of the spec).
2. Wrote it to disk at [docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md](../superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md) (1583 lines), opened PR #382 (later replaced by #391 after rework).
3. Filed 7 follow-up GH issues (#383–#389) + commented on #230.
4. Ran ce-doc-review which added §13.1 with 32 findings (#9–#40).
5. Walking findings one-by-one with the user using `[Q-§13.1.N]` tagged AskUserQuestion menus.

Closed so far:

| Section                    | Findings closed                            |
| -------------------------- | ------------------------------------------ |
| §13.1.A Event system       | #9 (bus wildcard segment-prefix semantics) |
| §13.1.B Settings & storage | #10, #11, #12, #13, #14 (all 5 closed)     |

## Decisions made (review-derived)

### §13.1.A — Event system

- **#9 — Bus wildcard semantics:** define as **segment-prefix match**. `'game.*'` matches `'game.start'`, `'game.round-advance'`. Does NOT match `'mini-game.start'` (different namespace) or cross dot boundaries. Spec §4.4 needs ~3 lines of prose. Grep `src/lib/game-event-bus.ts` first to verify code matches spec.

### §13.1.B — Settings & storage

- **#10 — Settings shape: VERIFIED FLAT.** Master `SettingsDoc` (`src/db/schemas/settings.ts`) has all fields top-level — no `audio: {}` nesting. Spec §5.1 was wrong to introduce nesting. **Lock: flatten §5.1 to match reality.** Also reconcile: `voiceName` in spec should align with existing `preferredVoiceURI` field; existing `preferredVoiceDeviceId` exists too.
- **#11 — Types rewrite:** add explicit breaking-change note. PR 1a's `Verbosity = 'off' | 'brief' | 'full'` removed entirely (single-axis model in M1). `TalkativenessPreset = 'quiet' | 'default' | 'chatty'` renamed and revalued to `Talkativeness = 'on-demand' | 'helpful' | 'chatty'`. Migration mapping:
  - `'quiet'` → `'on-demand'` — **semantic shift** (PR 1a `quiet` allowed brief auto-speech at y1-2; M1 `on-demand` means NO auto-speech, taps only).
  - `'default'` → `'helpful'` — same middle position, kid-friendly rename.
  - `'chatty'` → `'chatty'` — unchanged.
- **#12 — speechRate: VERIFIED EXISTS, must preserve.** Master has `speechRate: number` in `SettingsDoc` (range 0.5–2, default 1). Consumed by `useGameTTS.ts:25,33,44,52`, SettingsPanel slider, all test fixtures. Spec adds to `AudioSettings` top-level (after #10 flatten), `WebSpeechSpeaker.speak()` reads `this.settings.speechRate` instead of hardcoded `u.rate = 1`. Migration preserves existing value.
- **#13 — RxDB pattern: use existing `useSettings()` hook.** From `src/db/hooks/useSettings.ts` — observable via `db.settings.findOne(ANONYMOUS_SETTINGS_ID).$` wrapped in `useRxQuery`. Spec §5.5 rewrites to use the hook + `useEffect` to send `SETTINGS_CHANGED`. Don't invent a new pattern.
- **#14 — v4 schema completeness:** show full v4 schema in §5.8, not just deltas. `additionalProperties: false` on master means all fields (existing + new) must be declared.

## Spec / Plan

- **Spec doc:** `docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md` (1583 lines)
- **Open questions section (the 32 findings):** §13.1 at lines 1564–1648
- **M1 plan:** not yet written — comes after spec review wraps

## Key files (master, referenced during review)

- [src/db/schemas/settings.ts](../../src/db/schemas/settings.ts) — current `SettingsDoc` v3 schema, has `speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId`, `additionalProperties: false`
- [src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts) — canonical settings hook pattern (RxJS observable wrapped in `useRxQuery`)
- [src/components/SettingsPanel/SettingsPanel.tsx:36](../../src/components/SettingsPanel/SettingsPanel.tsx) — existing `useSettings()` consumer + speechRate slider at line 118-127
- [src/components/answer-game/useGameTTS.ts:25,33,44,52](../../src/components/answer-game/useGameTTS.ts) — current `speechRate` consumer (threads to utterance `rate`)
- [src/lib/lifecycle-tts/types.ts](../../src/lib/lifecycle-tts/types.ts) — PR 1a pinned types (to be rewritten per #11)
- [src/types/game-events.ts](../../src/types/game-events.ts) — `LifecycleSpeakEvent`, `celebration.*`, `LifecycleEvent` union (already has 11 events from PR 1a)

## Open questions / blockers

- [ ] **§13.1.C Scope & deliverability (4 findings)** — next up: #15 mini-game reserved events ship M1 with zero consumers (remove or justify cost), #16 `lifecycle.tts.played` mechanism ships M1 with only Spec 1b consumer (defer or scope creep), #17 bus rename `:` → `.` bundled with feature work (separate PR or justify), #18 `skin.tts?` layer 2 ships M1 with no consumers
- [ ] **§13.1.D Security & privacy (4 findings, #19–22)**
- [ ] **§13.1.E Design & UX (7 findings, #23–29)**
- [ ] **§13.1.F Product (2 findings, #30–31)**
- [ ] **§13.1.G Implementation gaps (9 findings, #32–40)**
- [ ] After all findings closed: apply locked decisions to spec text (separate commit) + push to PR #391
- [ ] Then move to M1 plan-writing (depends on spec approval)

## Next steps

1. [ ] In a new session, run `/resync`, `cd worktrees/spec-lifecycle-tts-xstate`.
2. [ ] Read this handoff to load context.
3. [ ] Resume `[Q-§13.1.C.N]` walkthrough starting at finding #15. Use the same prose+AskUserQuestion pattern: paste reviewer's finding text + actual spec passages + recommendation, fire 4-question menu, lock based on user choices.
4. [ ] When all 32 findings closed, edit the spec to apply the locked decisions. Commit as `docs(spec): apply ce-doc-review locks #X-Y`. Multiple commits OK per the baby-step rule.
5. [ ] Push to PR #391 (currently 1 commit ahead locally).
6. [ ] After spec approval, invoke `superpowers:writing-plans` for the M1 plan.

## Context to remember

### User preferences (strong, observed multiple times this session)

- **Verify before assuming.** "When you say 'almost certainly,' can you confirm before assuming?" Always grep/read master files before claiming what's there. Don't invent code samples that look plausible — find the actual pattern.
- **One PR with multiple commits** for review checkpoints (per `feedback_commit_as_checkpoint` memory). Per-commit review, not rolling diffs.
- **Section-by-section ack pattern** with `[Q-§X.Y.N]` for findings, `[Q-§X.Y.ack]` for section wrap-up. 4-Q AskUserQuestion cap; multi-turn rounds OK. Per `feedback_section_by_section_review` memory.
- **on-demand | helpful | chatty** for Talkativeness — kid-friendly, NOT canon's `quiet | default | chatty`. Locked in §4.
- **Handoffs go in `docs/handoff/`** — corrected this session; NOT `.claude/handoffs/`.
- **No assumption fields like `voiceName`** — align with existing master conventions (`preferredVoiceURI`).
- **speechRate must be preserved** — existing functionality, can't regress.

### Spec architecture summary (for the resumer)

- **Singleton XState actor** at React Provider root, two parallel sub-machines (speech + soundEffect), priority + throttle queue.
- **Bus pub/sub** for engine-emitted events (`lifecycle.speak` via `executeSideEffects`); direct `useLifecycleTts().send()` for UI-tap actions (`SPEAK_USER`).
- **17 LifecycleEvent values** total (14 fired + 3 reserved for mini-games — `mini-game.start | mini-game.complete | mini-game.skip`).
- **Dot-style bus events** end-to-end (`game.start`, `lifecycle.speak`, etc.) — colon-style on master renamed in PR commits 1–4.
- **`lifecycle.tts.played` event** with `subject?: string | number` payload field — enables Spec 1b phoneme sequencing + UI animation sync.
- **Celebrations entirely deferred to PR 1b+** — no `roundTransition.celebrate` sub-state in M1.
- **WebSpeechSpeaker** carries Chrome 40747712 keepalive, rAF cancel guard, 30s watchdog, voice cache, processLocally filter.

### Memory references applied this session

- `feedback_section_by_section_review` — `[Q-§X.Y.N]` tag pattern
- `feedback_prose_dialogue_for_walkthroughs` — verbose prose when user asks "more context"
- `feedback_full_worktree_paths` — full paths when referencing files
- `feedback_doc_inventory_upfront` — surface doc map before diving
- `feedback_decision_routing` — route decisions to spec/memory/commit appropriately
- `feedback_commit_as_checkpoint` — commits as review checkpoints
- `feedback_confirm_before_memory_save` — propose memory writes before saving
