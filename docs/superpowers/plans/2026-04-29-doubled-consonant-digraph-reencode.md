# Doubled-Consonant Digraph Re-encoding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-encode 15 doubled-consonant words from `letter + silent letter` to proper digraph notation, and update `GRAPHEMES_BY_LEVEL` to match.

**Architecture:** Replace placeholder "silent doubled X" entries in `GRAPHEMES_BY_LEVEL` with real digraph entries (`ss`, `ff`, `ll`, `nn`, `dd`, `pp`). Then update each affected word's `graphemes` array in the curriculum JSON to use the digraph instead of two separate entries.

**Tech Stack:** TypeScript, JSON, Vitest

**Spec:** `docs/superpowers/specs/2026-04-29-doubled-consonant-digraph-reencode-design.md`

**Note:** The spec mentions adding `chip` to `level6.json`, but `chip` already exists in `level4.json` with correct encoding. The reference list includes it at both levels; the curriculum only needs it once. Dropped from this plan.

---

## Tasks

### Task 1: Update GRAPHEMES_BY_LEVEL in levels.ts

**Files:**

- Modify: `src/data/words/levels.ts:57` (L2), `:81-82` (L4), `:108` (L6), `:118-119` (L7)

- [ ] **Step 1: Replace L2 silent doubled s with ss digraph**

In `src/data/words/levels.ts`, replace line 57:

```ts
    { g: 's', p: '', name: 'silent doubled s' },
```

with:

```ts
    { g: 'ss', p: 's' },
```

- [ ] **Step 2: Replace L4 silent doubled f and l with ff and ll digraphs**

In `src/data/words/levels.ts`, replace lines 81-82:

```ts
    { g: 'f', p: '', name: 'silent doubled f' },
    { g: 'l', p: '', name: 'silent doubled l' },
```

with:

```ts
    { g: 'ff', p: 'f' },
    { g: 'll', p: 'l' },
```

- [ ] **Step 3: Replace L6 silent doubled n with nn digraph**

In `src/data/words/levels.ts`, replace line 108:

```ts
    { g: 'n', p: '', name: 'silent doubled n' },
```

with:

```ts
    { g: 'nn', p: 'n' },
```

- [ ] **Step 4: Replace L7 silent doubled d and p with dd and pp digraphs**

In `src/data/words/levels.ts`, replace lines 118-119:

```ts
    { g: 'd', p: '', name: 'silent doubled d' },
    { g: 'p', p: '', name: 'silent doubled p' },
```

with:

```ts
    { g: 'dd', p: 'd' },
    { g: 'pp', p: 'p' },
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`

Expected: no errors (the types are unchanged — `g` and `p` are both `string`).

- [ ] **Step 6: Commit**

```bash
git add src/data/words/levels.ts
git commit -m "fix(word-spell): replace silent-doubled placeholders with digraph entries in GRAPHEMES_BY_LEVEL (#232)"
```

---

### Task 2: Re-encode level2.json (kiss)

**Files:**

- Modify: `src/data/words/curriculum/aus/level2.json`

- [ ] **Step 1: Re-encode kiss**

In `src/data/words/curriculum/aus/level2.json`, find the `kiss` entry. Replace its `graphemes` array:

```json
[
  { "g": "k", "p": "k" },
  { "g": "i", "p": "ɪ" },
  { "g": "s", "p": "s" },
  { "g": "s", "p": "" }
]
```

with:

```json
[
  { "g": "k", "p": "k" },
  { "g": "i", "p": "ɪ" },
  { "g": "ss", "p": "s" }
]
```

- [ ] **Step 2: Run invariant tests**

Run: `npx vitest run src/data/words/levels-vs-data-invariant.test.ts --reporter=verbose`

Expected: all tests pass — `ss|s` is now declared at L2 via `GRAPHEMES_BY_LEVEL`, and `kiss` uses it.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/curriculum/aus/level2.json
git commit -m "fix(word-spell): re-encode kiss as digraph ss in level2.json (#232)"
```

---

### Task 3: Re-encode level4.json (chess, chill, quoll, whiff)

**Files:**

- Modify: `src/data/words/curriculum/aus/level4.json`

- [ ] **Step 1: Re-encode chess**

In `src/data/words/curriculum/aus/level4.json`, find the `chess` entry. Replace its `graphemes` array:

```json
[
  { "g": "ch", "p": "tʃ" },
  { "g": "e", "p": "e" },
  { "g": "s", "p": "s" },
  { "g": "s", "p": "" }
]
```

with:

```json
[
  { "g": "ch", "p": "tʃ" },
  { "g": "e", "p": "e" },
  { "g": "ss", "p": "s" }
]
```

- [ ] **Step 2: Re-encode chill**

Find the `chill` entry. Replace its `graphemes` array:

```json
[
  { "g": "ch", "p": "tʃ" },
  { "g": "i", "p": "ɪ" },
  { "g": "l", "p": "l" },
  { "g": "l", "p": "" }
]
```

with:

```json
[
  { "g": "ch", "p": "tʃ" },
  { "g": "i", "p": "ɪ" },
  { "g": "ll", "p": "l" }
]
```

- [ ] **Step 3: Re-encode quoll**

Find the `quoll` entry. Replace its `graphemes` array:

```json
[
  { "g": "qu", "p": "kw" },
  { "g": "o", "p": "ɒ" },
  { "g": "l", "p": "l" },
  { "g": "l", "p": "" }
]
```

with:

```json
[
  { "g": "qu", "p": "kw" },
  { "g": "o", "p": "ɒ" },
  { "g": "ll", "p": "l" }
]
```

- [ ] **Step 4: Re-encode whiff**

Find the `whiff` entry. Replace its `graphemes` array:

```json
[
  { "g": "wh", "p": "w" },
  { "g": "i", "p": "ɪ" },
  { "g": "f", "p": "f" },
  { "g": "f", "p": "" }
]
```

with:

```json
[
  { "g": "wh", "p": "w" },
  { "g": "i", "p": "ɪ" },
  { "g": "ff", "p": "f" }
]
```

- [ ] **Step 5: Run invariant tests**

Run: `npx vitest run src/data/words/levels-vs-data-invariant.test.ts --reporter=verbose`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/curriculum/aus/level4.json
git commit -m "fix(word-spell): re-encode chess/chill/quoll/whiff as digraphs in level4.json (#232)"
```

---

### Task 4: Re-encode level6.json (annoy)

**Files:**

- Modify: `src/data/words/curriculum/aus/level6.json`

- [ ] **Step 1: Re-encode annoy**

In `src/data/words/curriculum/aus/level6.json`, find the `annoy` entry. Replace its `graphemes` array:

```json
[
  { "g": "a", "p": "æ" },
  { "g": "n", "p": "n" },
  { "g": "n", "p": "" },
  { "g": "oy", "p": "ɔɪ" }
]
```

with:

```json
[
  { "g": "a", "p": "æ" },
  { "g": "nn", "p": "n" },
  { "g": "oy", "p": "ɔɪ" }
]
```

- [ ] **Step 2: Run invariant tests**

Run: `npx vitest run src/data/words/levels-vs-data-invariant.test.ts --reporter=verbose`

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/curriculum/aus/level6.json
git commit -m "fix(word-spell): re-encode annoy as digraph nn in level6.json (#232)"
```

---

### Task 5: Re-encode level7.json (9 words)

**Files:**

- Modify: `src/data/words/curriculum/aus/level7.json`

- [ ] **Step 1: Re-encode bunny**

In `src/data/words/curriculum/aus/level7.json`, find the `bunny` entry. Replace its `graphemes` array:

```json
[
  { "g": "b", "p": "b" },
  { "g": "u", "p": "ʌ" },
  { "g": "n", "p": "n" },
  { "g": "n", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "b", "p": "b" },
  { "g": "u", "p": "ʌ" },
  { "g": "nn", "p": "n" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 2: Re-encode daddy**

Find the `daddy` entry. Replace its `graphemes` array:

```json
[
  { "g": "d", "p": "d" },
  { "g": "a", "p": "æ" },
  { "g": "d", "p": "d" },
  { "g": "d", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "d", "p": "d" },
  { "g": "a", "p": "æ" },
  { "g": "dd", "p": "d" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 3: Re-encode fluffy**

Find the `fluffy` entry. Replace its `graphemes` array:

```json
[
  { "g": "f", "p": "f" },
  { "g": "l", "p": "l" },
  { "g": "u", "p": "ʌ" },
  { "g": "f", "p": "f" },
  { "g": "f", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "f", "p": "f" },
  { "g": "l", "p": "l" },
  { "g": "u", "p": "ʌ" },
  { "g": "ff", "p": "f" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 4: Re-encode happy**

Find the `happy` entry. Replace its `graphemes` array:

```json
[
  { "g": "h", "p": "h" },
  { "g": "a", "p": "æ" },
  { "g": "p", "p": "p" },
  { "g": "p", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "h", "p": "h" },
  { "g": "a", "p": "æ" },
  { "g": "pp", "p": "p" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 5: Re-encode jelly**

Find the `jelly` entry. Replace its `graphemes` array:

```json
[
  { "g": "j", "p": "dʒ" },
  { "g": "e", "p": "e" },
  { "g": "l", "p": "l" },
  { "g": "l", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "j", "p": "dʒ" },
  { "g": "e", "p": "e" },
  { "g": "ll", "p": "l" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 6: Re-encode puppy**

Find the `puppy` entry. Replace its `graphemes` array:

```json
[
  { "g": "p", "p": "p" },
  { "g": "u", "p": "ʌ" },
  { "g": "p", "p": "p" },
  { "g": "p", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "p", "p": "p" },
  { "g": "u", "p": "ʌ" },
  { "g": "pp", "p": "p" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 7: Re-encode recess**

Find the `recess` entry. Replace its `graphemes` array:

```json
[
  { "g": "r", "p": "r" },
  { "g": "e", "p": "e" },
  { "g": "c", "p": "s" },
  { "g": "e", "p": "e" },
  { "g": "s", "p": "s" },
  { "g": "s", "p": "" }
]
```

with:

```json
[
  { "g": "r", "p": "r" },
  { "g": "e", "p": "e" },
  { "g": "c", "p": "s" },
  { "g": "e", "p": "e" },
  { "g": "ss", "p": "s" }
]
```

- [ ] **Step 8: Re-encode silly**

Find the `silly` entry. Replace its `graphemes` array:

```json
[
  { "g": "s", "p": "s" },
  { "g": "i", "p": "ɪ" },
  { "g": "l", "p": "l" },
  { "g": "l", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "s", "p": "s" },
  { "g": "i", "p": "ɪ" },
  { "g": "ll", "p": "l" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 9: Re-encode sunny**

Find the `sunny` entry. Replace its `graphemes` array:

```json
[
  { "g": "s", "p": "s" },
  { "g": "u", "p": "ʌ" },
  { "g": "n", "p": "n" },
  { "g": "n", "p": "" },
  { "g": "y", "p": "iː" }
]
```

with:

```json
[
  { "g": "s", "p": "s" },
  { "g": "u", "p": "ʌ" },
  { "g": "nn", "p": "n" },
  { "g": "y", "p": "iː" }
]
```

- [ ] **Step 10: Run invariant tests**

Run: `npx vitest run src/data/words/levels-vs-data-invariant.test.ts --reporter=verbose`

Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/data/words/curriculum/aus/level7.json
git commit -m "fix(word-spell): re-encode 9 doubled-consonant words as digraphs in level7.json (#232)"
```

---

### Task 6: Run full invariant test suite and verify

**Files:**

- Test: `src/data/words/levels-vs-data-invariant.test.ts`
- Test: `src/data/words/curriculum-invariant.test.ts`

- [ ] **Step 1: Run both invariant test files**

Run: `npx vitest run src/data/words/levels-vs-data-invariant.test.ts src/data/words/curriculum-invariant.test.ts --reporter=verbose`

Expected: all 444 tests pass (same count as before the changes).

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Verify no remaining silent-doubled entries**

Run this check to confirm no placeholder silent-doubled entries remain in `GRAPHEMES_BY_LEVEL`:

```bash
grep -n 'silent doubled' src/data/words/levels.ts
```

Expected: no output (all six entries have been replaced).

- [ ] **Step 4: Verify no remaining letter+silent-letter patterns in affected JSON files**

```bash
python3 -c "
import json
for level in [2, 4, 6, 7]:
    with open(f'src/data/words/curriculum/aus/level{level}.json') as f:
        entries = json.load(f)
    for entry in entries:
        gs = entry['graphemes']
        for i in range(len(gs) - 1):
            if gs[i+1]['p'] == '' and len(gs[i+1]['g']) == 1 and gs[i]['g'] == gs[i+1]['g']:
                print(f'REMAINING: level{level} {entry[\"word\"]} still has letter+silent pattern at index {i}')
print('Done. No output above = all clean.')
"
```

Expected: `Done. No output above = all clean.`
