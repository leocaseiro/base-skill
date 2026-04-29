# Handoff: WordSpell saved config has selectedUnits L4 but source.filter L1 — needs configMode wiring

**Date:** 2026-04-29
**Branch:** feat/issue-216
**Worktree:** `worktrees/feat-issue-216`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat-issue-216`
**Git status:** clean (last commit `01fb3cd0` — soft-c fix)
**Last commit:** `01fb3cd0` fix(word-spell): use graphemesRequired (pair-based) so soft-c doesn't pull L1 s-words
**PR:** #219 — open — <https://github.com/leocaseiro/base-skill/pull/219>

## Resume command

```bash
/resync
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-issue-216
yarn dev
# Then: write a failing test that reproduces the saved-config drift,
# then fix the root cause (option A or B below), commit, push.
```

## Current state

**Task:** Close out PR #219. The cumulative-Y filter, audit invariant, soft-c fix, levels.ts reconcile, and triStateForLevel cleanup are all merged into `feat/issue-216` and tests pass (1566/1566).

**Open bug:** During manual smoke-test on the deployed PR preview, words like `it`, `an`, `pits`, `spits` (pure L1) appear in WordSpell rounds even after the user has selected only Level 4 chips in the picker.

**Phase:** debugging a save-side bug. Soft-c collision was a red herring for the symptom the user observed; the soft-c fix is correct but doesn't cover this case.

## What I diagnosed

The IDB dump at `scripts/dev/dump-2026-04-29_14h16.json` (on master) is the smoking gun. The `__last_session__` saved config has:

```jsonc
"config": {
  // ...
  "selectedUnits": [
    { "g": "sh", "p": "ʃ" }, { "g": "ch", "p": "tʃ" }, { "g": "th", "p": "θ" },
    { "g": "th", "p": "ð" }, { "g": "qu", "p": "kw" }, { "g": "ng", "p": "ŋ" },
    { "g": "wh", "p": "w" }, { "g": "ph", "p": "f" }, { "g": "g", "p": "dʒ" },
    { "g": "c", "p": "s" },
    { "g": "e", "p": "" }, { "g": "f", "p": "" }, { "g": "l", "p": "" }
  ],
  "source": {
    "filter": {
      "graphemesAllowed": [s, a, t, p, i, n],         // ← L1 only
      "phonemesRequired": ["s","æ","t","p","ɪ","n"]   // ← L1 only, pre-fix shape
    }
  }
  // NO `configMode: 'simple'`
}
```

`selectedUnits` is correct (L4 + silent letters). `source.filter` is the L1 default from `DEFAULT_RECALL_CONFIG` and was never recomputed when `selectedUnits` changed. The game pulls rounds from `source.filter`, so it sees L1 graphemes only and emits L1 words.

## Root cause

`resolveWordSpellConfig` in `src/routes/$locale/_app/game/$gameId.tsx:210-277` only re-derives `source.filter` from `selectedUnits` when the saved config has `configMode: 'simple'`. The `__last_session__` config does NOT have `configMode` set, so it falls into the **advanced** branch (line 246-261), which spreads the saved config as-is over `DEFAULT_RECALL_CONFIG` — keeping the stale `source.filter` and the up-to-date `selectedUnits` side by side.

Two upstream contributors:

1. **`DEFAULT_RECALL_CONFIG`** at `$gameId.tsx:98-117` does not set `configMode: 'simple'` and uses the pre-fix `phonemesRequired` filter shape. The default config is what the user starts with on a fresh load.
2. **`onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}`** at `$gameId.tsx:465` calls `resolveWordSpellConfig` on every picker change, but `c` already has no `configMode`, so it stays in the advanced branch forever.

`usePersistLastGameConfig` (the IDB writer at `src/db/hooks/usePersistLastGameConfig.ts`) writes whatever `cfg` is — it isn't the bug source.

## Decisions made

- **`configMode: 'simple'` is the marker.** Setting it on the default config + on any picker-driven path will route the resolver through `resolveSimpleConfig`, which recomputes `source.filter` from `selectedUnits` and emits the post-fix `graphemesRequired` shape.
- **Don't touch `usePersistLastGameConfig`** — the persistence layer is correct; we just need to feed it a fresh resolution.
- **Keep TDD discipline (CLAUDE.md):** start with a failing test that asserts a saved config with `selectedUnits=L4 + source.filter=L1` resolves to a config with `source.filter=L4 cumulative + graphemesRequired=L4 pairs` after `resolveWordSpellConfig`.

## Spec / Plan

- Spec: `docs/superpowers/specs/2026-04-29-wordspell-cumulative-y-filter-design.md`
- Plan: `docs/superpowers/plans/2026-04-29-wordspell-cumulative-y-filter.md` (Tasks 11–13 still mention manual VR + smoke; merge this fix before checking those off)

## Key files

- `src/routes/$locale/_app/game/$gameId.tsx:98` — `DEFAULT_RECALL_CONFIG` (needs `configMode: 'simple'` and the post-fix filter shape)
- `src/routes/$locale/_app/game/$gameId.tsx:210` — `resolveWordSpellConfig` (the dispatch that picks simple vs advanced)
- `src/routes/$locale/_app/game/$gameId.tsx:232` — the simple-mode branch that calls `resolveWordSpellSimpleConfig`
- `src/routes/$locale/_app/game/$gameId.tsx:246` — the advanced branch that does the spread merge (the bug surfaces here)
- `src/routes/$locale/_app/game/$gameId.tsx:465` — `onConfigChange` in InstructionsOverlay
- `src/games/word-spell/resolve-simple-config.ts:37` — `resolveSimpleConfig` (already correct after `01fb3cd0`)
- `src/db/hooks/usePersistLastGameConfig.ts` — the IDB writer (correct, no changes needed)
- `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts` — existing test for `resolveWordSpellConfig`. Add the regression test here.

## Next steps

### Step 1 — Reproduce with a failing test (TDD red)

In `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts`, add:

```ts
it('regression: re-derives source.filter from selectedUnits when saved has stale advanced source', () => {
  const saved = {
    component: 'WordSpell',
    inputMethod: 'drag',
    mode: 'recall',
    // selectedUnits is current (L4) but source.filter is stale (L1) — the
    // shape we observed in __last_session__ during PR #219 manual smoke test.
    selectedUnits: [
      { g: 'sh', p: 'ʃ' },
      { g: 'ch', p: 'tʃ' },
      { g: 'th', p: 'θ' },
      { g: 'th', p: 'ð' },
      { g: 'qu', p: 'kw' },
      { g: 'ng', p: 'ŋ' },
      { g: 'wh', p: 'w' },
      { g: 'ph', p: 'f' },
      { g: 'g', p: 'dʒ' },
      { g: 'c', p: 's' },
    ],
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        graphemesAllowed: [
          { g: 's', p: 's' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
          { g: 'p', p: 'p' },
          { g: 'i', p: 'ɪ' },
          { g: 'n', p: 'n' },
        ],
        phonemesRequired: ['s', 'æ', 't', 'p', 'ɪ', 'n'],
      },
    },
  };

  const resolved = resolveWordSpellConfig(saved);

  // Filter must reflect the L4 selection, not the stale L1 default.
  const required = resolved.source?.filter.graphemesRequired ?? [];
  expect(required.some((u) => u.g === 'sh' && u.p === 'ʃ')).toBe(true);
  expect(required.some((u) => u.g === 'c' && u.p === 's')).toBe(true);

  // No phonemesRequired in the post-fix shape.
  expect(resolved.source?.filter.phonemesRequired).toBeUndefined();

  // Cumulative pool must include L4 pairs.
  const allowed = resolved.source?.filter.graphemesAllowed ?? [];
  expect(allowed.some((u) => u.g === 'sh' && u.p === 'ʃ')).toBe(true);
});
```

Run `yarn vitest run src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts` — it MUST fail.

### Step 2 — Fix (TDD green)

Two viable fixes; pick A unless something obvious blocks it:

**A. Make `selectedUnits` an automatic simple-mode signal.** In `resolveWordSpellConfig` (`$gameId.tsx:210`), change line 232:

```ts
// before
if (saved.configMode === 'simple') {

// after
if (saved.configMode === 'simple' || Array.isArray(saved.selectedUnits)) {
```

Rationale: any saved config that has `selectedUnits` is conceptually a simple-mode config — the picker produced it. Routing through `resolveSimpleConfig` recomputes `source.filter` from `selectedUnits` and emits the post-fix `graphemesRequired` shape every time.

**B. Set `configMode: 'simple'` on `DEFAULT_RECALL_CONFIG`** and on the resolver's advanced merge so future saves carry the marker. Less robust because in-flight saved configs without the marker still drift.

Either way, also update `DEFAULT_RECALL_CONFIG` (`$gameId.tsx:98`) to use the post-fix shape:

```ts
// before
filter: {
  region: 'aus',
  graphemesAllowed: cumulativeGraphemes(1),
  phonemesRequired: defaultSelection().map((u) => u.p),
},

// after
filter: {
  region: 'aus',
  graphemesAllowed: cumulativeGraphemes(1),
  graphemesRequired: defaultSelection().map((u) => ({ g: u.g, p: u.p })),
},
```

This kills the last `phonemesRequired` user in production code.

### Step 3 — Verify

- `yarn vitest run` — all 1566 tests + the new regression test green.
- `yarn typecheck` — clean.
- `yarn lint` — clean.
- Hard-test on local dev: `yarn dev`, open WordSpell, untick L1 chips, tick L4, start a round. Words should be from L4 (ship, chip, fish, dish, …), zero L1 leakage.
- Hard-test on the PR preview after the next push lands and CI rebuilds (~10 min): clear site data + reload, repeat the manual flow.

### Step 4 — Commit

```bash
git add src/routes/\$locale/_app/game/\$gameId.tsx \
        src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts
git commit -m "fix(word-spell): re-derive source.filter from selectedUnits on every resolve

Saved __last_session__ configs lacked configMode='simple', so
resolveWordSpellConfig fell into the advanced branch and never
re-derived source.filter from selectedUnits. Result: picker showed
L4 chips selected, but the persisted source.filter stayed at the
L1 default and the game produced L1 words.

Treat any config with selectedUnits as simple-mode and route through
resolveSimpleConfig so source.filter always reflects the picker.
Also migrate DEFAULT_RECALL_CONFIG to the post-fix graphemesRequired
shape — last phonemesRequired user removed from production code.

Regression test in resolveWordSpellConfig.test.ts."
```

### Step 5 — Push

```bash
git push origin feat/issue-216
```

PR #219 will rebuild the preview at `https://leocaseiro.github.io/base-skill/pr/219/app/en/game/word-spell` ~10 min after push lands.

## Open questions / blockers

- [ ] The user's IDB still has the stale `__last_session__` doc with `phonemesRequired` populated. Even after the fix lands, **users with existing browser state need to clear site data + hard-reload** OR the fix needs an in-place migration that detects pre-fix saved configs and rewrites them. Decide before merge: (a) doc the clear-site-data step in the PR, or (b) write a migration in `useCustomGames.ts` that detects `phonemesRequired && selectedUnits` and re-resolves.

## Context to remember

- **PR #219 stays open.** All commits land on `feat/issue-216`. No new PR.
- **Push policy on this branch:** push freely (feature work, not bug-fix branch). Per memory `feedback_confirm_before_push.md`.
- **Follow-up issues already opened** (do NOT bundle into this PR):
  - #231 — add silent-letter L9 words (know, knife, lamb, sign, etc.) — `enhancement`
  - #232 — re-encode doubled consonants as digraphs (`(ss,s)` etc.) — `priority:high`, `tech-debt`
  - Both are tracked at <https://github.com/leocaseiro/base-skill/issues>.
- **The dev-tools dump script** lives at `scripts/dev/dump-db.js` on master (the user's local checkout). It reads RxDB IDB collections, parses signatures, classifies pre-fix vs post-fix bundles, and copies a JSON dump to clipboard. Useful for repro / verification — paste into DevTools console while on the deployed PR preview.
- **Soft-c fix (`01fb3cd0`) is correct** and shipped. It eliminates the case where pure-L1 words leak in when only L4 is selected (e.g. `taps` via the soft-c phoneme collision). The current bug is a separate save-side issue.
- **Manual smoke test (Task 13 in the plan)** is still pending — Docker not available locally, dev-server scenarios not yet driven. After the fix lands and the user verifies on the PR preview, the smoke-test boxes can be ticked.
