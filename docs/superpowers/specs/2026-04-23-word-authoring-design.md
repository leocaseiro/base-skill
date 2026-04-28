# Word Authoring (Make Up New Words) — Design

> **Status:** Draft v1 · **Owner:** @leocaseiro · **Region focus:** AUS only (v1) · **Builds on:** [2026-04-11-phonics-word-library-design.md](./2026-04-11-phonics-word-library-design.md) (P2 evolution)
> **Scope:** Curator-only authoring of new words via the in-app `WordLibraryExplorer`. Drafts persist to IndexedDB so authoring works on the deployed GitHub Pages build, on mobile, or in dev. A separate `yarn words:import` CLI merges exports into the canonical curriculum JSON files for PR review.

## 1. Goal

Today the `WordLibraryExplorer` is read-only. Searching for a word that isn't in the seeded corpus (~650 AUS words) silently returns no results. The curator (currently the project owner) can't add the missing word from inside the app — they'd have to hand-edit two JSON files, compute IPA + grapheme alignment manually, and pick the right level file by hand.

This spec adds a **"Make up word"** flow inside the explorer that:

1. Auto-generates an IPA + syllables + grapheme→phoneme breakdown for any typed word, using RitaJS for phonemes/syllables and a greedy aligner that learns from the existing curriculum.
2. Lets the curator review/edit the breakdown in a focused authoring UI.
3. Saves the result as a draft in IndexedDB, viewable alongside shipped words in the explorer.
4. Exports drafts as a portable JSON file the curator can carry to their dev machine.
5. Provides a Node CLI (`yarn words:import`) that merges exported drafts into the canonical `core/levelN.json` and `curriculum/aus/levelN.json` files for PR review.

The corpus grows from real authoring sessions (including impromptu ones during demos), without forcing the curator back to a code editor for every entry.

## 2. Project context

This is the **P2 evolution** of the original phonics word library design. The earlier P2 sketch ("Storybook form + Vite middleware") is superseded by this spec. Key shifts from the original sketch:

| Original P2 sketch                 | This spec                                                |
| ---------------------------------- | -------------------------------------------------------- |
| Storybook-only authoring form      | In-app authoring inside `WordLibraryExplorer`            |
| Vite middleware writes JSON in dev | IndexedDB drafts + portable export + offline CLI import  |
| Dev-machine only                   | Works in GH Pages prod, on mobile, anywhere the app runs |
| Manual breakdown entry             | Auto-generated breakdown via RitaJS + greedy aligner     |

**P3 (user word bags for parents/teachers)** remains a separate, deferred spec. It will reuse this spec's `engine.ts`, `aligner.ts`, and `draftStore.ts` modules — they are designed with that reuse in mind.

## 3. User flow

### 3.1 Trigger points

Two ways to enter the authoring flow:

1. **Empty-state CTA** — when search returns 0 hits, the empty state shows _"No matches for **`<word>`**. ✨ Make up this word?"_ Clicking opens the authoring modal pre-filled with the typed word.
2. **Always-visible button** — a `+ New word` button next to the search bar opens the authoring modal with an empty word field.

### 3.2 Authoring modal

Presentation: centered modal with backdrop on desktop; full-screen on mobile (no visible backdrop, feels like a page). ESC / system back closes after a confirm-discard prompt if the form is dirty.

Top-to-bottom layout:

1. **Word field** — pre-filled if entered via empty-state CTA; editing it re-runs the engine (debounced 400 ms).
2. **Unknown-word banner** — appears iff `RiTa.isKnownWord(word) === false`:
   _"RitaJS doesn't know **`<word>`**. Look it up → [Open in dictionary.com](https://www.dictionary.com/browse/<word>)"_ (opens in a new tab). When this banner shows, IPA and graphemes are **not pre-filled** — curator types IPA manually, then the aligner runs on the manual phonemes.
3. **IPA field** — text input, free-edit. Pre-filled from RitaJS when known.
4. **Syllable chips** — `[put][·][ting]` with drag-to-move split markers.
5. **Level selector** — dropdown 1–8. Auto-suggested from highest grapheme level present in the alignment (using existing `GRAPHEMES_BY_LEVEL`). Label shows _"(suggested L3 — highest grapheme used: sh)"_. Curator can override.
6. **Grapheme breakdown row** — horizontal chips, each showing `g` over `p`. Tap a chip to open an inline editor with:
   - Letter-range adjusters (extend/shrink the grapheme).
   - Phoneme picker (dropdown sourced from existing `PHONEME_CODE_TO_IPA` inventory).
   - Low-confidence chips (greedy aligner couldn't find a strong corpus match) get an amber border.
7. **Variants** — optional comma-separated input.
8. **Save draft** / **Cancel** buttons. `Save draft` is disabled (with an inline hint) if the typed word already exists in shipped data — see §5.2.

### 3.3 Save → draft visible in explorer

`Save draft` writes to IndexedDB. The modal closes; a toast confirms _"Draft saved: `<word>`"_. The word now appears in subsequent search results, sorted naturally and badged `✏️ draft (unsynced)` distinct from shipped words' `📚 shipped` badge.

### 3.4 Drafts management

A `Drafts (N)` link in the explorer header opens a drafts panel listing all unsynced drafts (word · level · last edited time · `[Edit]` · `[Delete]`). At the top of the panel: an **`Export drafts (N)`** button that downloads `wordlib-export-<ISO timestamp>.json` via `URL.createObjectURL`.

### 3.5 Sync: bringing drafts into the canonical corpus

The export → import loop is intentionally manual and explicit:

1. Curator clicks **Export drafts** (in any environment — prod, mobile, dev). Browser downloads a JSON file.
2. Curator transfers the file to their dev machine (AirDrop, email-to-self, iCloud Drive, etc.).
3. On their dev machine inside the project repo:

   ```bash
   yarn words:import ~/Downloads/wordlib-export-2026-04-23T22-14-00Z.json
   ```

4. The CLI merges entries into the right `core/levelN.json` + `curriculum/aus/levelN.json` files, preserving sort order and indentation.
5. `git diff` shows the changes; curator commits + opens PR by hand.

No auto-commit, no auto-push, no GitHub API calls — the curator stays in control of the PR boundary.

## 4. Architecture

Five new modules. Four ship in the browser bundle; one is Node-only.

| Module                         | Location                    | Bundle  | Responsibility                                                                                                |
| ------------------------------ | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `authoring/engine.ts`          | `src/data/words/authoring/` | Browser | Wraps RitaJS: `generateBreakdown(word) → {ipa, syllables, phonemes, ritaKnown}`. Lazy-imports `rita`. Pure.   |
| `authoring/aligner.ts`         | `src/data/words/authoring/` | Browser | Greedy letter-to-phoneme aligner. Loads g→p frequencies from shipped curriculum at module init. Pure.         |
| `authoring/draftStore.ts`      | `src/data/words/authoring/` | Browser | IndexedDB wrapper (via `idb`). CRUD + export.                                                                 |
| `authoring/AuthoringPanel.tsx` | `src/data/words/authoring/` | Browser | The modal/full-screen review UI. Storybook + VR coverage.                                                     |
| `scripts/words-import.ts`      | `scripts/`                  | Node    | CLI: validates export JSON; merges into `core/*.json` + `curriculum/aus/*.json`; preserves sort + formatting. |

Existing modules touched (minimal):

- `WordLibraryExplorer.tsx` — adds the two entry points (empty-state CTA + `+ New word` button); renders the modal; surfaces `Drafts (N)` link.
- `filter.ts` — read-path merges shipped + drafts; results carry `provenance` + optional `draftId`.
- `types.ts` — adds `DraftEntry`, `Provenance`; extends `WordHit` with `provenance` and `draftId?`.

### 4.1 Lazy-loading RitaJS

RitaJS is ~150 KB gzipped. It is **dynamically imported** inside `engine.ts` on first call to `generateBreakdown`. The authoring panel triggers this on open (or earlier on hover, as a perf improvement we may add later). Users who never open the authoring panel never download the RitaJS chunk.

### 4.2 Dependency policy

| Dependency | Where          | Notes                                                                                 |
| ---------- | -------------- | ------------------------------------------------------------------------------------- |
| `rita`     | Browser, lazy  | Phoneme + syllable generation. Bundled in a separate Vite chunk via `import('rita')`. |
| `idb`      | Browser, eager | ~3 KB, promise-based IndexedDB wrapper. Used by `draftStore.ts`.                      |
| `zod`      | Node + Browser | Schema validation for export JSON (already in devDeps).                               |
| `uuid`     | Browser        | Draft IDs. Lightweight; if already present in deps reuse, else add `uuid` v7.         |

## 5. Data model

### 5.1 New types (`src/data/words/types.ts`)

```ts
export type Provenance = 'shipped' | 'draft';

export interface DraftEntry {
  /** UUID v7 string. IndexedDB keyPath. */
  id: string;
  word: string;
  region: 'aus'; // v1 locked; future-extensible
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  ipa: string;
  /** Syllable splits, e.g. ['put', 'ting']. join('') === word. */
  syllables: string[];
  syllableCount: number;
  graphemes: Grapheme[]; // existing { g, p, span? } shape
  variants?: string[];
  /** True if RitaJS knew the word at authoring time. False → unknown-word banner persists across edits. */
  ritaKnown: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// WordHit gains:
export interface WordHit {
  // …existing fields…
  provenance: Provenance;
  draftId?: string; // present iff provenance === 'draft'
}
```

### 5.2 Conflict policy

A draft can only exist for a word **not** already in shipped data. The "+ New word" flow checks shipped first; if the word exists, the panel opens that shipped entry in a read-only preview (revising shipped words is out of scope for v1 — see §10).

This rule is enforced in three places:

1. The authoring panel's word field — typing a shipped word disables `Save draft` with a hint.
2. `draftStore.saveDraft` — rejects if `[region, word]` collides with a shipped entry (lookup against the in-memory shipped index).
3. The CLI import (`yarn words:import`) — rejects entries that collide with shipped data, with a clear skip message.

### 5.3 IndexedDB schema (`authoring/draftStore.ts`)

- Database name: `basekill-word-drafts`
- Version: `1`
- Object store: `drafts`, `keyPath: 'id'`
- Indexes:
  - `byRegionWord` on `[region, word]` — `unique: true`
  - `byRegionLevel` on `[region, level]` — non-unique
- Migration policy: explicit `onupgradeneeded` handler keyed off version; v1 creates the store + indexes from scratch.

### 5.4 Export file shape

```json
{
  "version": 1,
  "exportedAt": "2026-04-23T22:14:00.000Z",
  "drafts": [
    {
      "word": "putting",
      "region": "aus",
      "level": 3,
      "ipa": "ˈpʊtɪŋ",
      "syllables": ["put", "ting"],
      "syllableCount": 2,
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "u", "p": "ʊ" },
        { "g": "tt", "p": "t" },
        { "g": "ing", "p": "ɪŋ" }
      ],
      "ritaKnown": true,
      "createdAt": "2026-04-23T21:55:00.000Z",
      "updatedAt": "2026-04-23T22:13:42.000Z"
    }
  ]
}
```

The `id` field is intentionally **omitted** from exports — the receiving environment may have unrelated drafts with the same UUID. Identity is keyed on `[region, word]` for import purposes.

### 5.5 Read-path merge

`filter.ts`'s `filterWords()` becomes async-merging:

1. Load shipped chunks (existing path).
2. Call `draftStore.listDrafts({ region })` in parallel.
3. Apply the same filter predicates (`level`, `syllableCount`, grapheme filters, prefix match) to drafts.
4. Tag each result with `provenance` + optional `draftId`.
5. Sort the unified result set by the same sort key shipped results use.

Drafts respect every existing filter so the user experience is uniform — searching "put" returns the shipped word "put" and the draft "putting" together if both match.

## 6. Auto-alignment engine

### 6.1 RitaJS adapter (`authoring/engine.ts`)

```ts
export interface Breakdown {
  word: string;
  ipa: string; // e.g., 'pʊtɪŋ'
  syllables: string[]; // e.g., ['put', 'ting']
  phonemes: string[]; // ordered, e.g., ['p', 'ʊ', 't', 'ɪ', 'ŋ']
  ritaKnown: boolean;
}

export async function generateBreakdown(
  word: string,
): Promise<Breakdown>;
```

Implementation outline:

1. Lazy-import RitaJS: `const { RiTa } = await import('rita');`
2. `ritaKnown = RiTa.isKnownWord(word)`
3. If `ritaKnown`:
   - `RiTa.phones(word, { silent: true })` → ARPABET string e.g. `"p-uh1 t-ih-ng"`
   - `RiTa.syllables(word, { silent: true })` → e.g. `"p-uh/t-ih-ng"`
   - Convert ARPABET → IPA via static map (~40 entries: `AH→ʌ, UH→ʊ, IH→ɪ, NG→ŋ, …`).
   - Strip stress markers; produce `phonemes[]` and `ipa` (concatenated phonemes).
   - Derive `syllables[]` from the slash-separated syllable string by mapping phonemes back to letters via the aligner (or, simpler v1: rely on a separate syllable-letter heuristic — see §6.3).
4. If `!ritaKnown`:
   - Return `{ word, ipa: '', syllables: [], phonemes: [], ritaKnown: false }`. The UI handles unknown-word UX (dictionary.com link, manual IPA entry).

### 6.2 Greedy aligner (`authoring/aligner.ts`)

```ts
export interface AlignedGrapheme extends Grapheme {
  /** 0–1; lower = aligner less confident. UI flags <0.5 in amber. */
  confidence: number;
}

export function align(
  word: string,
  phonemes: string[],
): AlignedGrapheme[];
```

Implementation outline:

1. **At module init**, scan every shipped `curriculum/aus/levelN.json` and build:

   ```ts
   const gpFreq = new Map<
     string /* grapheme */,
     Map<string /* phoneme */, number /* count */>
   >();
   const knownMultiLetter = new Set<string>(); // 'sh', 'ch', 'th', 'ng', 'oo', 'ee', 'ai', 'oa', 'ck', 'tt', 'ing', 'igh', …
   const splitDigraphs = ['a_e', 'i_e', 'o_e', 'u_e', 'e_e'];
   ```

   Walk every existing entry's `graphemes[]`; tally each `(g, p)` pair into `gpFreq`; collect any `g.length > 1` into `knownMultiLetter`.

2. **Greedy match left-to-right** over the word's letters:

   ```text
   letterIdx = 0
   phonemeIdx = 0
   while letterIdx < word.length:
     candidates = pick longest-match graphemes starting at letterIdx (max length 4)
                  + always include single-letter grapheme as fallback
                  + add split-digraph candidates if pattern matches downstream letters
     pick the candidate where (candidate.g, phonemes[phonemeIdx]) has highest gpFreq
     if no known mapping: pick longest candidate, mark confidence ≈ 0.2
     emit { g, p: phonemes[phonemeIdx], span?: <if split-digraph>, confidence }
     letterIdx += candidate.g.length (or jump for split digraph)
     phonemeIdx += 1
   ```

3. **Silent letters** absorb into the preceding grapheme. After a successful pair, if `letterIdx < word.length` but `phonemeIdx === phonemes.length`, append the remaining letters onto the last emitted grapheme (matches existing `{g:'ld', p:'d'}` pattern in "should").

4. **Confidence score** per pair:
   - Top-frequency grapheme for that phoneme: `1.0`
   - Otherwise: `count / max_count_for_phoneme`
   - Unseen mapping: `0.2`

This is intentionally simple. It will misalign on unfamiliar digraphs and on words with non-standard spelling; the chip-edit UI exists precisely for those corrections. A more accurate DP aligner with corpus-learned costs is tracked as a follow-up GH issue (see §10).

### 6.3 Syllable-to-letter mapping

RitaJS gives syllable splits in _phoneme_ space (`"p-uh/t-ih-ng"`); the data model needs `syllables[]` in _letter_ space (`["put", "ting"]`). Strategy for v1:

1. Run the aligner to get `graphemes[]`.
2. Walk graphemes and phonemes in parallel; whenever a phoneme crosses a syllable boundary in RitaJS's output, place the boundary between the corresponding graphemes in letter space.

If this proves brittle, fallback: ask the curator to confirm/edit syllable boundaries via the syllable chip UI (already in the design).

## 7. CLI: `yarn words:import`

### 7.1 Invocation

```bash
yarn words:import <path-to-export.json>
```

Exits non-zero if any entries fail validation. Idempotent: re-running with an already-imported file surfaces skip warnings, doesn't double-write.

### 7.2 Algorithm (per draft entry)

1. **Validate** against a Zod schema:
   - `word` non-empty, lowercase letters only (no whitespace, no proper-noun caps).
   - `region` exactly `'aus'` (until other regions are seeded).
   - `level` in `1..8`.
   - `ipa` non-empty.
   - `syllables[].join('') === word`.
   - `graphemes[]` non-empty; concatenating `g` values (after expanding split-digraph spans) equals `word`.
   - All `p` values are present in the project's phoneme inventory (`PHONEME_CODE_TO_IPA` values).
2. **Check shipped duplicates** — load the relevant `core/level<level>.json` (and adjacent levels if level seems wrong) and reject if `word` already exists. Reject reason printed.
3. **Upsert into `core/level<level>.json`:**
   - Build a `WordCore` from the draft (`{ word, syllableCount, syllables }`; copy `variants` if present).
   - Append, re-sort alphabetically by `word`, write back with 2-space indent + trailing newline.
4. **Upsert into `curriculum/aus/level<level>.json`:**
   - Build a `CurriculumEntry` (`{ word, level, ipa, graphemes }`).
   - Append, re-sort alphabetically, write back same formatting.
5. **Summary output:**

   ```text
   ✓ putting → core/level3.json, curriculum/aus/level3.json
   ✓ should  → core/level4.json, curriculum/aus/level4.json
   ⚠ qxz     → skipped: word already exists in core/level5.json

   Imported 2 of 3 entries. Review with `git diff` before committing.
   ```

6. Returns exit code `0` on full success, `1` if any entry failed validation, `2` if file I/O failed.

### 7.3 Safety properties

- **No git operations** — script writes JSON files only. Curator owns the commit.
- **No network** — pure local file I/O.
- **Formatting preserved** — script reads file, mutates the parsed array, writes back with `JSON.stringify(arr, null, 2) + '\n'` to match existing chunk style. Run `yarn fix:md` is not needed (these are JSON, not markdown).
- **Atomic per file** — collect all writes for a level file in memory, write once. If validation fails partway through a batch, files written so far stay; future entries don't write. Summary clarifies which entries succeeded.

## 8. UI affordances summary

| Surface                 | Component                                | New / Modified | Notes                                                                |
| ----------------------- | ---------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Empty-state CTA         | `WordLibraryExplorer.tsx`                | Modified       | Replaces silent "no results" with the CTA shown in §3.1.             |
| `+ New word` button     | `WordLibraryExplorer.tsx`                | Modified       | Sits next to the search bar. Always visible.                         |
| `Drafts (N)` link       | `WordLibraryExplorer.tsx`                | Modified       | Header link. Hidden when `N === 0`.                                  |
| Authoring modal         | `authoring/AuthoringPanel.tsx`           | New            | Modal on desktop, full-screen on mobile.                             |
| Grapheme chip editor    | `authoring/AuthoringPanel.tsx` (sub)     | New            | Inline expansion of a chip; letter-range adjusters + phoneme picker. |
| Drafts panel            | `authoring/DraftsPanel.tsx`              | New            | List + edit/delete + export button.                                  |
| Result card draft badge | `WordLibraryExplorer.tsx` (`ResultCard`) | Modified       | `📚 shipped` vs `✏️ draft (unsynced)`.                               |

Modal accessibility:

- Focus trap when open; focus returns to trigger element on close.
- ESC closes after dirty-form confirm.
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title.
- Mobile full-screen presentation uses `<dialog>` element for native semantics where supported.

## 9. Testing strategy

Per CLAUDE.md, every module follows red-green-refactor TDD.

**`authoring/engine.ts`** (`engine.test.ts`):

- Known word → IPA + syllables + phonemes shape correct.
- Unknown word → `ritaKnown: false`, empty fields.
- ARPABET→IPA map covers all 40 ARPABET symbols.
- RitaJS mocked at module boundary.

**`authoring/aligner.ts`** (`aligner.test.ts`):

- Golden fixtures of ~20 shipped words — alignment must reproduce the curated `graphemes[]`.
- Tricky-word table: `should`, `putting`, `cake`, `laugh`, `knight`, `church`, `mouse`.

**`authoring/draftStore.ts`** (`draftStore.test.ts`):

- CRUD against `fake-indexeddb`.
- Unique `[region, word]` index enforced.
- `exportDrafts` round-trips through validation.
- Quota-exceeded handled gracefully.

**`filter.ts`** (extended `filter.test.ts`):

- Drafts flow through every existing filter.
- Provenance tagged on every result.
- Mixed shipped + draft results sort consistently.

**`authoring/AuthoringPanel.tsx`** (`AuthoringPanel.test.tsx` + Storybook):

- Typing → debounced engine call → render.
- Chip edit updates state.
- Save calls `draftStore.saveDraft`.
- Cancel discards (with dirty-confirm).
- Duplicate-of-shipped disables Save.

**`scripts/words-import.ts`** (`words-import.test.ts`):

- Tmpdir fixtures: valid import merges + sorts + preserves formatting.
- Duplicate rejection.
- Bad schema rejection.
- Partial failure summary.
- Idempotency on re-run.

### 9.1 Storybook

- `AuthoringPanel/Default` — happy path with "putting" pre-filled.
- `AuthoringPanel/UnknownWord` — Rita-unknown banner + dictionary.com link.
- `AuthoringPanel/LowConfidenceChips` — amber chips on a tricky word.
- `AuthoringPanel/DuplicateOfShipped` — Save disabled with hint.
- `DraftsPanel/Empty` and `DraftsPanel/WithDrafts`.
- `WordLibraryExplorer/EmptyStateCTA` — search returns 0, CTA visible.
- `WordLibraryExplorer/WithDraftBadge` — shipped + draft side by side.

### 9.2 Visual regression

Two viewports per relevant story (mobile + desktop):

- `AuthoringPanel/Default`
- `AuthoringPanel/UnknownWord`
- `WordLibraryExplorer/WithDraftBadge`

### 9.3 Out of testing scope

- RitaJS itself (third-party dependency).
- IndexedDB browser implementation (`fake-indexeddb` covers behaviour we care about).
- Cross-browser file-download UX (mature browser API).

## 10. Out of scope (deferred)

| Feature                                   | Why deferred                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **User word bags (Spec C / P3)**          | Parents/teachers feature. Reuses `engine.ts`, `aligner.ts`, `draftStore.ts` from this spec.                |
| **Editing / revising shipped words**      | Requires conflict-resolution UX and a "promote draft over shipped" policy. New-words-only for v1.          |
| **Multi-region authoring (UK / US / BR)** | None of those curricula are seeded yet. Region locked to `'aus'`. Unlock per region once it has seed data. |
| **GitHub-PR one-click from export**       | Requires PAT auth, secure token storage, security review. Stretch goal after v1 lands.                     |
| **DP aligner with corpus-learned costs**  | Greedy v1 first. GH issue tracks the upgrade based on real-world misalignment data.                        |
| **Bulk import from dictionary / CSV**     | v1 is one-word-at-a-time authoring. Bulk authoring is a separate workflow.                                 |
| **Audio playback of authored draft**      | Already works "for free" — `PhonemeBlender` consumes any entry with `graphemes[]`, which drafts have.      |

## 11. Open risks

| Risk                                  | Mitigation                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Greedy aligner accuracy on rare words | Chip-edit UI; low-confidence amber highlight; GH issue for DP upgrade tracks accuracy data.             |
| RitaJS bundle size (~150 KB gzipped)  | Dynamic import (lazy-loaded only when authoring panel opens). Users who never author never download it. |
| RitaJS US-leaning IPA on AUS words    | Curator can edit IPA freely. Common AUS-specific corrections (`dance`, `bath`, `castle`) noted in PR.   |
| IndexedDB quota                       | Drafts <1 KB each; `QuotaExceededError` surfaces a friendly toast and disables Save until cleared.      |
| Cross-device draft transfer friction  | Acceptable for v1. Auto-PR feature solves it later.                                                     |
| Schema drift (draft vs shipped data)  | Zod validation in CLI catches mismatches; field changes require draft-store version bump.               |

## 12. Naming + file layout

```text
src/data/words/
├── authoring/
│   ├── engine.ts                  // RitaJS adapter
│   ├── engine.test.ts
│   ├── aligner.ts                 // greedy g→p aligner
│   ├── aligner.test.ts
│   ├── draftStore.ts              // IndexedDB wrapper
│   ├── draftStore.test.ts
│   ├── AuthoringPanel.tsx         // modal / full-screen UI
│   ├── AuthoringPanel.test.tsx
│   ├── AuthoringPanel.stories.tsx
│   ├── DraftsPanel.tsx
│   ├── DraftsPanel.stories.tsx
│   └── arpabet-to-ipa.ts          // static conversion map
├── filter.ts                      // extended for draft merge
├── types.ts                       // extended with DraftEntry, Provenance
└── WordLibraryExplorer.tsx        // entry points + drafts link

scripts/
├── words-import.ts                // CLI
└── words-import.test.ts
```

## 13. Acceptance criteria

The spec is satisfied when all of the following are true:

1. Searching for a missing word in `WordLibraryExplorer` shows the empty-state CTA.
2. Clicking the CTA (or `+ New word`) opens the authoring modal.
3. For a Rita-known word ("putting"), the modal pre-fills IPA, syllables, level suggestion, and grapheme chips.
4. For a Rita-unknown word, the modal shows the dictionary.com link banner, and Save remains disabled until IPA is filled.
5. Saving a draft persists it to IndexedDB and shows it in subsequent search results with the draft badge.
6. The `Drafts (N)` link opens a panel listing drafts with edit / delete / export controls.
7. Exporting drafts downloads a JSON file matching the §5.4 shape.
8. `yarn words:import <file>` merges entries into the right `core/levelN.json` + `curriculum/aus/levelN.json` files, preserves alphabetical sort, preserves indentation, and rejects duplicates.
9. All new modules have tests written first (TDD).
10. Storybook stories listed in §9.1 exist and render.
11. VR baselines for §9.2 stories are committed.
12. Existing `WordLibraryExplorer` stories and tests still pass.
13. `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, `yarn lint:md`, `yarn test:vr` all pass on the PR.

## 14. References

- [2026-04-11-phonics-word-library-design.md](./2026-04-11-phonics-word-library-design.md) — original library design (P1 shipped; this spec supersedes the original P2 sketch)
- [RitaJS phones reference](https://www.rednoise.org/rita/reference/phones.html)
- [RitaJS syllables reference](https://www.rednoise.org/rita/reference/RiTa/syllables/index.html)
- [`idb` library](https://github.com/jakearchibald/idb)
