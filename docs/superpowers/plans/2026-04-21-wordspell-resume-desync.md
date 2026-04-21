# WordSpell Resume Desync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the audio/tile mismatch in WordSpell after a session resume, where the spoken `prompt` is from a freshly-generated round and the on-screen tiles are from a stale draft.

**Symptom (confirmed on real device 2026-04-21):** A user resumes an in-progress WordSpell session. The TTS button speaks `"sit"` (round 7 of a freshly regenerated `roundOrder`), but the four answer tiles show `a, n, p, t` — the tiles for round 2 (`"pant"`) of an _earlier_ `roundOrder`. The two state systems (`AnswerGameProvider` reducer and `WordSpellSession`) drift the moment the session resumes.

---

## Root Cause

Confirmed by inspecting the live `session_history_index` doc for the stuck session:

```jsonc
{
  "sessionId": "AsxSr50Y49xeon9noVSyz",
  "seed": "dMse6efjqDcJ4qanftGqY",
  "draftState": {
    "roundIndex": 1, // round 2
    "allTiles": [
      /* a, n, p, t */
    ],
    "zones": [
      /* expectedValue p,a,n,t — i.e. "pant" */
    ],
    "phase": "playing",
  },
  "initialContent": {
    "rounds": [
      {
        "id": "r1",
        "prompt": { "en": "Question 1" },
        "correctAnswer": "A",
      },
      {
        "id": "r2",
        "prompt": { "en": "Question 2" },
        "correctAnswer": "B",
      },
      {
        "id": "r3",
        "prompt": { "en": "Question 3" },
        "correctAnswer": "C",
      },
    ],
  },
}
```

Three independent bugs combine to produce the symptom:

1. **`initialContent` is never populated with WordSpell's real rounds.** It carries the AnswerGame default `Q1/Q2/Q3` / `A/B/C` placeholder fixture. WordSpell creates the session but never writes its actual `roundOrder` to `session_history_index.initialContent`, so resume has no record of what was being played.
2. **WordSpell regenerates `roundOrder` on resume from `seed`.** The seed is preserved (`dMse6efjqDcJ4qanftGqY`), but the source word pool / sampling logic has shifted since the draft was saved (PR #115/#117 era). Same seed → different list → no `"pant"` anywhere in the regenerated `[taps, snap, nip, nits, spits, nit, at, sit]`.
3. **`AnswerGameProvider` skips `INIT_ROUND` when `initialState` is present** (`src/components/answer-game/AnswerGameProvider.tsx:91`). On resume the reducer keeps `draftState.allTiles`/`zones` (frozen at `"pant"`), while WordSpell's session advances independently and feeds `<AudioButton prompt={round.word} />` from the regenerated round.

The integration layer between `WordSpellSession` (which owns `roundOrder` + `currentRoundIndex`) and the `AnswerGame` reducer (which owns `allTiles` + `zones`) does not synchronise on resume.

---

## Proposed Fix (in priority order)

**Primary:** Make WordSpell sessions self-describing. Persist the real `roundOrder` (not the placeholder) into `session_history_index.initialContent` at session start. On resume, **reuse the persisted `roundOrder` instead of regenerating from `seed`**. This fixes the desync regardless of source-pool drift.

**Secondary:** Detect a stale draft and discard it. If the persisted `roundOrder` is missing (legacy sessions) or doesn't include the round identified by `draftState.roundIndex`, drop the draft and start the session fresh from round 0. Surface a one-time toast: "Resumed game couldn't be restored — starting over."

**Tertiary:** Add an architectural assertion. `WordSpellSession` should dispatch `INIT_ROUND` (or a new resume-specific action) into the AnswerGame reducer with the resumed `roundIndex`'s tiles + zones, so the two state machines never diverge.

The primary fix alone is sufficient to close the bug. The secondary is a safety net for the existing stuck sessions (already on devices). The tertiary hardens the integration so a future PR cannot reintroduce the desync.

---

## Architecture

```
                       ┌──────────────────────────────────────┐
                       │ session_history_index doc (resumed)  │
                       │   .seed                              │
                       │   .initialContent.rounds  ← NEW: real roundOrder │
                       │   .draftState.roundIndex             │
                       │   .draftState.allTiles, .zones       │
                       └──────────────┬───────────────────────┘
                                      │ load
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │ $gameId.tsx (route)                     │
                    │   reads .initialContent, .draftState    │
                    └──────────────┬──────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────────┐
                    │ WordSpellSession                        │
                    │   if (initialContent.rounds is real)    │
                    │     roundOrder = initialContent.rounds  │
                    │   else                                  │
                    │     roundOrder = generateFromSeed(seed) │
                    │     persist roundOrder → initialContent │
                    └──────────────┬──────────────────────────┘
                                   │ dispatch INIT_ROUND on mount
                                   ▼  (with tiles/zones for current round)
                    ┌─────────────────────────────────────────┐
                    │ AnswerGameProvider reducer              │
                    │   allTiles, zones reflect current round │
                    └─────────────────────────────────────────┘
```

---

## Pre-flight

Before starting:

- [ ] **Verify worktree.** Confirm `pwd` ends with `worktrees/fix-wordspell-resume-desync` (or similar). All work happens on a fresh branch off `master`; never edit `master` directly.
- [ ] **Sync.** Run `git fetch origin master && git log --oneline -3 origin/master`. Confirm PR #127 (DM4 recovery) is merged so this branch isn't blocked by boot failures during e2e.
- [ ] **Install.** `yarn install` if needed.
- [ ] **Baseline.** `yarn vitest run src/games/word-spell src/components/answer-game src/db` should be green before changes.
- [ ] **Capture a stuck session.** Save the `session_history_index` doc from the repro device (or use the JSON in `Root Cause` above) into `e2e/fixtures/wordspell-resume-stale-draft.json` for the regression e2e.

---

## Task 1: Persist real `roundOrder` into `session_history_index.initialContent`

Make WordSpell write its computed `roundOrder` into the session's `initialContent` at session start, so the data is self-describing.

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (or wherever the session is first created — find with `grep -rn "initialContent" src/games/word-spell src/routes/\$locale/_app/game`)
- Modify: `src/routes/$locale/_app/game/$gameId.tsx` (the place where `session_history_index` rows are inserted)
- Modify: `src/db/schemas/session_history_index.ts` (no schema change expected — `initialContent` is already `Record<string, unknown>` — but **verify**; if the new shape isn't representable, plan a v3 migration)
- Add: `src/games/word-spell/__fixtures__/round-order.ts` (shared fixture builder for tests)

- [ ] **Step 1: Failing unit test.** Add a test that creates a WordSpell session and asserts `session_history_index.initialContent.rounds` equals the freshly computed `roundOrder` (not placeholders). Place it next to the session-creation code (likely `src/routes/$locale/_app/game/$gameId.test.tsx` or a new `src/games/word-spell/word-spell-session.test.ts`).
- [ ] **Step 2: Implement.** Pass the real `roundOrder` through to wherever `session_history_index.insert` is called. Drop the placeholder `[r1/r2/r3 → A/B/C]` defaults for WordSpell's path. Test goes green.
- [ ] **Step 3: Don't break NumberMatch.** Run the NumberMatch unit + e2e suites; assert their `initialContent` shape is unaffected.

## Task 2: On resume, prefer persisted `roundOrder` over seed regeneration

When a session resumes, use `initialContent.rounds` as the authoritative `roundOrder` rather than recomputing from `seed`.

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (the `roundOrder` derivation)

- [ ] **Step 4: Failing test.** Resume a session whose persisted `initialContent.rounds` differs from what the current word-pool + seed would produce. Assert the resumed `roundOrder` matches the persisted one.
- [ ] **Step 5: Implement.** If `initialContent.rounds` looks like real WordSpell content (has `word` / `letters` / etc., not the placeholder `correctAnswer: 'A'` shape), use it. Otherwise fall back to seed-regeneration (legacy sessions — handled by Task 4).
- [ ] **Step 6: Verify draft alignment.** Add an assertion that `draftState.allTiles` corresponds to `roundOrder[draftState.roundIndex]` (sorted-letters equality). If the assertion fails, fall through to Task 4 (discard draft). This is the safety check that prevents the original symptom even if Task 1's persistence is somehow skipped.

## Task 3: Synchronise `AnswerGameProvider` reducer on resume

When `WordSpellSession` mounts with a resumed draft, dispatch `INIT_ROUND` (or a new `RESUME_ROUND` action) with the tiles/zones for the resumed `roundIndex`. The reducer's "skip INIT_ROUND when `initialState` is present" guard becomes "skip only when the draft tiles/zones are still consistent with the current round."

**Files:**

- Modify: `src/components/answer-game/AnswerGameProvider.tsx`
- Modify: `src/components/answer-game/answer-game-reducer.ts` (if a new action is needed)
- Modify: `src/components/answer-game/types.ts`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (the dispatch site on resume)

- [ ] **Step 7: Failing reducer test.** Add a test in `answer-game-reducer.test.ts` for the new resume action (or for `INIT_ROUND` running after `buildStateFromDraft`).
- [ ] **Step 8: Failing provider test.** Add an `AnswerGameProvider.test.tsx` case that mounts with `initialState` _and_ stale tiles, then verifies the resume effect overwrites `allTiles` with the correct ones for the resumed round.
- [ ] **Step 9: Implement.** Update the provider effect to dispatch when needed. Tests go green.

## Task 4: Discard incompatible drafts (safety net for legacy sessions)

For sessions with placeholder `initialContent` (i.e. created before Task 1 ships), the alignment check from Step 6 will fail. In that case, drop the draft and start the session at round 0.

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx` (or its loader)
- Modify: i18n: `public/locales/en/common.json` and `public/locales/pt-BR/common.json` (toast string)

- [ ] **Step 10: Failing test.** Resume a session with the user's actual fixture (placeholder `initialContent`, `draftState` for `"pant"`). Assert `draftState` is cleared and the session starts at `roundIndex = 0`.
- [ ] **Step 11: Implement.** Detect the stale draft (placeholder shape OR letter-mismatch), null-out `draftState`, write the cleared draft back via `incrementalPatch`, surface a one-time toast.

## Task 5: Regression e2e

End-to-end test that mirrors the bug exactly.

**Files:**

- Create: `e2e/wordspell-resume-desync.spec.ts`
- Create: `e2e/fixtures/wordspell-resume-stale-draft.json` (the captured `session_history_index` doc)

- [ ] **Step 12: Failing e2e.** Seed `session_history_index` with the fixture, navigate to `/en/game/word-spell`, click Audio, assert the spoken `prompt` matches `roundOrder[draftState.roundIndex].word` AND the rendered tiles' sorted letters equal that word's sorted letters.
- [ ] **Step 13: Verify it passes after Tasks 1–4** are implemented.

## Task 6: Architecture docs (required by `CLAUDE.md`)

Per `CLAUDE.md`: changes touching `src/components/answer-game/` or `*reducer*` files must update co-located `.mdx` docs.

- [ ] **Step 14:** Update `src/components/answer-game/answer-game-reducer.mdx` (or co-located mdx) describing the new resume action and the alignment invariant. Run `yarn fix:md`.

---

## Acceptance Criteria

- [ ] New WordSpell sessions persist their real `roundOrder` to `session_history_index.initialContent`.
- [ ] Resumed WordSpell sessions render tiles whose sorted letters equal the spoken word's sorted letters — for every round, deterministically.
- [ ] Existing stuck sessions (placeholder `initialContent`) self-recover by clearing the draft on resume; no DevTools intervention required.
- [ ] No regression in NumberMatch or other AnswerGame consumers.
- [ ] All new tests + the regression e2e pass.
- [ ] `yarn typecheck`, `yarn lint`, `yarn lint:md` clean.

## Out of Scope

- Word-pool drift detection / migration of all historic sessions. We only handle the live resume; archived sessions stay as-is.
- Generalising the resume invariant to other games beyond WordSpell. NumberMatch may have similar latent risk; covered in a separate audit.
- Server-side replay of `seed` → `roundOrder` (we don't have a server). Determinism is local-storage only.
