# Handoff: M1 TTS Lifecycle Plan — Doc Review Round 2

**Date:** 2026-05-07
**Branch:** docs/plans-323-257
**Worktree:** worktrees/plans-323-257
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/plans-323-257
**Git status:** 1 uncommitted (plan file with review edits)
**Last commit:** a8db84030 docs(plans): add implementation plans for #323 (M1) and #257 (useGameRound)
**PR:** #349 — open

## Resume command

```
/resync
cd worktrees/plans-323-257
# Commit the plan edits, then either resolve Open Questions or start execution
```

## Current state

**Task:** Doc review of M1 TTS Lifecycle implementation plan (#323)
**Phase:** review
**Progress:** Round 2 doc review complete. All findings triaged — applied or deferred to Open Questions.

## What we did

Ran two rounds of `ce-doc-review` (headless) on `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md`. Round 1 (prior session) applied 19 fixes and skipped 1. Round 2 dispatched 5 reviewer agents (coherence, feasibility, adversarial, scope-guardian, design-lens). Of the round 2 findings:

- **3 safe_auto fixes applied silently:** dot-notation typo in Task 14, missing imports in Task 3 Step 5, SpeechOutput.ts added to Modified files table
- **1 P0 fix applied interactively:** `speak()` returns void — added `onEnd` callback to `SpeakOptions`/`buildUtterance()`, updated Task 8's `doSpeak` to use it for `round:tts-played` emission
- **1 additional fix applied:** Removed deprecated `speakPrompt` shim from Task 3's `useGameTTS` rewrite (user confirmed all ~30 callers are migrated in M1)
- **15 findings deferred to Open Questions section** in the plan

## Decisions made

- **`onEnd` callback approach** — Adding `onEnd?: () => void` to `SpeakOptions` and attaching to `utterance.onend` inside `buildUtterance()`. Backward compatible — existing callers are unchanged. Chosen over returning the utterance object because it keeps `speak()` fire-and-forget for existing code.
- **Remove `speakPrompt` entirely in M1** — All ~30 references across 12 files are in files the plan already migrates. No deprecated shim needed.
- **Remaining 15 findings → Open Questions** — User chose to defer rather than walk through each interactively. They range from P1 (AudioButton missing props, type safety gaps, config migration) to P2 (ARIA labels, talkativeness placement, QUIET preset semantics).

## Spec / Plan

- `docs/superpowers/specs/2026-05-03-instructions-tts-lifecycle-design.md` — source spec
- `docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — the reviewed plan (uncommitted edits)
- `docs/superpowers/plans/2026-05-06-use-game-round-extraction.md` — #257 plan (not yet reviewed)

## Key files

- `worktrees/plans-323-257/docs/superpowers/plans/2026-05-06-spec-1a-m1-tts-lifecycle.md` — plan with all edits (uncommitted)
- `src/lib/speech/SpeechOutput.ts` — the `speak()` function being extended with `onEnd`
- `src/components/answer-game/useGameTTS.ts` — current hook being split into `speakAuto`/`speakOnDemand`
- `src/types/game-events.ts` — GameEventType union (needs `round:tts-played` — see Open Questions)
- `src/lib/game-event-bus.ts` — TypedGameEventBus singleton

## Open questions / blockers

All 15 deferred findings are in the plan's "Open Questions" section at the bottom. The highest-priority ones:

- [ ] Task 14 AudioButton missing required `speakOnDemand` + `ttsOnDemandAllowed` props — TypeScript will reject the plan's code as-written
- [ ] `round:tts-played` not in GameEventType union — emitted with `as any` cast in M1
- [ ] Persisted config migration (`ttsEnabled` → `autoSpeak`) — unclear if Dexie schema defaults handle it
- [ ] `useRoundTTS` task dependency ordering — Task 3 Step 5 depends on Task 8's `useLifecycleTTS`
- [ ] Settings-level `ttsEnabled` vs per-game `autoSpeak` precedence not documented

## Next steps

1. [ ] Commit the plan edits (round 1 + round 2 review fixes + Open Questions section)
2. [ ] Decide which Open Questions to resolve before execution vs. defer to executor judgment
3. [ ] Optionally run doc review on `2026-05-06-use-game-round-extraction.md` (#257 plan)
4. [ ] Start execution — `/subagent-driven-development` or `/executing-plans` on the M1 plan

## Context to remember

- Voice notifications were ON during this session (`/voice-notify-me` skill)
- The user prefers deferring findings to Open Questions over walk-through when there are many — they want to triage in bulk, not one-by-one
- The `#257 useGameRound extraction` plan hasn't been reviewed yet — it's on the same branch/PR
