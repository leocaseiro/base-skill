# Phonics Word Library — Design

> **Status:** Draft · **Owner:** @leocaseiro · **Region focus:** AUS → UK → US
> (BR shape-ready) · **Target games:** WordSpell, future word games
> **Scope:** Read-only seed corpus (~100 words) + async filter API + WordSpell integration

## 1. Goal

Today WordSpell rounds are hand-authored per config. A parent who wants "words
the child can read using Phase 2 sounds, 1 syllable only" has no way to express
that — they'd have to curate the list themselves. This spec introduces a
**phonics-aware word library** that lets a parent (or future UI) filter the
shared corpus by region, phase, grapheme, phoneme, and syllable count, and have
WordSpell generate rounds from the result.

The library is the foundation other word games (Word Builder, Read Aloud) will
share later — this spec covers the data, filter API, and WordSpell adapter
only. Filter UI is explicitly out of scope here and gets its own follow-up.

## 2. Teaching model

Words are the primary entity. Each word carries an array of phase memberships
keyed by region, so a single corpus supports multiple phonics programmes.

Four regions are modelled in the data shape from day one: `aus`, `uk`, `us`,
`br`. The first seed corpus targets **AUS (primary), UK, US**. BR is
shape-ready but lightly seeded — we don't block on sourcing pt-BR content.

Phase taxonomies (used by the filter UI to group words; not a teaching
authority):

| Region | Source                                                     | Phase id examples                     |
| ------ | ---------------------------------------------------------- | ------------------------------------- |
| `uk`   | Letters and Sounds (DfE, 2007) — Crown copyright, reusable | `phase2`, `phase3`, `phase5`          |
| `aus`  | Australian Curriculum v9 phonics progression (CC-BY)       | `f.unit1`, `f.unit7`, `y1.unit3`      |
| `us`   | Public-domain state scope-and-sequence (e.g. CKLA)         | `k.wk4`, `g1.wk12`                    |
| `br`   | BNCC phonics order — vogais → sílabas simples → dígrafos   | `bncc.vogais`, `bncc.silabas-simples` |

Proprietary programmes (Jolly Phonics, InitiaLit, Reading Wonders, Fountas &
Pinnell) are deliberately not copied; the AUS/US/UK phase ids above are
_informed by_ free references only.

## 3. Data model

```ts
// src/data/words/types.ts

export type Region = 'aus' | 'uk' | 'us' | 'br';

export interface PhonemeByRegion {
  aus?: string;
  uk?: string;
  us?: string;
  br?: string;
}

export interface Grapheme {
  g: string; // 'c', 'ch', 'igh', 'a_e'
  p: string | PhonemeByRegion; // phoneme: canonical OR per-region
  span?: [number, number]; // set for split digraphs only (a_e, i_e)
}

export interface WordEntry {
  word: string; // canonical surface spelling
  regions?: Region[]; // omitted = all regions
  variants?: string[]; // linked alternate spellings (aluminium ↔ aluminum)
  syllables: string[]; // ['sun','set']; .length === count; .join('')===word
  ipa: string | Partial<Record<Region, string>>; // canonical OR per-region
  graphemes: Grapheme[]; // .map(x => x.g).join('')===word
  phases?: Partial<Record<Region, string[]>>;
  tags?: string[]; // freeform: 'cvc', 'animal', 'food'
}

export interface WordFilter {
  region: Region; // required — single selected region
  phases?: string[]; // OR-match against entry.phases[region]
  grapheme?: string; // 'c' or 'ch'
  phoneme?: string; // IPA symbol, e.g. 'ʃ' or 'k'
  syllablesEq?: number;
  syllablesMin?: number;
  syllablesMax?: number;
  tags?: string[]; // OR-match
}
```

### 3.1 Region handling — two cases

**Case A — same spelling, different sound** (`tomato`, `bath`, `privacy`,
`vitamin`, `schedule`, `either`, `garage`): one entry, per-region `ipa`,
per-region phoneme values inside `graphemes[].p` where the sound differs.

```json
{
  "word": "tomato",
  "regions": ["aus", "uk", "us"],
  "syllables": ["to", "ma", "to"],
  "ipa": {
    "aus": "/təˈmɑːtəʊ/",
    "uk": "/təˈmɑːtəʊ/",
    "us": "/təˈmeɪtoʊ/"
  },
  "graphemes": [
    { "g": "t", "p": "t" },
    { "g": "o", "p": "ə" },
    { "g": "m", "p": "m" },
    { "g": "a", "p": { "aus": "ɑː", "uk": "ɑː", "us": "eɪ" } },
    { "g": "t", "p": "t" },
    { "g": "o", "p": { "aus": "əʊ", "uk": "əʊ", "us": "oʊ" } }
  ]
}
```

**Case B — different spelling** (`aluminium`/`aluminum`, `colour`/`color`,
`mum`/`mom`, `grey`/`gray`, `favourite`/`favorite`): two entries linked by
bidirectional `variants[]`, each with its own `regions[]`.

```json
{
  "word": "aluminium",
  "regions": ["aus", "uk"],
  "variants": ["aluminum"],
  "syllables": ["al", "u", "min", "i", "um"],
  "ipa": { "aus": "/ˌæljəˈmɪniəm/", "uk": "/ˌæljəˈmɪniəm/" },
  "graphemes": []
}
```

```json
{
  "word": "aluminum",
  "regions": ["us"],
  "variants": ["aluminium"],
  "syllables": ["a", "lu", "mi", "num"],
  "ipa": { "us": "/əˈluːmɪnəm/" },
  "graphemes": []
}
```

> Note: `graphemes` is elided above for brevity — real entries always populate
> it. See § 3.2 for the authoring rules and the `tomato` / `cat` / `child`
> examples in § 3.1 and § 6.2.

### 3.2 Grapheme-phoneme mapping

The `graphemes` array is the killer field for phonics teaching. It distinguishes
_the same letter pronounced differently_ (`c` as /k/ in `cat` vs `c` as /s/ in
`city`) and _the same sound spelled differently_ (`/k/` as `c` in `cat`, as `k`
in `kite`, as `ck` in `duck`).

Rules for authoring:

- Digraphs (`ch`, `sh`, `th`, `ng`, `qu`) are a **single** grapheme, not two.
- Trigraphs (`igh`, `air`, `ear`) are a single grapheme.
- Split digraphs (`a_e` in `cake`, `i_e` in `kite`) use underscore notation and
  store `span: [startIndex, endIndex]` so the renderer can highlight the two
  halves — WordSpell today doesn't use `span`, but it's cheap to store now.
- Silent letters get `p: ''` and still contribute to `syllables`.
- Digraphs must not cross `syllables` boundaries. Build-time test warns if they
  do.

### 3.3 Phoneme notation

Storage uses **IPA symbols** only (`ʃ`, `ɪ`, `ŋ`, `θ`, `ð`, `tʃ`, `dʒ`). A
small `phonemeCode` alias table (`src/data/words/phoneme-codes.ts`) maps
teacher-friendly codes (`sh`, `th_voiceless`, `th_voiced`, `ch`, `ng`) to IPA
for filter UIs that want to show plain text. The data never stores codes — only
IPA.

## 4. File layout

```
src/data/words/
  types.ts             # WordEntry, Grapheme, Region, PhonemeByRegion, WordFilter
  phases.ts            # per-region phase lookup (id, label, description)
  phoneme-codes.ts     # teacher-code ↔ IPA alias table
  filter.ts            # async filterWords(), in-memory chunk cache
  adapters.ts          # toWordSpellRound(entry) and future adapters
  words.schema.json    # JSON schema for chunk entries — IDE validation
  words.test.ts        # loads every chunk JSON, runs invariants
  index.ts             # public API re-exports
  chunks/
    core.json           # SATPIN, mdgock, ckeur, hbffllss (~40)
    digraphs.json       # ch sh th ng (~20)
    long-vowels.json    # ai ee igh oa oo ar or ur ow oi (~15)
    split-digraphs.json # a_e i_e o_e u_e (~10)
    multi-syllable.json # sunset, chicken, tomato, elephant (~10)
    regional.json       # aluminium/aluminum, colour/color (~5)
```

Chunk files are JSON (not TS). IDE validation comes from `words.schema.json`,
which is generated from `types.ts` via a dev-time script and checked in.

## 5. Storage strategy

Library data is bundled as JSON chunks, **lazy-loaded at runtime via Vite's
`import.meta.glob`**, and cached in a module-level `Map`. Not persisted to
RxDB/IndexedDB.

### 5.1 Why not IndexedDB

Per [`docs/adrs/0001-rxdb-without-tanstack-query.md`](../../adrs/0001-rxdb-without-tanstack-query.md),
RxDB collections hold user-generated or frequently-mutated state (saved configs,
bookmarks, session history). The word library is the opposite: read-only,
ships with the app, replaced whole on every deploy, identical for every user.
IDB's strengths (persistence, indexed queries, mutation) target problems the
library doesn't have.

Concretely, for a ~100-entry corpus:

| Concern           | JSON + in-memory `.filter()` | RxDB collection + indexes    |
| ----------------- | ---------------------------- | ---------------------------- |
| Query performance | ~10µs over 100 entries       | ~1ms (IDB round-trip)        |
| Cold start        | One lazy chunk fetch (~30KB) | Fetch + seed + open IDB      |
| Schema evolution  | Redeploy JSON                | Migration on every data bump |
| Bundle/disk cost  | ~30–50KB gzipped             | Same + collection schema     |
| Test story        | Vitest reads JSON            | Integration test needs IDB   |

`Array.filter` over 100 objects is ~10 microseconds. An IDB query — even an
indexed one — costs more than that on the same corpus because of the
structured-clone bridge.

### 5.2 When to revisit

Two triggers would flip the decision toward RxDB. Either is sufficient:

1. **Corpus grows past ~1,000 words** _and_ filter queries become a measured
   frame-time bottleneck (not a guess).
2. **User-editable / teacher-uploaded word lists** — e.g. a parent imports the
   child's weekly spelling list. That data is mutable and per-user and
   deserves to live alongside bookmarks in RxDB.

Neither applies to the K–Y2 seed corpus.

### 5.3 The async signature protects future refactors

`filterWords()` returns `Promise<WordEntry[]>`. If we later swap the in-memory
implementation for an RxDB-backed one, the public API doesn't change — only
`filter.ts` internals. WordSpell, future games, and the filter UI keep working
against the same async call.

## 6. Filter API

```ts
// src/data/words/filter.ts
import type { WordEntry, WordFilter } from './types';

const chunkLoaders = import.meta.glob<{ default: WordEntry[] }>(
  './chunks/*.json',
);

const cache = new Map<string, WordEntry[]>();

async function loadAllChunks(): Promise<WordEntry[]> {
  if (cache.has('__all__')) return cache.get('__all__')!;

  const entries = await Promise.all(
    Object.entries(chunkLoaders).map(async ([path, load]) => {
      const mod = await load();
      cache.set(path, mod.default);
      return mod.default;
    }),
  );
  const flat = entries.flat();
  cache.set('__all__', flat);
  return flat;
}

export async function filterWords(
  filter: WordFilter,
): Promise<WordEntry[]> {
  const all = await loadAllChunks();
  return all.filter((entry) => entryMatches(entry, filter));
}
```

### 6.1 Matching semantics

- `region` is **required**. Entries whose `regions` array doesn't include it
  are excluded. Entries that omit `regions` are treated as `['aus','uk','us','br']`.
- `phases` matches against `entry.phases[region]` only — UK phases never leak
  into AUS filters.
- `grapheme` + `phoneme` must match **the same** `Grapheme` inside the entry.
  That's how "c = /k/" distinguishes from "c = /s/".
- `phoneme` alone matches any grapheme whose resolved phoneme (after
  per-region lookup) equals the value.
- `syllablesEq` / `syllablesMin` / `syllablesMax` are all optional; when
  multiple are set, all must hold.
- `tags` is an OR-match — any intersection passes.

### 6.2 Example calls

```ts
// "1-syllable words for /k/ spelled 'c', AUS region"
await filterWords({
  region: 'aus',
  grapheme: 'c',
  phoneme: 'k',
  syllablesEq: 1,
});
// → ['cat', 'cot', 'cup', ...]   NOT 'city' (c=/s/)   NOT 'child' (grapheme='ch')

// "any /k/ regardless of spelling, 1 syllable"
await filterWords({ region: 'aus', phoneme: 'k', syllablesEq: 1 });
// → ['cat', 'kite', 'duck', ...]

// "UK Phase 2 words"
await filterWords({ region: 'uk', phases: ['phase2'] });

// "AUS Foundation Unit 3, digraph 'ch' for /tʃ/"
await filterWords({
  region: 'aus',
  phases: ['f.unit3'],
  grapheme: 'ch',
  phoneme: 'tʃ',
});
```

### 6.3 Why load all chunks, not a manifest

- **Total corpus ≈ 100 words ≈ ~30–50 KB gzipped** — smaller than a single icon
  font. Targeted loading saves bytes that don't matter.
- **One-time cost.** After the first `filterWords` call, everything is in the
  `__all__` cache; subsequent calls are synchronous-fast.
- **No manifest to maintain.** Vite's `import.meta.glob` auto-discovers chunks.
- **Service worker precaches them automatically.** Workbox picks up every
  code-split chunk in its asset manifest during build. Offline mode works on
  first install without extra config.

If the corpus ever grows past ~1,000 words we add a manifest and do region-
scoped loading then. YAGNI for now.

## 7. Syllables

### 7.1 Storage

`syllables` is an array of strings: `['sun', 'set']`. Length is the count,
concatenation must equal `word`. The array doubles as the chunks rendered in
WordSpell's existing `tileUnit: 'syllable'` mode.

Tricky cases:

- **Silent `e` does not get its own syllable.** `cake` → `['cake']`, 1 syllable.
- **Digraphs never cross syllable boundaries.** `chicken` → `['chick', 'en']`,
  not `['chic', 'ken']`.
- **Regional syllable disagreement** (`fire`: 1 in AUS/UK, often 2 in US) uses
  the canonical spelling's dominant regional count. Document the choice in a
  comment in the chunk file. If it matters enough to diverge later, escalate
  to per-region `syllables` — not today.

### 7.2 Authoring

- **Manual first.** Every seed entry has hand-written `syllables`. At 100
  words this is tractable and produces the cleanest data.
- **Algorithmic backfill later.** When we scale past 100, a build step using
  the `syllable` npm package produces counts automatically for new imports.
  Manual overrides always win; the algorithm runs only where `syllables` is
  absent from the source. Not part of this spec's scope — called out so the
  data shape is ready.

## 8. Build-time validation

A new vitest file `src/data/words/words.test.ts` loads every JSON chunk from
disk and asserts invariants. Runs as part of the existing `yarn test` pre-push
gate — no new tooling.

```ts
// src/data/words/words.test.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { WordEntry } from './types';

const chunksDir = join(__dirname, 'chunks');
const chunks = readdirSync(chunksDir).filter((f) =>
  f.endsWith('.json'),
);

describe.each(chunks)('chunk %s', (chunkFile) => {
  const entries = JSON.parse(
    readFileSync(join(chunksDir, chunkFile), 'utf-8'),
  ) as WordEntry[];

  it.each(entries.map((e) => [e.word, e] as const))(
    '"%s" passes invariants',
    (_, entry) => {
      expect(entry.syllables.join('')).toBe(entry.word);
      expect(entry.graphemes.map((g) => g.g).join('')).toBe(entry.word);

      // Region ↔ IPA coverage
      if (typeof entry.ipa !== 'string') {
        for (const region of entry.regions ?? [
          'aus',
          'uk',
          'us',
          'br',
        ]) {
          expect(entry.ipa[region]).toBeDefined();
        }
      }

      // Per-region grapheme phoneme coverage
      for (const g of entry.graphemes) {
        if (typeof g.p !== 'string') {
          for (const region of entry.regions ?? [
            'aus',
            'uk',
            'us',
            'br',
          ]) {
            expect(g.p[region]).toBeDefined();
          }
        }
      }
    },
  );
});
```

Additional asserts in the same file:

- **Variants backlink** — if entry A has `variants: ['B']`, entry B must exist
  and must have `variants` including `'A'`.
- **No duplicate `word` within a single `regions` set.** Two entries can share
  a surface spelling only if their `regions` arrays are disjoint (e.g. a
  future homograph with per-region distinction).
- **Phase id shape.** Every phase id in `entry.phases[region]` must exist in
  `phases.ts` for that region. Prevents typos like `phase22`.

## 9. WordSpell integration

Two non-breaking additions.

### 9.1 New round source on `WordSpellConfig`

```ts
// src/games/word-spell/types.ts
export interface WordSpellConfig extends AnswerGameConfig {
  // ...existing fields
  rounds?: WordSpellRound[]; // existing — explicit rounds (back-compat)
  source?: {
    type: 'word-library';
    filter: WordFilter;
    limit?: number; // default = totalRounds
  };
}
```

If `rounds` is set, it wins (explicit authoring beats filter). If `source` is
set and `rounds` is absent, WordSpell calls `filterWords(source.filter)`, picks
`limit` entries, maps each through `toWordSpellRound()`, and uses the result as
the round list.

### 9.2 Adapter

```ts
// src/data/words/adapters.ts
import type { WordEntry } from './types';
import type { WordSpellRound } from '@/games/word-spell/types';

export const toWordSpellRound = (entry: WordEntry): WordSpellRound => ({
  // '-' matches the existing split regex at WordSpell.tsx:35 so syllable mode
  // renders chunks without any change to segmentsForWord().
  word: entry.syllables.join('-'),
});
```

### 9.3 Wiring inside `WordSpell`

The fetch happens during the existing **loading phase** per
[`docs/game-engine.md:1390`](../../game-engine.md#L1390). No new UI.

```ts
useEffect(() => {
  if (!wordSpellConfig.source) return; // legacy explicit-rounds path unchanged
  let cancelled = false;
  void (async () => {
    const entries = await filterWords(wordSpellConfig.source!.filter);
    if (cancelled) return;
    const limit =
      wordSpellConfig.source!.limit ?? wordSpellConfig.totalRounds;
    setRounds(entries.slice(0, limit).map(toWordSpellRound));
  })();
  return () => {
    cancelled = true;
  };
}, [wordSpellConfig]);
```

### 9.4 Ordering / sampling

`filterWords()` returns entries in a **deterministic order** — alphabetical by
chunk filename (which `import.meta.glob` uses), then source-file order within
each chunk. `entries.slice(0, limit)` therefore gives the same first-N every
time for the same filter. For randomised selection the existing
`roundsInOrder: false` config field controls shuffling downstream in
`buildRoundOrder`; it applies after the library filter produces the round
list, so no new shuffling logic is needed at this layer.

## 10. Seed corpus (~100 words)

Distribution skewed to K–Year 2, mapping 1:1 onto chunk files:

- **`core.json` (~40)** — UK Phase 2 / AUS Foundation units 1–5. SATPIN +
  mdgock + ckeur + hbffllss. Examples: `cat`, `sat`, `pin`, `tap`, `dog`,
  `map`, `run`, `big`, `sun`, `bed`, `hot`, `cup`, `duck`, `fish`. All 1
  syllable, mostly CVC.
- **`digraphs.json` (~20)** — UK Phase 3 / AUS Foundation units 6–8.
  Consonant digraphs `ch`, `sh`, `th` (voiced + voiceless), `ng`. Examples:
  `ship`, `chop`, `thin`, `this`, `ring`, `chat`, `shop`, `that`.
- **`long-vowels.json` (~15)** — UK Phase 3 / AUS Foundation units 9–10.
  Long-vowel digraphs and trigraphs `ai`, `ee`, `igh`, `oa`, `oo`, `ar`,
  `or`, `ur`, `ow`, `oi`. Examples: `rain`, `feet`, `night`, `boat`,
  `cool`, `car`, `for`, `girl`, `cow`, `coin`.
- **`split-digraphs.json` (~10)** — UK Phase 5 / AUS Year 1. `a_e`, `i_e`,
  `o_e`, `u_e`. Examples: `cake`, `kite`, `bone`, `cube`, `name`, `time`,
  `home`.
- **`multi-syllable.json` (~10)** — 2–3 syllable K–Y2 vocabulary. Examples:
  `sunset`, `catnap`, `rabbit`, `chicken`, `kitten`, `garden`, `hello`,
  `elephant`. One entry per word.
- **`regional.json` (~5)** — region-variant showcase. `tomato` (Case A),
  `aluminium` + `aluminum` (Case B pair), `colour` + `color` (Case B pair),
  `mum` + `mom` (Case B pair). Demonstrates both region-handling cases in
  tests and stories.

This distribution is the commit spec, not an aspiration — the seeding PR
creates these files with exactly these counts.

## 11. Out of scope for this spec

These are real follow-up features, not deferred parts of this one. Each gets
its own spec.

- **Parent filter UI** — new controls in the WordSpell config form that let a
  parent compose a `WordFilter`. This spec commits to the data shape the UI
  will consume; UI work is a separate plan.
- **pt-BR seed corpus** beyond the shape stub. Once the `en` pipeline is
  proven end-to-end, a follow-up can hand-author the BNCC vogais / sílabas
  simples set.
- **Bulk import pipeline** (CMU Pronouncing Dictionary, Wiktionary, Moby) for
  scaling past ~100 words. Requires an ingest script, provenance tracking,
  and a validation pass. Revisit when the corpus needs to grow.
- **Algorithmic syllable splitting** beyond counts. Current seed is 100%
  manually authored. Algorithmic backfill on import is a future concern.
- **Stress marks beyond IPA primary stress** (`ˈ`). No secondary stress (`ˌ`)
  unless the word needs it for disambiguation.
- **RxDB-backed library** — blocked on the two triggers in § 5.2.
- **Second word game adapters** (Word Builder, Read Aloud). Their adapters
  live in `src/data/words/adapters.ts` when those games ship, not now.

## 12. Open questions

None at design time. All region / scale / data-model / storage decisions are
committed above.

## 13. Affected files (new)

| File                                        | Purpose                                       |
| ------------------------------------------- | --------------------------------------------- |
| `src/data/words/types.ts`                   | Types (`WordEntry`, `Grapheme`, `WordFilter`) |
| `src/data/words/phases.ts`                  | Per-region phase lookup tables                |
| `src/data/words/phoneme-codes.ts`           | Teacher-code ↔ IPA alias table                |
| `src/data/words/filter.ts`                  | Async `filterWords()` + chunk cache           |
| `src/data/words/adapters.ts`                | `toWordSpellRound()`                          |
| `src/data/words/words.schema.json`          | Generated JSON schema for IDE validation      |
| `src/data/words/words.test.ts`              | Invariants + loader for all chunk JSON        |
| `src/data/words/index.ts`                   | Public API re-exports                         |
| `src/data/words/chunks/core.json`           | ~40 Phase 2 CVC words                         |
| `src/data/words/chunks/digraphs.json`       | ~20 Phase 3 consonant digraphs                |
| `src/data/words/chunks/long-vowels.json`    | ~15 Phase 3 long-vowel digraphs/trigraphs     |
| `src/data/words/chunks/split-digraphs.json` | ~10 Phase 5 split digraphs                    |
| `src/data/words/chunks/multi-syllable.json` | ~10 2–3 syllable words                        |
| `src/data/words/chunks/regional.json`       | ~5 region-variant showcase words              |

## 14. Affected files (edited)

| File                                           | Change                                 |
| ---------------------------------------------- | -------------------------------------- |
| `src/games/word-spell/types.ts`                | Add `source?: { type, filter, limit }` |
| `src/games/word-spell/WordSpell/WordSpell.tsx` | Resolve `source` → rounds on load      |
