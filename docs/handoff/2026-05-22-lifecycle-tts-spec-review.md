# Handoff: Lifecycle TTS spec — ce-doc-review walkthrough in progress

**Date:** 2026-05-23 (resumed from 2026-05-22 session)
**Branch:** `docs/spec-lifecycle-tts-xstate`
**Worktree:** `worktrees/spec-lifecycle-tts-xstate`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/spec-lifecycle-tts-xstate`
**Git status:** clean / pushed (no local-ahead commits)
**Last commit:** `bba3bd381 docs(spec): apply ce-doc-review §13.1.A+B+C locks (10 findings closed)`
**PR:** [#391](https://github.com/leocaseiro/base-skill/pull/391) — open, head `bba3bd381`

## Resume command

```bash
/resync
cd worktrees/spec-lifecycle-tts-xstate
# Next: continue ce-doc-review walkthrough at §13.1.D (Security & privacy, findings #19-22)
# Spec doc: docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md
# 10 of 32 findings closed (§13.1.A + §13.1.B + §13.1.C); 22 remaining
```

## Current state

**Task:** Section-by-section walkthrough of 32 ce-doc-review findings on the M1 lifecycle-tts spec.
**Phase:** Review (spec drafted + reviewed + iteratively closing findings + applying locks).
**Progress:** **10 of 32 findings closed** (§13.1.A + §13.1.B + §13.1.C all locked and applied to spec).

## What we did

### Session 1 (2026-05-22)

1. Designed the M1 lifecycle-tts spec end-to-end through ~30 turns of section-by-section conversation (§§4–9 of the spec).
2. Wrote it to disk at [docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md](../superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md) (originally 1583 lines), opened PR #382 (later replaced by #391 after rework).
3. Filed 7 follow-up GH issues (#383–#389) + commented on #230.
4. Ran ce-doc-review which produced 32 findings (#9–#40). **Note:** findings text never persisted into spec — only their titles survive in handoff line 78 + this updated decisions list. If resuming §13.1.D-G, reconstruct findings from this handoff's remaining-findings line + spec context.
5. Walked findings §13.1.A (#9) + §13.1.B (#10-14) one-by-one with the user using `[Q-§13.1.N]` tagged AskUserQuestion menus. **6 of 32 closed.**

### Session 2 (2026-05-23 — this session)

1. Resumed from handoff. Walked §13.1.C findings #15-#18 using the same prose+AUQ pattern. **4 more closed → 10 of 32.**
2. Captured a new durable rule: M1 scope philosophy (see project memory `project_m1_scope_philosophy.md`).
3. Applied all 10 locks (§13.1.A + B + C) to the spec as one checkpoint commit `bba3bd381` (+231 / −71 lines).
4. Rebased onto remotely-resync'd branch (which had picked up #407 handoff-skill fix, #408 handoff migration, v0.34.1) and pushed cleanly without force.

## Decisions made (review-derived, all 10 locks)

### §13.1.A — Event system

- **#9 — Bus wildcard semantics:** define as **segment-prefix match**. `'game.*'` matches `'game.start'`, `'game.round-advance'`. Does NOT match `'mini-game.start'` (different namespace) or cross dot boundaries. Spec §4.4 has ~5 lines of prose + explicit flag that master's `TypedGameEventBus` ([src/lib/game-event-bus.ts](../../src/lib/game-event-bus.ts)) currently uses literal magic string `'game:*'` — commit #2 in §11.4 must add real segment-prefix matching. **Applied.**

### §13.1.B — Settings & storage

- **#10 — Settings shape FLAT:** Master `SettingsDoc` ([src/db/schemas/settings.ts](../../src/db/schemas/settings.ts)) has all fields top-level — no `audio: {}` nesting. Spec §5.1 was wrong to introduce nesting. **Locked + applied:** dissolved `AudioSettings` and `Settings` wrappers. Introduced `TtsSettings = Pick<SettingsDoc, ...>` focused type for actor/speaker consumers. Cascading edits in §6.1, §7.1, §7.2, §8.1, §11.3 to remove all `.audio.` nesting, `AudioSettings`, `voiceName`, `voiceLocale` references.
- **#11 — Types rewrite:** explicit breaking-change note. PR 1a's `Verbosity = 'off' | 'brief' | 'full'` removed entirely. `TalkativenessPreset = 'quiet' | 'default' | 'chatty'` renamed and revalued to `Talkativeness = 'on-demand' | 'helpful' | 'chatty'`. Migration mapping in §5.1 with semantic-shift call-out for `'quiet'` → `'on-demand'` (no auto-speech ever, taps only). **Applied.**
- **#12 — speechRate preserved:** Master has `speechRate: number` in `SettingsDoc` (range 0.5–2, default 1). Consumed by [useGameTTS.ts:25,33,44,52](../../src/components/answer-game/useGameTTS.ts), SettingsPanel slider, all test fixtures. Spec adds to `TtsSettings`; `WebSpeechSpeaker.speak()` now reads `u.rate = this.settings.speechRate ?? 1` instead of hardcoded `u.rate = 1`. **Applied.**
- **#13 — RxDB pattern: use existing `useSettings()` hook.** From [src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts) — observable via `db.settings.findOne(ANONYMOUS_SETTINGS_ID).$` wrapped in `useRxQuery`. Spec §5.5 rewritten to use the hook + `useEffect` to send `SETTINGS_CHANGED` with `pickTtsSettings(settings)`. No invented `settingsStore.subscribe(...)` pattern. **Applied.**
- **#14 — v4 schema completeness:** §5.8 shows full v4 schema (every field declared explicitly because `additionalProperties: false` on master). Migration strategy preserves all existing fields via `...rest`; only the `ttsEnabled` → `talkativeness` mapping is special-cased. **Applied.**

### §13.1.C — Scope & deliverability

- **#15 — `mini-game.*` reserved events:** **Keep all** (status quo). M1 ships union values + §10.4 reservations subsection + priority/throttle entries. Justification added at §10.4: locks dismissal contract (`bus.emit({ type: 'lifecycle.cancel' })`), event taxonomy, and default priorities so PR 1b+ adds firing code without relitigating under time pressure. Mini-game integration is one of the 4 M1 core goals. **Applied.**
- **#16 — `lifecycle.tts.played` mechanism:** **Keep all + Reviewer note callout.** Event ships M1 (real consumer: SRS recorder per issue #364 P1 milestone — `src/lib/srs/recorder.ts` subscribes for play-count signal). Forward-looking docs (§10.2 state-machine flow control, §10.3 animation sync with `useTileHighlight` example) describe Spec 1b consumers but stay in M1 spec as architectural ADRs (payload shape rationale for `subject` + `durationMs`). Added explicit "Reviewer note — M1 scope philosophy" callout at top of §10 explaining the 4 M1 core goals and why comprehensive forward-looking content is intentional. **Applied.**
- **#17 — Bus colon→dot rename bundled:** **Keep bundled** in commits 1–4 of the 25-commit M1 PR. Justification appended to §11.1: rename is mechanical (no semantic change beyond segment-prefix wildcard upgrade in commit 2), each commit leaves CI green, splitting would force rebase of 21 functional commits, `chore(bus):` prefix visually distinguishes from `feat(*):`. **Applied.**
- **#18 — `skin.tts?` resolver layer 2:** **Keep as-is + clarity sentence.** §9.2 layer chain unchanged (4 layers, layer 2 = `skin.tts?.[event]`). Added clarity: in M1 `layers.skin` is always undefined; fall-through is one branch in already-pure resolver; reserving layer now means M3 skin feature is purely additive (no resolver refactor, no type-shape change). Skin customization is one of the 4 M1 core goals. **Applied.**

## Memory written this session

- **[`project_m1_scope_philosophy.md`](../../../../.claude/projects/-Users-leocaseiro-Sites-base-skill/memory/project_m1_scope_philosophy.md)** — durable rule: reviewer YAGNI on M1 work only counts when feature is **outside the 4 core M1 goals** (XState migration, skin customization, SRS prep, mini-game integration). Inside those goals, prefer comprehensive in-spec rationale + forward-looking ADRs. PR size and review difficulty are not reasons to cut. Linked to [[feedback_ideal_patterns_directive]] (code-side equivalent).

## Spec / Plan

- **Spec doc:** [docs/superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md](../superpowers/specs/2026-05-16-lifecycle-tts-xstate-design.md) (now ~1742 lines after locks; was 1583)
- **§13 Open Questions table:** lines 1685–1700 (8 deferred items — unchanged)
- **§13.1 findings list:** was never persisted into spec; reconstruct from this handoff + spec context if needed
- **M1 plan:** not yet written — comes after spec review wraps

## Key files (master, referenced during review)

- [src/db/schemas/settings.ts](../../src/db/schemas/settings.ts) — current `SettingsDoc` v3 schema, has `speechRate`, `preferredVoiceURI`, `preferredVoiceDeviceId`, `additionalProperties: false`
- [src/db/hooks/useSettings.ts](../../src/db/hooks/useSettings.ts) — canonical settings hook pattern (RxJS observable wrapped in `useRxQuery`); `DEFAULT_SETTINGS` needs `talkativeness` + `processLocally` additions per §5.2
- [src/components/SettingsPanel/SettingsPanel.tsx:36](../../src/components/SettingsPanel/SettingsPanel.tsx) — existing `useSettings()` consumer + speechRate slider at line 118-127
- [src/components/answer-game/useGameTTS.ts:25,33,44,52](../../src/components/answer-game/useGameTTS.ts) — current `speechRate` consumer (threads to utterance `rate`)
- [src/lib/lifecycle-tts/types.ts](../../src/lib/lifecycle-tts/types.ts) — PR 1a pinned types (rewritten per #11; introduce `TtsSettings = Pick<SettingsDoc, ...>` here)
- [src/types/game-events.ts](../../src/types/game-events.ts) — `LifecycleSpeakEvent`, `celebration.*`, `LifecycleEvent` union (already has 11 events from PR 1a; M1 PR commit 1 renames colon → dot in this file)
- [src/lib/game-event-bus.ts](../../src/lib/game-event-bus.ts) — `TypedGameEventBus` uses literal `'game:*'` magic string; commit 2 must add segment-prefix matching for arbitrary `<namespace>.*` subscriptions

## Open questions / blockers (22 remaining findings)

- [ ] **§13.1.D Security & privacy (4 findings, #19–22)** — next up
- [ ] **§13.1.E Design & UX (7 findings, #23–29)**
- [ ] **§13.1.F Product (2 findings, #30–31)**
- [ ] **§13.1.G Implementation gaps (9 findings, #32–40)**
- [ ] After all 32 findings closed: M1 plan-writing (depends on spec approval). Per `superpowers:writing-plans`.

## Next steps

1. [ ] In a new session, run `/resync`, `cd worktrees/spec-lifecycle-tts-xstate`.
2. [ ] Read this handoff to load context.
3. [ ] Resume `[Q-§13.1.D.N]` walkthrough starting at finding #19. Same prose+AskUserQuestion pattern.
4. [ ] After each section closes, decide: apply locks immediately (per `feedback_commit_as_checkpoint`) or batch and apply at end of all 22 findings.
5. [ ] When all 32 findings closed, final spec edits + commit `docs(spec): apply ce-doc-review §13.1.D+E+F+G locks`.
6. [ ] Push to PR [#391](https://github.com/leocaseiro/base-skill/pull/391).
7. [ ] After spec approval, invoke `superpowers:writing-plans` for the M1 plan.

## Context to remember

### User preferences (strong, observed across both sessions)

- **Verify before assuming.** "When you say 'almost certainly,' can you confirm before assuming?" Always grep/read master files before claiming what's there. Don't invent code samples that look plausible — find the actual pattern.
- **M1 scope philosophy** (codified this session as `project_m1_scope_philosophy.md`): reviewer YAGNI only counts when outside the 4 core M1 goals (XState, skin, SRS, mini-games). PR size not a reason to cut. Forward-looking ADRs are kept by design.
- **One PR with multiple commits** for review checkpoints (per `feedback_commit_as_checkpoint`). Per-commit review, not rolling diffs.
- **Section-by-section ack pattern** with `[Q-§X.Y.N]` for findings, `[Q-§X.Y.ack]` for section wrap-up. 4-Q AskUserQuestion cap; multi-turn rounds OK. Per `feedback_section_by_section_review`.
- **Push freely for feature specs** per `feedback_confirm_before_push` (this is a spec/feature PR, not a bug fix).
- **on-demand | helpful | chatty** for Talkativeness — kid-friendly, NOT canon's `quiet | default | chatty`. Locked in §4.
- **Handoffs go in `docs/handoff/`** (not `.claude/handoffs/`). Per #407 handoff-skill fix shipped in this branch's resync.
- **No assumption fields like `voiceName`** — align with existing master conventions (`preferredVoiceURI`).
- **speechRate must be preserved** — existing functionality, can't regress. Now wired through `TtsSettings`.

### Spec architecture summary (for the resumer)

- **Singleton XState actor** at React Provider root, two parallel sub-machines (speech + soundEffect), priority + throttle queue.
- **Bus pub/sub** for engine-emitted events (`lifecycle.speak` via `executeSideEffects`); direct `useLifecycleTts().send()` for UI-tap actions (`SPEAK_USER`).
- **17 LifecycleEvent values** total (14 fired + 3 reserved for mini-games — `mini-game.start | mini-game.complete | mini-game.skip`).
- **Dot-style bus events** end-to-end (`game.start`, `lifecycle.speak`, etc.) — colon-style on master renamed in PR commits 1–4 (commit 2 also adds segment-prefix wildcard matching).
- **`lifecycle.tts.played` event** with `subject?: string | number` payload field — M1 consumer = SRS recorder; Spec 1b adds phoneme sequencing + UI animation consumers.
- **Celebrations entirely deferred to PR 1b+** — no `roundTransition.celebrate` sub-state in M1.
- **WebSpeechSpeaker** carries Chrome 40747712 keepalive, rAF cancel guard, 30s watchdog, voice cache, processLocally filter, **speechRate preservation**.
- **Flat `SettingsDoc`** (master enforced) with M1 additions `talkativeness` + `processLocally` at top level; consumers use `TtsSettings = Pick<SettingsDoc, ...>` focused type.

### Memory references applied this session

- `feedback_section_by_section_review` — `[Q-§X.Y.N]` tag pattern
- `feedback_prose_dialogue_for_walkthroughs` — verbose prose when user asks "more context"
- `feedback_full_worktree_paths` — full paths when referencing files
- `feedback_doc_inventory_upfront` — surface doc map before diving
- `feedback_decision_routing` — route decisions to spec/memory/commit appropriately
- `feedback_commit_as_checkpoint` — commits as review checkpoints
- `feedback_confirm_before_memory_save` — propose memory writes before saving
- `feedback_batch_related_questions` — group related decisions in one AUQ
- `feedback_doc_review_batched_protocol` — bulk preview before applying spec edits
- `feedback_ideal_patterns_directive` — code-side equivalent of new M1 scope philosophy
- **`project_m1_scope_philosophy`** (NEW this session) — 4 M1 core goals + comprehensive spec preference
