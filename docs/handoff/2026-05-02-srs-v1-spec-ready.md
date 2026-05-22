# Handoff: SRS v1 spec ready for plan-writing

**Date:** 2026-05-02
**Branch:** claude/suspicious-shockley-d53a5f
**Worktree:** `<project-root>/.claude/worktrees/suspicious-shockley-d53a5f`
**Git status:** 2 unpushed commits, clean working tree
**Last commit:** `503de9e0 docs(srs): incorporate doc-review pass (24 findings)`
**PR:** opened alongside this handoff (link added on push)

## Resume command

```bash
/resync
cd /Users/leocaseiro/Sites/base-skill/.claude/worktrees/suspicious-shockley-d53a5f

# Spec is reviewed and ready. Next step is to write the implementation plan:
/superpowers:writing-plans docs/superpowers/specs/2026-05-01-srs-v1-design.md
```

## Current state

**Task:** Build SRS v1 (spaced-repetition scheduling) for BaseSkill — kid-tuned SM-2 algorithm, rich per-attempt recording, game-agnostic adapter pattern, WordSpell as the v1 integrator.

**Phase:** Brainstorming + spec + multi-persona doc review complete. **Implementation plan NOT yet written.**

**Progress:**

- ✅ Brainstorming session ran end-to-end (6 sections)
- ✅ Spec written and committed: `12ccc2aa docs(srs): add SRS v1 design spec`
- ✅ ce-doc-review ran with 5 personas (coherence, feasibility, product-lens, scope-guardian, adversarial); 24 findings surfaced
- ✅ Walked through all 24 findings; applied agreed fixes; committed: `503de9e0 docs(srs): incorporate doc-review pass`
- ⏳ **Next: invoke `superpowers:writing-plans` skill against the spec to produce the implementation plan**

## What we did (this session, in order)

1. **Brainstormed** the SRS v1 design via the `superpowers:brainstorming` skill. Six sections, each with explicit sign-offs:
   - Section 1: Architecture overview (adapter pattern, file layout, `srs_items` supersedes `word_spell_seen_words`)
   - Section 2: Recording schema (the `srs_attempts` rich event log — flagged by the user as the part that matters most)
   - Section 3: `srs_items` schema + SM-2 algorithm (kid-tuned intervals, lapse forgiveness window)
   - Section 4: Grade derivation rules (decision-time + execution-time split, mistake patterns, TTS replays)
   - Section 5: Round selector (composeSession + in-session re-insertion with predictable session length)
   - Section 6: Integration & migration (feature flag, observability, testing, rollout)
2. **Filed three GH issues** during brainstorming:
   - [#295](https://github.com/leocaseiro/base-skill/issues/295) — Onboarding: placement assessment (cold-start input source)
   - [#296](https://github.com/leocaseiro/base-skill/issues/296) — HUD + scoring: accuracy target follow-up
   - [#297](https://github.com/leocaseiro/base-skill/issues/297) — SRS v2 skill-pattern aggregation
3. **Posted comments on [#257](https://github.com/leocaseiro/base-skill/issues/257)** — first the critical-path note, then the concrete event-publishing requirements (`round-shown`, `first-action`, `mistake`, `tts-played`, `visibility-change`, `round-resolved`).
4. **Wrote the spec** at `docs/superpowers/specs/2026-05-01-srs-v1-design.md`.
5. **Ran `/compound-engineering:ce-doc-review`** with 5 reviewer personas. 24 findings surfaced after dedup.
6. **Walked through every finding** via `AskUserQuestion`. Most were applied; some were skipped or merged into earlier fixes.

## Decisions made (during brainstorming)

- **Algorithm:** SM-2 (not FSRS, not Leitner). Right complexity for v1; deterministic; swap-able later because all input signals are recorded.
- **Game scope:** WordSpell first; foundation game-agnostic. Adapter pattern designed for SortNumbers, NumberMatch, SpotAll, Sort-by-Group, Connect-Answers.
- **Item identity:** `(gameId, contentSource, word, mode, inputMethod)`. Drag and type are **separate items** (revised during doc review).
- **Session entry UX:** Quietly woven into normal play; no separate review screen.
- **Layered v1 vs v2:** Item-SRS in v1; skill-aggregation collections (`srs_skill_state`, `srs_mistake_patterns`) deferred to v2 (revised during doc review).
- **Session shape:** Fixed `totalRounds`. In-session re-insertion displaces queue tail; lapsed items dropped from this session land in SM-2's cross-session schedule (30-min `LAPSE_INTERVAL_MS`).
- **Lapse forgiveness:** 14-day window, only for items that have been correct at least once.
- **Decision-time as grade signal:** Required for grade 5 (automaticity).
- **Mistake patterns:** `multiple-same` → grade 1; `multiple-varied` → grade 2.
- **Per-doc `schemaVersion`:** Yes, on every doc.
- **Feature flags:** Two on `settings` — `srsEnabled` (round-provider injection) + `srsRecordingEnabled` (opt-in pre-flip data capture). Both default false in v1.
- **Profile reset / cloud sync:** Deferred. Not on critical path.
- **Adapter `expectedExecution` / `expectedDecision`:** Profile-relative thresholds (per-kid running median) to avoid penalising slow decoders.
- **Storage retention:** 90 days OR 5,000 attempts per profile, whichever covers more. Long-term history pivots to cloud sync (future work).
- **Adapter contract maturity:** Provisional in v1. Implementation includes a paper-prototype gate against game #2 (likely SortNumbers).

## Spec / artefacts

- **Spec:** `docs/superpowers/specs/2026-05-01-srs-v1-design.md` (committed: `12ccc2aa` then revised in `503de9e0`)
- **Issues filed:** #295, #296, #297
- **Comments posted on:** #257 (twice — context note + event-publishing requirements)

## Open questions / blockers

- [ ] **#257 (`useGameRound`) is a critical-path dependency** for SRS v1. SRS v1 is bundled with WordSpell's adoption of `useGameRound` (#260) per the "Z" ordering decision. Confirm timing of #257 before locking the implementation plan's task ordering.
- [ ] **Plan must include the paper-prototype gate** — before WordSpell's adapter is "done", the implementation work writes a paper sketch of one future adapter (most likely SortNumbers) to stress-test the contract. This is in the spec but should land as an explicit task in the plan.
- [ ] **Plan must mark which spec changes will need updates if soak-period data drives them** — e.g. timing thresholds in `sm2-config.ts` and `round-selector-config.ts` are starting points, not final values.

## Next steps

1. [ ] **Invoke `superpowers:writing-plans`** against the spec to produce the implementation plan. Recommend the plan break the work into phases:
   - Foundation modules (`src/lib/srs/types.ts`, `sm2.ts`, `sm2-config.ts`, `grade-derivation.ts`)
   - Schemas (`src/db/schemas/srs_items.ts`, `srs_attempts.ts`) + `settings` schema bump for the two feature flags + `srsV1MigrationComplete`
   - Round selector (`composeSession` + `handleRoundResolved`)
   - WordSpell adapter (`src/lib/srs/adapters/word-spell.ts`, `word-spell-typing.ts`)
   - Recorder integration (`useSrsRecording`, plumbed via `useGameRound`)
   - Migration from `word_spell_seen_words` (with `dueAt` spread)
   - Settings UI (toggle for `srsEnabled` + parent-PIN-gated advanced page for `srsRecordingEnabled`)
   - Dev inspector (`/dev/srs-inspector`)
   - Paper-prototype gate (SortNumbers adapter sketch)
2. [ ] **Coordinate with #257** — bundling order is "Z" (SRS v1 + WordSpell adoption of `useGameRound` ship together). Plan should reference the events #257 must publish (already documented in the spec).
3. [ ] **Verify the spec passes `yarn lint:md` and `yarn fix:md`** — done as of last commit, but re-verify before any further edits.

## Files in this session (touched)

- `docs/superpowers/specs/2026-05-01-srs-v1-design.md` — the spec (created + revised)
- `.claude/handoffs/2026-05-02-srs-v1-spec-ready.md` — this handoff

## Session metadata

- Brainstorming session messages: ~80 turns total
- Findings reviewed: 24 (5 reviewer personas)
- Findings applied: 17 (some merged into earlier fixes)
- Findings deferred / skipped: 7 (mostly when earlier decisions held or were already resolved)
