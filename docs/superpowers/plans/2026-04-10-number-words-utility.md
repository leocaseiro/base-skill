# Number Words Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locale-aware number↔text conversion utility for the MatchNumber
game's word/ordinal modes, backed by `n2words`.

**Tech Stack:** TypeScript, `n2words` v4, Vitest

**Spec:**
[docs/superpowers/specs/2026-04-10-match-number-improvements-design.md](../specs/2026-04-10-match-number-improvements-design.md)
(Section 2 — Mode Bug Fix + New Modes)

---

## File Map

### New files

- `src/games/number-match/number-words.ts` — utility module
- `src/games/number-match/number-words.test.ts` — unit tests

### Modified files

- `package.json` — add `n2words` dependency

---

## API Surface

```typescript
type AppLocale = 'en' | 'pt-BR';

/** Cardinal text: 7 → "seven" (en) / "sete" (pt-BR) */
const toCardinalText: (n: number, locale: AppLocale) => string;

/** Ordinal text: 7 → "seventh" (en) / "sétimo" (pt-BR) */
const toOrdinalText: (n: number, locale: AppLocale) => string;

/** Ordinal number: 7 → "7th" (en) / "7º" (pt-BR) */
const toOrdinalNumber: (n: number, locale: AppLocale) => string;
```

### Locale mapping

| App locale | `n2words` import |
| ---------- | ---------------- |
| `en`       | `n2words/en-AU`  |
| `pt-BR`    | `n2words/pt-PT`  |

### Ordinal suffix logic (no package needed)

- **English:** 1st, 2nd, 3rd, 4th–20th, 21st, 22nd... (standard suffix rules)
- **Portuguese:** always `º` (e.g. `1º`, `7º`, `12º`)

---

## Steps

- [ ] **Step 1 — Install `n2words`**
  - `cd worktrees/match-number-improvements && yarn add n2words`
  - Verify it resolves: `yarn why n2words`

- [ ] **Step 2 — Create `number-words.ts`**
  - File: `src/games/number-match/number-words.ts`
  - Import `toCardinal`/`toOrdinal` from `n2words/en-AU` and `n2words/pt-PT`
  - Export three named functions: `toCardinalText`, `toOrdinalText`,
    `toOrdinalNumber`
  - `toOrdinalNumber` uses inline suffix logic (no extra dependency)
  - No default exports

- [ ] **Step 3 — Create `number-words.test.ts`**
  - File: `src/games/number-match/number-words.test.ts`
  - Test all three functions for both locales across the full game range (1–12)
  - Cardinal assertions: `1 → "one"`, `7 → "seven"`, `12 → "twelve"` (en);
    `1 → "um"`, `7 → "sete"`, `12 → "doze"` (pt-BR)
  - Ordinal text assertions: `1 → "first"`, `7 → "seventh"` (en);
    `1 → "primeiro"`, `7 → "sétimo"` (pt-BR)
  - Ordinal number assertions: `1 → "1st"`, `2 → "2nd"`, `3 → "3rd"`,
    `7 → "7th"`, `11 → "11th"`, `12 → "12th"` (en);
    `1 → "1º"`, `7 → "7º"`, `12 → "12º"` (pt-BR)
  - Run: `yarn test src/games/number-match/number-words.test.ts`

- [ ] **Step 4 — Verify**
  - `yarn typecheck` passes
  - `yarn lint` passes
  - `yarn test` passes
