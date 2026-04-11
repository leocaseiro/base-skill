# Phonics Word Library — Design

> **Status:** Draft v2 · **Owner:** @leocaseiro · **Region focus:** AUS → UK → US (BR shape-ready) · **Target games:** WordSpell, future word games
> **Scope:** This spec covers **P1** only — the read-only static library, builder functions, ~650-word seed corpus, filter API, and WordSpell integration. P2 (dev authoring form) and P3 (runtime user word bags) are separate projects with their own specs.

## 1. Goal

Today WordSpell rounds are hand-authored per config. A teacher who wants "words the child can read using the graphemes they already know" has no way to express that — they'd have to curate the list themselves.

This spec introduces a **phonics-aware word library** that lets a teacher (or future UI) filter the shared corpus by region, level, grapheme subset, phoneme subset, and syllable count, and have WordSpell generate rounds from the result. The library is seeded from an Australian 8-level phonics progression (~700 raw words, ~650 after removing proper nouns) and is the foundation other word games (Word Builder, Read Aloud) will share later.

## 2. Project decomposition

This feature breaks into three independent sub-projects. Each gets its own spec→plan→implementation cycle.

| Project                               | Scope                                                                                                                | Depends on            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **P1 — Static library** _(this spec)_ | Types, chunk layout, builder functions, ~650-word seed corpus, filter API, WordSpell integration                     | Nothing               |
| **P2 — Dev authoring form**           | Storybook form + Vite middleware that reads/writes the P1 JSON chunk files; add/update/delete with confirmation      | P1's types + builders |
| **P3 — Runtime user word bags**       | IndexedDB-backed user-created word bags, CRUD UI, export/import, new `WordSpellConfig.source = { type: 'word-bag' }` | P1's types            |

Build order is P1 → P2 → P3.

## 3. Teaching model

Words are the primary entity. Each region has its own teaching progression, stored as a list of numbered **levels**.

"Level" is a neutral integer — the number only has meaning within a region's curriculum. UK pedagogy calls them "phases"; AUS calls them "levels" or "stages"; US calls them "units" within a grade. Storage uses the integer; display strings come from a per-region label table:

```ts
// src/data/words/levels.ts
export const LEVEL_LABELS: Record<Region, (level: number) => string> = {
  aus: (n) => `Level ${n}`,
  uk: (n) => `Phase ${n}`,
  us: (n) => `K Unit ${n}`,
  br: (n) => `Unidade ${n}`,
};
```

Four regions are modelled: `aus`, `uk`, `us`, `br`. AUS is seeded with all 8 levels from the source word list. UK/US start empty and get filled incrementally via P2. BR is shape-ready but unseeded.

Proprietary programmes (Jolly Phonics, InitiaLit, Reading Wonders, Fountas & Pinnell) are not copied. The AUS levels are taken from a public synthetic-phonics progression; UK/US levels (when seeded) come from public references (UK Letters and Sounds DfE 2007, US CKLA / Core Knowledge) only.

## 4. Data model — normalized split

Two tables, joined on `word`. One captures invariant facts; the other captures per-region teaching facts.

```ts
// src/data/words/types.ts

export type Region = 'aus' | 'uk' | 'us' | 'br';

/** Invariant per spelling. Lives in src/data/words/core/. */
export interface WordCore {
  word: string;
  syllableCount: number;
  /** When present: syllables.join('') === word. */
  syllables?: string[];
  /** Cross-spelling links (colour ↔ color, mum ↔ mom). Just the word strings. */
  variants?: string[];
}

export interface Grapheme {
  /** 'sh', 'ch', 'a_e', 'igh'. */
  g: string;
  /** IPA phoneme. Silent letters store ''. */
  p: string;
  /** For split digraphs only. Letter positions in the word. */
  span?: [number, number];
}

/** Per-region teaching facts. Lives in src/data/words/curriculum/<region>/. */
export interface CurriculumEntry {
  /** Foreign key into WordCore. */
  word: string;
  /** Ordered position within this region's progression. */
  level: number;
  /** Full-word IPA. Flat string — region is implicit from the file location. */
  ipa: string;
  /** graphemes.map(g => g.g.replace('_', '')).join('') === word. */
  graphemes: Grapheme[];
}

/** The shape filterWords() returns — already joined. */
export interface WordHit {
  word: string;
  region: Region;
  level: number;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
  /** Present only for Tier 2-enriched entries. */
  ipa?: string;
  graphemes?: Grapheme[];
}
```

### 4.1 Two tiers of enrichment

| Tier       | Fields                                                               | Authoring cost                    | Filter support                                                                      |
| ---------- | -------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| **Tier 1** | `WordCore` (word, syllableCount, variants) + `CurriculumEntry.level` | Codegen from source list          | `level`, `levels`, `syllableCount*`                                                 |
| **Tier 2** | `CurriculumEntry.ipa` + `graphemes[]`                                | Codegen best-effort + hand review | Adds `graphemesAllowed`, `graphemesRequired`, `phonemesAllowed`, `phonemesRequired` |

Tier 1 is populated for **all** seeded words (all ~650). Tier 2 is populated by codegen for words whose grapheme split is unambiguous given the level's grapheme set (expected ~90% of levels 1–4, ~60% of levels 5–8) and hand-reviewed thereafter. Words missing Tier 2 fields are **excluded** from Tier 2 filters — never silently accepted.

### 4.2 Region handling

**Case A — same spelling, different sound** (`car`, `tomato`, `bath`):
One `WordCore`. Multiple `CurriculumEntry` rows, one per region, each with its own `ipa` and `graphemes[]`. No nested per-region map inside entries.

**Case B — different spelling** (`colour`/`color`, `aluminium`/`aluminum`):
Two separate `WordCore` rows linked by bidirectional `variants[]`. Each appears only in the curriculum files of the regions that use that spelling. `colour` is in `curriculum/aus/` and `curriculum/uk/` but never in `curriculum/us/`; `color` is the opposite.

### 4.3 Grapheme-phoneme authoring rules

- Digraphs (`ch`, `sh`, `th`, `ng`, `qu`) are a **single** grapheme.
- Trigraphs (`igh`, `air`, `ear`) are a single grapheme.
- Split digraphs (`a_e` in `cake`, `i_e` in `kite`) use underscore notation and store `span: [startIndex, endIndex]`. The invariant `graphemes.map(g => g.g.replace('_', '')).join('') === word` accounts for the underscore.
- Silent letters get `p: ''` and still contribute to `word`.
- Digraphs must not cross syllable boundaries. Build-time test warns if they do.
- `ipa` is broad phonemic transcription (no narrow detail, no secondary stress unless disambiguating).

### 4.4 Proper nouns are skipped

The source word list contains proper nouns (`Nat`, `Sam`, `Kim`, `Meg`, `Phil`, `Troy`, `Mason`, `Pete`, `Duke`, `Friday`, `Vincent`). The codegen script filters them out by a simple first-letter-capitalized rule. They are not in the seed corpus. If we need them later (names-teaching mode), a dedicated chunk can be added — not in P1.

## 5. File layout

```text
src/data/words/
  types.ts                 # WordCore, CurriculumEntry, Grapheme, Region, WordFilter, WordHit
  levels.ts                # per-region label formatters + level → grapheme-set lookups
  phoneme-codes.ts         # teacher-code ↔ IPA alias table (sh, ch, th_voiceless…)
  builders.ts              # makeWordCore, makeGraphemes, makeCurriculumEntry, validateEntry
  writer.ts                # pure upsert/remove helpers — consumed by P2, lives here so invariants stay DRY
  filter.ts                # async filterWords() + chunk cache + two-file join
  adapters.ts              # toWordSpellRound(WordHit)
  words.test.ts            # invariant harness over every chunk file
  index.ts                 # public API re-exports

  core/
    level1.json            # ~40 WordCore rows (SATPIN)
    level2.json            # ~55 WordCore rows (mdgockeur)
    level3.json            # ~60 WordCore rows (bhfljvwxyz)
    level4.json            # ~75 WordCore rows (digraphs + quirky graphemes)
    level5.json            # ~115 WordCore rows (long vowels ai/ee/oa/igh/oo)
    level6.json            # ~140 WordCore rows (oi/oy/oo/ou/ow/er/ir/ur/ar/or)
    level7.json            # ~120 WordCore rows (split digraphs + vowel-at-end y/e/o)
    level8.json            # ~90 WordCore rows (aw/ew/ou/air/are/ear/eer/ore/dge/tch)

  curriculum/
    aus/
      level1.json          # CurriculumEntry rows — 1:1 with core/level1.json
      level2.json          # …
      level3.json
      level4.json
      level5.json
      level6.json
      level7.json
      level8.json
    uk/                    # empty directory — stub .gitkeep, seeded via P2 later
    us/                    # empty directory — stub .gitkeep
    br/                    # empty directory — shape-ready, no content
```

Chunks are JSON (not TS). A build step generates a JSON schema from `types.ts` for optional IDE validation.

The `core/levelN.json` chunking uses AUS levels because that's the source of truth. A UK-only chunking (e.g. `curriculum/uk/phase3.json` referencing words that span `core/level1..6.json`) is fine — the filter just loads the needed core chunks on demand.

## 6. Storage strategy

Library data ships as static JSON chunks, **lazy-loaded via Vite's `import.meta.glob`** and cached in module-level `Map`s. **Not persisted to RxDB/IndexedDB.**

### 6.1 Why not IndexedDB for P1

Per [`docs/adrs/0001-rxdb-without-tanstack-query.md`](../../adrs/0001-rxdb-without-tanstack-query.md), RxDB collections hold user-generated or frequently-mutated state. The P1 library is the opposite: read-only, ships with the app, replaced whole on every deploy, identical for every user.

For ~650 words:

| Concern           | JSON + in-memory filter | RxDB collection + indexes    |
| ----------------- | ----------------------- | ---------------------------- |
| Query performance | ~50µs over 650 entries  | ~1ms (IDB round-trip)        |
| Cold start        | One-time chunk fetch    | Fetch + seed + open IDB      |
| Schema evolution  | Redeploy JSON           | Migration on every data bump |
| Bundle/disk cost  | ~100 KB gzipped total   | Same + collection schema     |
| Test story        | Vitest reads JSON       | Integration test needs IDB   |

`Array.filter` over 650 objects is tens of microseconds. IDB's strengths target problems the static library doesn't have.

**P3 is different.** User word bags are mutable per-user state — they go in RxDB/IndexedDB. The P1 filter API is built to merge cleanly with P3's bag-sourced words later: the `WordSpellConfig.source` discriminated union adds a `'word-bag'` variant, and both paths produce the same `WordHit[]` shape downstream.

### 6.2 Async signature protects future refactors

`filterWords()` returns `Promise<WordHit[]>`. If the corpus grows past ~5,000 words and we eventually swap the in-memory implementation for a SQLite-wasm-backed one, the public API doesn't change — only `filter.ts` internals.

### 6.3 Chunk loading

```ts
const coreLoaders = import.meta.glob<{ default: WordCore[] }>(
  './core/level*.json',
);
const ausLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/aus/level*.json',
);
// Same pattern for uk/, us/, br/ — resolved dynamically from the filter's region.
```

Both sides are lazy-loaded on the first `filterWords()` call (or the first call that targets a given region) and cached. Workbox precaches them automatically in the service-worker asset manifest.

## 7. Filter API

```ts
// src/data/words/types.ts
export interface WordFilter {
  region: Region; // required

  // Curriculum scope (Tier 1)
  level?: number;
  levels?: number[];
  levelRange?: [number, number];

  // Structural (Tier 1)
  syllableCountEq?: number;
  syllableCountRange?: [number, number];

  // Phonics (Tier 2 — require graphemes[] present)
  graphemesAllowed?: string[]; // every grapheme in the word ∈ this set
  graphemesRequired?: string[]; // word must contain ≥1 of these
  phonemesAllowed?: string[]; // every phoneme in the word ∈ this set
  phonemesRequired?: string[]; // word must contain ≥1 of these

  /** Default true. Controls fallback-to-AUS behavior for unseeded regions. */
  fallbackToAus?: boolean;
}

export interface FilterResult {
  hits: WordHit[];
  /** Set when the filter targeted a non-AUS region with no data and fell back. */
  usedFallback?: { from: Region; to: 'aus' };
}
```

### 7.1 Matching semantics

- `region` is required.
- `level` / `levels` / `levelRange` are OR-combined within the level dimension, AND-combined with everything else.
- `syllableCountRange: [min, max]` is inclusive.
- `graphemesAllowed`: a word passes only if **every** grapheme in the word's `graphemes[]` is in the allowed set. Words without `graphemes[]` (Tier 1 only) are **excluded** when this field is set.
- `graphemesRequired`: a word passes if **at least one** of the required graphemes appears in the word's `graphemes[]`. Excluded if `graphemes[]` absent.
- `phonemesAllowed` / `phonemesRequired`: same logic but on `graphemes[].p` values.
- All predicates AND together.

### 7.2 AUS fallback

When a filter targets `region: 'uk'` (or `'us'`, `'br'`) and no words match — typically because that region's curriculum is empty or doesn't cover the requested level — `filterWords()` re-runs the same filter against `region: 'aus'` and returns `usedFallback: { from: 'uk', to: 'aus' }` alongside the hits.

The fallback is **per-query**: if even one word matches in the target region, no fallback kicks in. The caller (game config, UI) can inspect `usedFallback` and decide whether to show "showing Australian equivalents" notice.

Callers can opt out with `fallbackToAus: false` to get a strict region-scoped query (returns empty hits instead of falling back).

### 7.3 Example calls

```ts
// Child is mid-level-2: knows SATPIN + m/d/g/o, not yet c/k/ck/e/u/r
await filterWords({
  region: 'aus',
  levels: [1, 2],
  graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'],
  syllableCountEq: 1,
});
// → ['sit', 'sat', 'pin', 'pan', 'pad', 'dog', 'dot', 'mad', 'mat', ...]
// 'cat' excluded (has 'c'); 'red' excluded (has 'r' and 'e')

// Teacher disambiguating 'c' making /k/ vs /s/
await filterWords({
  region: 'aus',
  graphemesRequired: ['c'],
  phonemesRequired: ['k'],
});
// → ['cat', 'cup', 'cap', 'car', 'cactus']
// 'city' excluded ('c' grapheme but no /k/ phoneme)
// 'pack' excluded (has /k/ but via 'ck' grapheme, not 'c')

// Target /sh/ digraph practice
await filterWords({
  region: 'aus',
  graphemesRequired: ['sh'],
});
// → ['ship', 'shop', 'shed', 'fish', 'dish', 'wish', 'shin', ...]

// UK filter with no UK data yet → falls back to AUS
const result = await filterWords({ region: 'uk', level: 3 });
// result.hits = AUS level 3 words
// result.usedFallback = { from: 'uk', to: 'aus' }
```

## 8. Builder functions

The builders are pure, deterministic, and used by **three** consumers:

1. The **codegen script** that seeds the corpus from `words-list.md`
2. The **invariant test harness** (validation)
3. **P2's dev authoring form** (same validation + in-form preview)

```ts
// src/data/words/builders.ts

/** Heuristic: counts vowel groups, handles silent-e. Override with opts.syllables. */
export const makeWordCore = (
  word: string,
  opts?: { syllables?: string[]; variants?: string[] },
): WordCore;

/**
 * Splits `word` into graphemes using `levelGraphemes` as the known set
 * (longest-match-first). Returns best-effort spans. Caller reviews ambiguous cases.
 * Returns `null` if the word can't be split cleanly (missing graphemes, ambiguity).
 */
export const makeGraphemes = (
  word: string,
  levelGraphemes: string[],
  phonemeByGrapheme?: Record<string, string>,
): Grapheme[] | null;

/** Composes WordCore + CurriculumEntry with defaults; callers override specifics. */
export const makeCurriculumEntry = (
  word: string,
  level: number,
  opts: {
    levelGraphemes: string[];
    ipa?: string; // if omitted, derived from graphemes[].p
    graphemes?: Grapheme[]; // if omitted, derived via makeGraphemes
  },
): CurriculumEntry | null;

/** Full invariant check. Returns structured errors so P2 can surface them. */
export const validateEntry = (
  core: WordCore,
  curriculum: CurriculumEntry,
): { ok: true } | { ok: false; errors: ValidationError[] };

export interface ValidationError {
  field: 'word' | 'syllables' | 'graphemes' | 'ipa' | 'level';
  message: string;
}
```

### 8.1 The codegen script

A one-shot Node script at `scripts/seed-word-library.ts`:

1. Parses `docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md` into `{ level, levelGraphemes, words[] }` blocks.
2. Drops proper nouns (`/^[A-Z]/`).
3. For each word, calls `makeWordCore` + `makeCurriculumEntry` with `levelGraphemes` from that level's grapheme set.
4. Splits results into two buckets:
   - **Success**: full Tier-2 entry — gets written to the appropriate `core/levelN.json` + `curriculum/aus/levelN.json`.
   - **Needs review**: Tier-1 only (builders returned `null` for graphemes/ipa) — gets written with `WordCore` only and **no** `CurriculumEntry.graphemes` / `ipa`. Listed in a `codegen-review.md` report for later enrichment via P2.
5. Dedups within a level (a word can appear in level 1 and level 2 but not twice in level 1).
6. Formats output with Prettier.
7. Writes files deterministically so re-running produces zero diff if inputs unchanged.

The script runs once as part of the seed task. It's not part of the app build and doesn't need to be re-run per dev session — the JSON chunks are committed.

## 9. Syllables

### 9.1 Storage

`WordCore.syllables` is an optional string array: `['sun', 'set']`. Length is the count; concatenation must equal `word`. Tier 1 words without `syllables[]` still have `syllableCount` for length filtering.

When present, the array doubles as the chunks rendered in WordSpell's existing `tileUnit: 'syllable'` mode.

Tricky cases:

- Silent `e` does not get its own syllable. `cake` → `['cake']`, count 1.
- Digraphs never cross syllable boundaries. `chicken` → `['chick', 'en']`, not `['chic', 'ken']`.
- Regional syllable disagreement (e.g. US pronounces `fire` with two syllables, AUS/UK with one) uses the canonical spelling's dominant regional count. If it matters enough to diverge later, we escalate to per-region syllables — not in P1.

### 9.2 Authoring

Level 1–3 words (simple CVC, one syllable): codegen script sets `syllableCount: 1` and `syllables: [word]` automatically.

Level 5+ multi-syllable words: codegen sets `syllableCount` via a vowel-group heuristic (`syllable` npm package, offline-installed) and leaves `syllables[]` undefined. Hand-review fills in the array via P2 when needed for syllable-mode games.

## 10. Build-time validation

`src/data/words/words.test.ts` loads every `core/*.json` and `curriculum/<region>/*.json` file and asserts:

1. **`syllables.join('') === word`** when `syllables` is present.
2. **`graphemes.map(g => g.g.replace('_', '')).join('') === word`** when `graphemes` is present.
3. **Every `CurriculumEntry.word`** has a matching `WordCore` in the same level's core file.
4. **No orphan `WordCore`** — every core row must have at least one curriculum entry in at least one region (modulo P2 work-in-progress; warnings, not errors, for missing curricula).
5. **Variants backlink** — if `A.variants = ['B']` then `B.variants` must include `'A'`.
6. **No duplicate `word` within a single level's core file**. A word can appear in multiple levels.
7. **Phase/level consistency** — every `CurriculumEntry` lives in a file whose filename matches its `level` field.
8. **Proper nouns absent** — no entry starts with an uppercase letter (unless explicitly allowed later).
9. **Graphemes don't cross syllable boundaries** when both are present.

Invariants are reused by P2's writer — the same validator runs in the dev form before a write is persisted.

## 11. WordSpell integration

Two non-breaking additions.

### 11.1 `WordSpellConfig.source`

```ts
// src/games/word-spell/types.ts
export type WordSpellSource = {
  type: 'word-library';
  filter: WordFilter;
  limit?: number;
};
// P3 later adds: | { type: 'word-bag'; bagId: string };

export interface WordSpellConfig extends AnswerGameConfig {
  // ...existing fields
  rounds?: WordSpellRound[]; // explicit authoring — still wins when set
  source?: WordSpellSource;
}
```

If `rounds` is set, it wins (explicit authoring beats filter). If `source` is set and `rounds` is absent, a new `useLibraryRounds` hook calls `filterWords(source.filter)`, picks `limit` entries (defaults to `totalRounds`), and feeds them to WordSpell via `toWordSpellRound`.

### 11.2 Adapter

```ts
// src/data/words/adapters.ts
import type { WordHit } from './types';
import type { WordSpellRound } from '@/games/word-spell/types';

/** Joins syllables with '-' so WordSpell's existing segmentsForWord splits them. */
export const toWordSpellRound = (hit: WordHit): WordSpellRound => ({
  word: hit.syllables ? hit.syllables.join('-') : hit.word,
});
```

### 11.3 Hook wiring

`useLibraryRounds(config)` resolves either explicit `rounds` (sync) or library-driven `source` (async), returns `{ rounds, isLoading, usedFallback }`. WordSpell mounts it above its existing render and shows a brief loading state while async resolution runs. Legacy configs (with explicit `rounds`) short-circuit synchronously — no user-visible change.

### 11.4 Ordering / sampling

`filterWords()` returns entries in a deterministic order — alphabetical by region+level filename, then source-file order within each chunk. `.slice(0, limit)` gives the same first-N for the same filter. The existing `roundsInOrder: false` config controls shuffling downstream in `buildRoundOrder`; it applies after the library filter produces the round list, so no new shuffling logic at this layer.

## 12. Seed corpus (~650 words)

Distribution is driven by the source file at `docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md`:

| Level | Grapheme set                           | Raw words | After dedup + proper-noun filter |
| ----- | -------------------------------------- | --------- | -------------------------------- |
| 1     | `s a t p i n`                          | ~44       | ~40                              |
| 2     | `m d g o c k ck e u r`                 | ~62       | ~55                              |
| 3     | `b h f l j v w x y z`                  | ~66       | ~60                              |
| 4     | `sh ch th (both) qu ng wh ph g c`      | ~80       | ~75                              |
| 5     | `ai ay ea ee ie igh oa ow ew ue`       | ~120      | ~115                             |
| 6     | `oi oy oo (both) ou ow er ir ur ar or` | ~150      | ~140                             |
| 7     | `a_e e_e i_e o_e u_e + vowel-at-end`   | ~130      | ~120                             |
| 8     | `aw ew ou air are ear eer ore dge tch` | ~95       | ~90                              |

Counts are approximate — the codegen script's dedup pass produces the exact numbers. All ~650 ship with **Tier 1 data**. Tier 2 enrichment coverage is expected to be ~90% for levels 1–4 (straightforward one-letter-one-phoneme splits) and ~60% for levels 5–8 (split digraphs, vowel ambiguity, multi-syllable edge cases). The ~100-word remainder lands in `codegen-review.md` for hand-review via P2.

No regional showcase chunk in P1. Region variants (`colour`/`color`, `mum`/`mom`) are introduced via P2's dev form after the base corpus lands — they're specific hand-authored cases, not part of the source word list.

## 13. Out of scope for P1

These get their own specs.

- **P2 — dev authoring form.** Storybook UI + Vite middleware for reading/writing the JSON chunks with add/update/delete (confirmation dialog). Dev-only, never ships to prod.
- **P3 — runtime user word bags.** IndexedDB-backed user-created word bags, CRUD UI in-app, export/import, new `WordSpellConfig.source = { type: 'word-bag' }`. Tier 1 only (no IPA authoring UI for parents).
- **Parent filter UI.** Controls in the WordSpell config form that let a parent compose a `WordFilter`. Waits on P2 maturity.
- **UK/US seed corpora.** Shape-ready from day one but unseeded. Added incrementally via P2. AUS fallback covers the gap until then.
- **pt-BR seed corpus.** Shape-ready, no content.
- **Bulk import pipeline** (CMU Pronouncing Dictionary, Wiktionary) for scaling past ~2,000 words. Not needed for K–Y2.
- **Algorithmic syllable splitting** (beyond counts). Codegen uses counts-only; the array form is hand-authored via P2 when needed.
- **RxDB-backed P1 library.** Blocked on corpus size and measured performance cost, neither of which applies now.
- **Second word-game adapters** (Word Builder, Read Aloud). Adapters land in `src/data/words/adapters.ts` when those games ship.

## 14. Open questions

None at design time. All region / scale / shape / filter / fallback decisions are committed above.

## 15. Affected files — new

| File                                             | Purpose                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/data/words/types.ts`                        | `WordCore`, `CurriculumEntry`, `Grapheme`, `Region`, `WordFilter`, `WordHit`, `FilterResult` |
| `src/data/words/levels.ts`                       | Per-region label formatters + level → grapheme-set lookups                                   |
| `src/data/words/phoneme-codes.ts`                | Teacher-code ↔ IPA alias table                                                               |
| `src/data/words/builders.ts`                     | `makeWordCore`, `makeGraphemes`, `makeCurriculumEntry`, `validateEntry`                      |
| `src/data/words/writer.ts`                       | Pure upsert/remove helpers (consumed by P2)                                                  |
| `src/data/words/filter.ts`                       | Async `filterWords()` + chunk cache + two-file join + AUS fallback                           |
| `src/data/words/adapters.ts`                     | `toWordSpellRound()`                                                                         |
| `src/data/words/words.test.ts`                   | Invariants over every chunk file                                                             |
| `src/data/words/index.ts`                        | Public API re-exports                                                                        |
| `src/data/words/core/level{1..8}.json`           | `WordCore[]` per level                                                                       |
| `src/data/words/curriculum/aus/level{1..8}.json` | `CurriculumEntry[]` per AUS level                                                            |
| `src/data/words/curriculum/{uk,us,br}/.gitkeep`  | Empty stubs (shape-ready)                                                                    |
| `scripts/seed-word-library.ts`                   | One-shot codegen script                                                                      |
| `src/games/word-spell/useLibraryRounds.ts`       | Hook resolving `source` → rounds                                                             |
| `src/games/word-spell/useLibraryRounds.test.tsx` | Hook tests                                                                                   |

## 16. Affected files — edited

| File                                                   | Change                                                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/games/word-spell/types.ts`                        | Make `rounds` optional, add `source?: WordSpellSource`                                                                                 |
| `src/games/word-spell/WordSpell/WordSpell.tsx`         | Mount `useLibraryRounds`, render loading state, handle `usedFallback` banner hook-up (banner UI itself deferred to the filter-UI spec) |
| `src/games/word-spell/WordSpell/WordSpell.stories.tsx` | Add `LibrarySourced` story                                                                                                             |
