# Confusable SpotAll Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite SpotAll to integrate with the GameEngine + skin system, ship the missing R5b reversibles dataset, and extract a reusable distractor library — closing all 12 gaps PR #252 left open.

**Architecture:** Five-layer split (L1 GameShell · L2 reused AnswerGame primitives · L3 confusables data · L4 NEW `src/lib/distractors/` · L5 SpotAll game code). Per-tap auto-validate replaces the Check button. Distractor library uses a `DistractorSource` interface with a registry and a deterministic `compose(...)`. Visual variation reads CSS-token colours via `--skin-variation-N` so any skin can override.

**Tech Stack:** React 18 · TypeScript · TanStack Router · Vitest (unit) · Playwright (E2E + VR) · Storybook 8 · Tailwind v4 · CSS custom properties for skin tokens.

**Spec:** [`docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`](../specs/2026-04-30-confusable-spotall-redesign-design.md)

---

## Spec Deltas

The following intentional deviations from the spec — flag them in the PR description.

### 1. VR / E2E test placement

**Spec says:** `tests-vr/spot-all/spot-all.test.ts` (NEW) and `tests-e2e/spot-all/spot-all.e2e.ts` (NEW).

**Plan does:** appends `@visual` test to existing `e2e/visual.spec.ts` and creates new functional file `e2e/spot-all.spec.ts`.

**Why:** the project skill `write-e2e-vr-tests` is authoritative for test placement and mandates this layout. Per CLAUDE.md, the skill overrides the plan when they conflict — flagging it here so reviewers know it was deliberate, not boilerplate drift. (Re-confirmed: `playwright.config.ts` sets `testDir: './e2e'` — there is no `tests-vr/` or `tests-e2e/` in this repo.)

### 2. Distractor library architecture doc

**Spec says:** create `src/lib/distractors/distractors.mdx`.

**Plan does:** the same — but classifies it as plain documentation, not architecture-doc territory. The `update-architecture-docs` skill is scoped to game-state files (under `src/components/answer-game/`, `src/lib/game-engine/`, `*reducer*`, `*Behavior*`); the distractor library is none of those, so the mdx is a quick library README and does NOT trigger that skill's checklist.

---

## Pre-flight (read once, then start)

- **Worktree** is `worktrees/feat/confusable-spotall` (already on branch `feat/confusable-spotall`, PR #252 open). Do not create a new worktree.
- **Commit cadence:** one commit per task (T-numbered). Commit messages should reference the spec section (e.g., `feat(spot-all): R5b data layer (spec §2)`).
- **Skip flags allowed on intermediate commits** if a check fails because dependent code lands later — document the reason in the commit message (project memory: `feedback_skip_hooks_minor.md`).
- **`yarn fix:md`** must be run after editing **any** `.md` file you author. Project rule.
- **Do NOT** modify the handoff at `.claude/handoffs/2026-04-30-spotall-redesign-spec.md`. Prettier reflows it incorrectly — leave it untouched.

---

## File Structure

Layers stay strictly bottom-up; no upward imports. Files that change together are co-located.

```text
L3 — src/data/confusables/
├── confusable-sets.json                        (KEEP)
├── reversible-characters.json                  (NEW — U1)
├── types.ts                                    (EXTEND — U1)
├── query.ts                                    (EXTEND — U1)
└── query.test.ts                               (EXTEND — U1)

L4 — src/lib/distractors/                       (ENTIRELY NEW — U2)
├── types.ts
├── registry.ts
├── compose.ts
├── compose.test.ts
├── distractors.mdx
└── sources/
    ├── confusable-pairs.ts
    ├── confusable-pairs.test.ts
    ├── reversible-chars.ts
    └── reversible-chars.test.ts

L5 — src/games/spot-all/                        (REWRITE — U3-U8)
├── types.ts                                    (REWRITE — U5)
├── confusable-pair-groups.ts                   (NEW — U4)
├── confusable-pair-groups.test.ts              (NEW — U4)
├── visual-variation/
│   ├── pools.ts                                (NEW — U3)
│   ├── pick-variation.ts                       (NEW — U3)
│   └── pick-variation.test.ts                  (NEW — U3)
├── build-spot-all-round.ts                     (REWRITE — U5)
├── build-spot-all-round.test.ts                (REWRITE — U5)
├── spot-all-reducer.ts                         (REWRITE — U5)
├── spot-all-reducer.test.ts                    (REWRITE — U5)
├── resolve-simple-config.ts                    (REWRITE — U5)
├── resolve-simple-config.test.ts               (UPDATE — U5)
├── SpotAllTile/SpotAllTile.tsx                 (REWRITE — U6)
├── SpotAllGrid/SpotAllGrid.tsx                 (REWRITE — U6)
├── SpotAllPrompt/SpotAllPrompt.tsx             (REWRITE — U6)
├── SpotAll/SpotAll.tsx                         (REWRITE — U7)
├── SpotAll/SpotAll.test.tsx                    (UPDATE — U7)
├── SpotAllConfigForm/SpotAllConfigForm.tsx     (REWRITE — U8)
└── SpotAllConfigForm/SpotAllConfigForm.test.tsx (NEW — U8)

Wiring + i18n + skin (U9)
├── src/lib/skin/registry.ts                    (UPDATE — register spot-all)
├── src/lib/skin/classic-skin.ts                (EXTEND — variation tokens — U3)
├── src/games/config-fields-registry.tsx        (UPDATE — advanced fields)
├── src/routes/$locale/_app/game/$gameId.tsx    (UPDATE — resolveSpotAllConfig)
├── src/lib/i18n/locales/en/games.json          (UPDATE — spot-all keys)
└── src/lib/i18n/locales/pt-BR/games.json       (UPDATE — spot-all keys)

Parallelizable tail (UT-A · UT-B · UT-C)
├── src/games/spot-all/SpotAllTile/SpotAllTile.stories.tsx        (NEW — UT-A)
├── src/games/spot-all/SpotAllPrompt/SpotAllPrompt.stories.tsx    (NEW — UT-A)
├── src/games/spot-all/SpotAll/SpotAll.stories.tsx                (NEW — UT-A)
├── src/games/spot-all/SpotAll/SpotAll.skin.stories.tsx           (NEW — UT-A)
├── src/games/spot-all/SpotAll.config-form.stories.tsx            (NEW — UT-A)
├── e2e/visual.spec.ts                                            (APPEND — UT-B)
└── e2e/spot-all.spec.ts                                          (NEW — UT-C)
```

---

## Execution order at a glance

```
U1 ─► U2 ─► U3 ─► U4 ─► U5 ─► U6 ─► U7 ─► U8 ─► U9 ─► [UT-A · UT-B · UT-C in parallel] ─► U-Final
```

U6/U7 depend on U5 (state shape). U8 depends on U4 (groups). U9 depends on U5 (config shape). UT-A/B/C only need U9 done. U-Final closes the PR.

---

## U1 — Reversible-characters data layer (R5b)

**Scope:** Create `reversible-characters.json`; extend `confusables/types.ts` and `confusables/query.ts` with three helpers; cover with unit tests.

**Spec:** §2 (Data layer).

**Files:**

- Create: `src/data/confusables/reversible-characters.json`
- Modify: `src/data/confusables/types.ts`
- Modify: `src/data/confusables/query.ts`
- Modify: `src/data/confusables/query.test.ts`

### T1.1 — Add the JSON dataset

- [ ] **Step 1: Create `reversible-characters.json`** with the 9 R5b entries.

```json
[
  { "char": "2", "transform": "mirror-horizontal" },
  { "char": "3", "transform": "mirror-horizontal" },
  { "char": "5", "transform": "mirror-horizontal" },
  { "char": "6", "transform": "mirror-horizontal" },
  { "char": "7", "transform": "mirror-horizontal" },
  { "char": "9", "transform": "mirror-horizontal" },
  { "char": "J", "transform": "mirror-horizontal" },
  { "char": "S", "transform": "mirror-horizontal" },
  { "char": "Z", "transform": "mirror-horizontal" }
]
```

- [ ] **Step 2: Verify TypeScript can import the file**

Run: `yarn typecheck`
Expected: PASS (no usages yet, but JSON imports compile via `resolveJsonModule`).

### T1.2 — Extend types

- [ ] **Step 1: Add types to `src/data/confusables/types.ts`** (append at end of file).

```ts
export type ReversibleTransform =
  | 'mirror-horizontal'
  | 'mirror-vertical'
  | 'rotation-180';

export interface ReversibleCharacter {
  char: string;
  transform: ReversibleTransform;
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: PASS.

### T1.3 — TDD: `getAllReversibles`

- [ ] **Step 1: Add failing test** to `src/data/confusables/query.test.ts` (append).

```ts
import { describe, expect, it } from 'vitest';
import {
  getAllReversibles,
  getReversalTransform,
  isReversible,
} from './query';

describe('getAllReversibles', () => {
  it('returns the 9 R5b reversibles, all mirror-horizontal', () => {
    const all = getAllReversibles();
    expect(all).toHaveLength(9);
    expect(all.map((r) => r.char)).toEqual([
      '2',
      '3',
      '5',
      '6',
      '7',
      '9',
      'J',
      'S',
      'Z',
    ]);
    expect(all.every((r) => r.transform === 'mirror-horizontal')).toBe(
      true,
    );
  });

  it('returns a fresh array on each call (no shared mutation)', () => {
    const a = getAllReversibles();
    a.push({ char: 'X', transform: 'mirror-horizontal' });
    expect(getAllReversibles()).toHaveLength(9);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/data/confusables/query.test.ts`
Expected: FAIL — `getAllReversibles` is not exported.

- [ ] **Step 3: Implement** — modify `src/data/confusables/query.ts`. Add at the top with the other imports:

```ts
import reversibleCharactersJson from './reversible-characters.json';
import type {
  // …existing imports…
  ReversibleCharacter,
  ReversibleTransform,
} from './types';
```

Add a normalised constant alongside `CONFUSABLE_SETS`:

```ts
const REVERSIBLE_TRANSFORMS: ReadonlySet<ReversibleTransform> = new Set(
  ['mirror-horizontal', 'mirror-vertical', 'rotation-180'],
);

const isReversibleTransform = (
  value: string,
): value is ReversibleTransform =>
  REVERSIBLE_TRANSFORMS.has(value as ReversibleTransform);

const REVERSIBLE_CHARACTERS: readonly ReversibleCharacter[] =
  reversibleCharactersJson
    .filter((entry) => isReversibleTransform(entry.transform))
    .map((entry) => ({
      char: entry.char,
      transform: entry.transform as ReversibleTransform,
    }));
```

Add the exported helper:

```ts
export const getAllReversibles = (): ReversibleCharacter[] =>
  REVERSIBLE_CHARACTERS.map((r) => ({ ...r }));
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/data/confusables/query.test.ts`
Expected: PASS.

### T1.4 — TDD: `getReversalTransform` and `isReversible`

- [ ] **Step 1: Add failing tests** to `src/data/confusables/query.test.ts` (append).

```ts
describe('getReversalTransform', () => {
  it('returns the reversible record for a known char', () => {
    expect(getReversalTransform('2')).toEqual({
      char: '2',
      transform: 'mirror-horizontal',
    });
    expect(getReversalTransform('Z')).toEqual({
      char: 'Z',
      transform: 'mirror-horizontal',
    });
  });

  it('returns undefined for non-reversible chars', () => {
    expect(getReversalTransform('b')).toBeUndefined();
    expect(getReversalTransform('1')).toBeUndefined();
    expect(getReversalTransform('')).toBeUndefined();
  });
});

describe('isReversible', () => {
  it('returns true for known reversibles', () => {
    expect(isReversible('6')).toBe(true);
    expect(isReversible('J')).toBe(true);
  });

  it('returns false for non-reversibles', () => {
    expect(isReversible('b')).toBe(false);
    expect(isReversible('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/data/confusables/query.test.ts`
Expected: FAIL — `getReversalTransform`, `isReversible` not exported.

- [ ] **Step 3: Implement** — append to `src/data/confusables/query.ts`:

```ts
export const getReversalTransform = (
  char: string,
): ReversibleCharacter | undefined =>
  REVERSIBLE_CHARACTERS.find((r) => r.char === char);

export const isReversible = (char: string): boolean =>
  REVERSIBLE_CHARACTERS.some((r) => r.char === char);
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/data/confusables/query.test.ts`
Expected: PASS, all confusables tests still pass.

### T1.5 — Commit U1

- [ ] **Step 1: Stage + commit**

```bash
git add src/data/confusables/reversible-characters.json src/data/confusables/types.ts src/data/confusables/query.ts src/data/confusables/query.test.ts
git commit -m "feat(spot-all): add R5b reversible-characters dataset and query helpers (spec §2)"
```

---

## U2 — Distractor library (`src/lib/distractors/`)

**Scope:** Brand-new `src/lib/distractors/` subtree implementing a `DistractorSource` interface, a registry, a deterministic compose with seeded RNG, and the two built-in sources (confusable-pairs, reversible-chars). Plus a short library mdx.

**Spec:** §3 (Distractor library).

**Files (all NEW):**

- `src/lib/distractors/types.ts`
- `src/lib/distractors/registry.ts`
- `src/lib/distractors/compose.ts`
- `src/lib/distractors/compose.test.ts`
- `src/lib/distractors/sources/confusable-pairs.ts`
- `src/lib/distractors/sources/confusable-pairs.test.ts`
- `src/lib/distractors/sources/reversible-chars.ts`
- `src/lib/distractors/sources/reversible-chars.test.ts`
- `src/lib/distractors/distractors.mdx`

### T2.1 — Define the interface

- [ ] **Step 1: Create `src/lib/distractors/types.ts`**

```ts
import type { RelationshipType } from '@/data/confusables/types';

export type CssTransform =
  | 'scaleX(-1)'
  | 'scaleY(-1)'
  | 'rotate(180deg)';

export interface DistractorCandidate {
  /** Character (or sequence) shown on the tile. */
  label: string;
  /** Optional CSS transform applied to the tile (self-reversal sources only). */
  transform?: CssTransform;
  /** Source ID that produced the candidate (telemetry, debugging). */
  sourceId: string;
  /** Source-specific metadata (e.g., relationship type). */
  meta?: Record<string, unknown>;
}

export interface DistractorSourceContext {
  selectedConfusablePairs?: Array<{
    pair: [string, string];
    type: RelationshipType;
  }>;
  selectedReversibleChars?: string[];
  /** Open extension point for future sources. */
  [key: string]: unknown;
}

export interface DistractorSource {
  id: string;
  getCandidates(
    target: string,
    ctx: DistractorSourceContext,
  ): DistractorCandidate[];
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: PASS.

### T2.2 — TDD: confusable-pairs source

- [ ] **Step 1: Create failing test** at `src/lib/distractors/sources/confusable-pairs.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { confusablePairsSource } from './confusable-pairs';

describe('confusablePairsSource', () => {
  it('returns the OTHER character of each pair containing the target, no CSS transform', () => {
    const candidates = confusablePairsSource.getCandidates('b', {
      selectedConfusablePairs: [
        { pair: ['b', 'd'], type: 'mirror-horizontal' },
        { pair: ['p', 'q'], type: 'mirror-horizontal' }, // target absent
      ],
    });
    expect(candidates).toEqual([
      {
        label: 'd',
        sourceId: 'confusable-pairs',
        meta: { relationshipType: 'mirror-horizontal' },
      },
    ]);
    expect(candidates[0]?.transform).toBeUndefined();
  });

  it('handles the target on the right side of the pair', () => {
    const candidates = confusablePairsSource.getCandidates('q', {
      selectedConfusablePairs: [
        { pair: ['p', 'q'], type: 'mirror-horizontal' },
      ],
    });
    expect(candidates.map((c) => c.label)).toEqual(['p']);
  });

  it('returns [] when no pair contains the target', () => {
    expect(
      confusablePairsSource.getCandidates('z', {
        selectedConfusablePairs: [
          { pair: ['b', 'd'], type: 'mirror-horizontal' },
        ],
      }),
    ).toEqual([]);
  });

  it('returns [] when selection is undefined or empty', () => {
    expect(confusablePairsSource.getCandidates('b', {})).toEqual([]);
    expect(
      confusablePairsSource.getCandidates('b', {
        selectedConfusablePairs: [],
      }),
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/lib/distractors/sources/confusable-pairs.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement** — create `src/lib/distractors/sources/confusable-pairs.ts`

```ts
import type { DistractorCandidate, DistractorSource } from '../types';

export const confusablePairsSource: DistractorSource = {
  id: 'confusable-pairs',
  getCandidates(target, { selectedConfusablePairs = [] }) {
    const out: DistractorCandidate[] = [];
    for (const sel of selectedConfusablePairs) {
      const [left, right] = sel.pair;
      if (left === target) {
        out.push({
          label: right,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      } else if (right === target) {
        out.push({
          label: left,
          sourceId: 'confusable-pairs',
          meta: { relationshipType: sel.type },
        });
      }
    }
    return out;
  },
};
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/lib/distractors/sources/confusable-pairs.test.ts`
Expected: PASS.

### T2.3 — TDD: reversible-chars source

- [ ] **Step 1: Create failing test** at `src/lib/distractors/sources/reversible-chars.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { reversibleCharsSource } from './reversible-chars';

describe('reversibleCharsSource', () => {
  it('returns the target character + scaleX(-1) for a selected mirror-horizontal target', () => {
    expect(
      reversibleCharsSource.getCandidates('2', {
        selectedReversibleChars: ['2', '6', '9'],
      }),
    ).toEqual([
      {
        label: '2',
        transform: 'scaleX(-1)',
        sourceId: 'reversible-chars',
        meta: { reversalTransform: 'mirror-horizontal' },
      },
    ]);
  });

  it('returns [] when target is not in the selection', () => {
    expect(
      reversibleCharsSource.getCandidates('2', {
        selectedReversibleChars: ['6'],
      }),
    ).toEqual([]);
  });

  it('returns [] when target is not a known reversible char', () => {
    expect(
      reversibleCharsSource.getCandidates('b', {
        selectedReversibleChars: ['b'],
      }),
    ).toEqual([]);
  });

  it('returns [] when selection is undefined', () => {
    expect(reversibleCharsSource.getCandidates('2', {})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/lib/distractors/sources/reversible-chars.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement** — create `src/lib/distractors/sources/reversible-chars.ts`

```ts
import { getReversalTransform } from '@/data/confusables/query';
import type { ReversibleTransform } from '@/data/confusables/types';
import type { CssTransform, DistractorSource } from '../types';

const TRANSFORM_MAP: Record<ReversibleTransform, CssTransform> = {
  'mirror-horizontal': 'scaleX(-1)',
  'mirror-vertical': 'scaleY(-1)',
  'rotation-180': 'rotate(180deg)',
};

export const reversibleCharsSource: DistractorSource = {
  id: 'reversible-chars',
  getCandidates(target, { selectedReversibleChars = [] }) {
    if (!selectedReversibleChars.includes(target)) return [];
    const r = getReversalTransform(target);
    if (!r) return [];
    return [
      {
        label: target,
        transform: TRANSFORM_MAP[r.transform],
        sourceId: 'reversible-chars',
        meta: { reversalTransform: r.transform },
      },
    ];
  },
};
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/lib/distractors/sources/reversible-chars.test.ts`
Expected: PASS.

### T2.4 — TDD: compose (merge, dedupe, deterministic shuffle, count cap)

- [ ] **Step 1: Create failing test** at `src/lib/distractors/compose.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/lib/seeded-random';
import { composeDistractors } from './compose';
import { confusablePairsSource } from './sources/confusable-pairs';
import { reversibleCharsSource } from './sources/reversible-chars';

describe('composeDistractors', () => {
  it('merges candidates from all sources', () => {
    const out = composeDistractors(
      [confusablePairsSource, reversibleCharsSource],
      '6',
      {
        selectedConfusablePairs: [
          { pair: ['6', '9'], type: 'rotation-180' },
        ],
        selectedReversibleChars: ['6'],
      },
      10,
    );
    expect(out.map((c) => c.sourceId).sort()).toEqual([
      'confusable-pairs',
      'reversible-chars',
    ]);
  });

  it('dedupes by (label, transform) pair', () => {
    const dupSource = {
      id: 'dup',
      getCandidates: () => [
        { label: 'X', sourceId: 'dup' },
        { label: 'X', sourceId: 'dup' }, // exact dup → drop
        {
          label: 'X',
          transform: 'scaleX(-1)' as const,
          sourceId: 'dup',
        }, // different transform → keep
      ],
    };
    const out = composeDistractors([dupSource], 'A', {}, 10);
    expect(out).toHaveLength(2);
  });

  it('caps to count', () => {
    const many = {
      id: 'many',
      getCandidates: () =>
        Array.from({ length: 20 }, (_, i) => ({
          label: `L${i}`,
          sourceId: 'many',
        })),
    };
    const out = composeDistractors([many], 'A', {}, 5);
    expect(out).toHaveLength(5);
  });

  it('is deterministic with a seeded rng', () => {
    const many = {
      id: 'many',
      getCandidates: () =>
        Array.from({ length: 8 }, (_, i) => ({
          label: `L${i}`,
          sourceId: 'many',
        })),
    };
    const a = composeDistractors(
      [many],
      'A',
      {},
      5,
      seededRandom('seed-1'),
    );
    const b = composeDistractors(
      [many],
      'A',
      {},
      5,
      seededRandom('seed-1'),
    );
    expect(a.map((c) => c.label)).toEqual(b.map((c) => c.label));
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/lib/distractors/compose.test.ts`
Expected: FAIL — `compose` not implemented.

- [ ] **Step 3: Implement** — create `src/lib/distractors/compose.ts`

```ts
import type {
  DistractorCandidate,
  DistractorSource,
  DistractorSourceContext,
} from './types';

const shuffle = <T>(items: T[], rng?: () => number): T[] => {
  const out = [...items];
  const random = rng ?? (() => Math.random());
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};

export const composeDistractors = (
  sources: DistractorSource[],
  target: string,
  ctx: DistractorSourceContext,
  count: number,
  rng?: () => number,
): DistractorCandidate[] => {
  const pool: DistractorCandidate[] = [];
  for (const s of sources) pool.push(...s.getCandidates(target, ctx));

  const seen = new Set<string>();
  const unique = pool.filter((c) => {
    const key = `${c.label}|${c.transform ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return shuffle(unique, rng).slice(0, count);
};
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/lib/distractors/compose.test.ts`
Expected: PASS.

### T2.5 — Implement registry

- [ ] **Step 1: Create `src/lib/distractors/registry.ts`**

```ts
import { confusablePairsSource } from './sources/confusable-pairs';
import { reversibleCharsSource } from './sources/reversible-chars';
import type { DistractorSource } from './types';

const SOURCES = new Map<string, DistractorSource>();

export const registerSource = (s: DistractorSource): void => {
  SOURCES.set(s.id, s);
};

export const getSource = (id: string): DistractorSource | undefined =>
  SOURCES.get(id);

export const listSources = (): DistractorSource[] => [
  ...SOURCES.values(),
];

// Auto-register built-ins
registerSource(confusablePairsSource);
registerSource(reversibleCharsSource);
```

- [ ] **Step 2: Run all distractor tests + typecheck**

Run: `yarn vitest run src/lib/distractors`
Expected: PASS — 4 test files, all green.

Run: `yarn typecheck`
Expected: PASS.

### T2.6 — Library README (`distractors.mdx`)

- [ ] **Step 1: Create `src/lib/distractors/distractors.mdx`**

````mdx
import { Meta } from '@storybook/blocks';

<Meta title="Library/Distractors" />

# Distractors library

Game-agnostic distractor pipeline used by SpotAll today and reusable by any
game that needs deterministic, source-pluggable distractor candidates.

## Architecture

```text
DistractorSource           // produces candidates for a (target, ctx)
  ├── confusable-pairs     // visual confusables from confusable-sets.json
  └── reversible-chars     // self-mirroring R5b set with CSS transforms

registry                   // map of sourceId -> source (auto-registers built-ins)
compose(sources, target, ctx, count, rng?)
                          // merges → dedupes by (label, transform) → shuffles → caps
```
````

## Adding a new source

1. Create `sources/<id>.ts` exporting a `DistractorSource`.
2. Append a `registerSource(<source>)` line to `registry.ts`.
3. Update `DistractorSourceContext` if your source reads new selection data.

Future sources tracked in [#259](https://github.com/leocaseiro/base-skill/issues/259).

````

- [ ] **Step 2: Format**

Run: `yarn fix:md`
Expected: PASS (mdx files are linted by markdownlint via `**/*.md` glob is .md only — mdx may be skipped, but prettier will format it).

Run: `npx prettier --check src/lib/distractors/distractors.mdx`
Expected: PASS.

### T2.7 — Commit U2

- [ ] **Step 1: Stage + commit**

```bash
git add src/lib/distractors/
git commit -m "feat(distractors): add game-agnostic distractor library (spec §3)"
````

---

## U3 — Visual variation pool + skin tokens

**Scope:** Add 6 `--skin-variation-N` tokens to `classicSkin`, then build the variation pools and the seeded `pickVariation` helper.

**Spec:** §4 (Skin registration), §7 (Visual variation).

**Files:**

- Modify: `src/lib/skin/classic-skin.ts`
- Create: `src/games/spot-all/visual-variation/pools.ts`
- Create: `src/games/spot-all/visual-variation/pick-variation.ts`
- Create: `src/games/spot-all/visual-variation/pick-variation.test.ts`

### T3.1 — Extend classicSkin with variation tokens

- [ ] **Step 1: Edit `src/lib/skin/classic-skin.ts`** — add a new section right before the closing `},` of `tokens`. Insert immediately after the HUD tokens block:

```ts
    // ── Visual variation tokens (cross-game palette) ──────────────
    '--skin-variation-1': 'var(--bs-primary)',
    '--skin-variation-2': 'var(--destructive)',
    '--skin-variation-3': 'var(--bs-success)',
    '--skin-variation-4': 'oklch(54% 0.22 295)',
    '--skin-variation-5': 'oklch(63% 0.18 35)',
    '--skin-variation-6': 'var(--skin-tile-text)',
```

- [ ] **Step 2: Run skin tests**

Run: `yarn vitest run src/lib/skin/`
Expected: PASS — existing skin registry tests still green.

### T3.2 — Create variation pools

- [ ] **Step 1: Create `src/games/spot-all/visual-variation/pools.ts`**

```ts
export interface SpotAllFontPoolEntry {
  id: string;
  family: string;
  label: string;
}

export const FONT_POOL: readonly SpotAllFontPoolEntry[] = [
  { id: 'andika', family: 'Andika, sans-serif', label: 'Andika' },
  {
    id: 'edu-nsw',
    family: '"Edu NSW ACT Foundation", cursive',
    label: 'Edu NSW',
  },
  { id: 'nunito', family: 'Nunito, sans-serif', label: 'Nunito' },
  {
    id: 'fraunces',
    family: 'Fraunces, Georgia, serif',
    label: 'Fraunces',
  },
  { id: 'manrope', family: 'Manrope, sans-serif', label: 'Manrope' },
  {
    id: 'monospace',
    family: 'ui-monospace, "SF Mono", monospace',
    label: 'Monospace',
  },
] as const;

export const COLOR_POOL = [
  'var(--skin-variation-1)',
  'var(--skin-variation-2)',
  'var(--skin-variation-3)',
  'var(--skin-variation-4)',
  'var(--skin-variation-5)',
  'var(--skin-variation-6)',
] as const;

export const SIZE_POOL = [38, 42, 46, 50] as const;

export const DEFAULT_ENABLED_FONT_IDS: readonly string[] =
  FONT_POOL.map((f) => f.id);
```

### T3.3 — TDD: pickVariation

- [ ] **Step 1: Create failing test** at `src/games/spot-all/visual-variation/pick-variation.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/lib/seeded-random';
import { COLOR_POOL, FONT_POOL, SIZE_POOL } from './pools';
import { pickVariation } from './pick-variation';

describe('pickVariation', () => {
  it('returns deterministic output for the same seed', () => {
    const a = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    const b = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    expect(a).toEqual(b);
  });

  it('picks color from COLOR_POOL and size from SIZE_POOL', () => {
    const v = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    expect(COLOR_POOL).toContain(v.color);
    expect(SIZE_POOL).toContain(v.fontSizePx);
  });

  it('picks fontFamily from FONT_POOL when fonts are enabled', () => {
    const v = pickVariation(
      seededRandom('seed-1'),
      FONT_POOL.map((f) => f.id),
    );
    const families = FONT_POOL.map((f) => f.family);
    expect(families).toContain(v.fontFamily);
  });

  it('returns undefined fontFamily when font pool is empty', () => {
    const v = pickVariation(seededRandom('seed-1'), []);
    expect(v.fontFamily).toBeUndefined();
    expect(SIZE_POOL).toContain(v.fontSizePx);
    expect(COLOR_POOL).toContain(v.color);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/visual-variation/pick-variation.test.ts`
Expected: FAIL — `pickVariation` not implemented.

- [ ] **Step 3: Implement** — create `src/games/spot-all/visual-variation/pick-variation.ts`

```ts
import { COLOR_POOL, FONT_POOL, SIZE_POOL } from './pools';

export interface SpotAllVisualVariation {
  fontFamily?: string;
  fontSizePx: number;
  color: string;
}

export const pickVariation = (
  rng: () => number,
  enabledFontIds: readonly string[],
): SpotAllVisualVariation => {
  const fonts = FONT_POOL.filter((f) => enabledFontIds.includes(f.id));
  const font =
    fonts.length > 0
      ? fonts[Math.floor(rng() * fonts.length)]
      : undefined;
  return {
    fontFamily: font?.family,
    fontSizePx: SIZE_POOL[Math.floor(rng() * SIZE_POOL.length)]!,
    color: COLOR_POOL[Math.floor(rng() * COLOR_POOL.length)]!,
  };
};
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/visual-variation/pick-variation.test.ts`
Expected: PASS.

### T3.4 — Commit U3

- [ ] **Step 1: Stage + commit**

```bash
git add src/lib/skin/classic-skin.ts src/games/spot-all/visual-variation/
git commit -m "feat(spot-all): add visual variation pools + skin variation tokens (spec §4, §7)"
```

---

## U4 — Confusable pair groups

**Scope:** Single new module that derives the 5 confusable-set groups from `confusable-sets.json` plus a 6th Reversible group from `reversible-characters.json`. Used by `SpotAllConfigForm` (U8) and the picker UI.

**Spec:** §6 (Config form — Grouped picker), Appendix A.

**Files:**

- Create: `src/games/spot-all/confusable-pair-groups.ts`
- Create: `src/games/spot-all/confusable-pair-groups.test.ts`

### T4.1 — TDD: derive groups from data

- [ ] **Step 1: Create failing test** at `src/games/spot-all/confusable-pair-groups.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  CONFUSABLE_GROUPS,
  type ConfusableGroup,
} from './confusable-pair-groups';

describe('CONFUSABLE_GROUPS', () => {
  it('has 6 groups in spec order', () => {
    expect(CONFUSABLE_GROUPS.map((g) => g.id)).toEqual([
      'mirror-horizontal',
      'mirror-vertical',
      'rotation-180',
      'visual-similarity',
      'transposition',
      'reversible',
    ]);
  });

  it('mirror-horizontal includes b↔d and p↔q', () => {
    const group = byId('mirror-horizontal');
    expect(
      group.chips.some(
        (c) =>
          c.kind === 'pair' && c.pair[0] === 'b' && c.pair[1] === 'd',
      ),
    ).toBe(true);
    expect(
      group.chips.some(
        (c) =>
          c.kind === 'pair' && c.pair[0] === 'p' && c.pair[1] === 'q',
      ),
    ).toBe(true);
  });

  it('visual-similarity includes the 3-way I, l, 1 chip', () => {
    const group = byId('visual-similarity');
    const triple = group.chips.find((c) => c.kind === 'tripleSet');
    expect(triple).toBeDefined();
    expect(triple?.kind === 'tripleSet' && triple.members).toEqual([
      'I',
      'l',
      '1',
    ]);
  });

  it('reversible group has 9 chips (one per R5b char)', () => {
    const group = byId('reversible');
    expect(group.chips).toHaveLength(9);
    expect(group.chips.every((c) => c.kind === 'reversible')).toBe(
      true,
    );
  });
});

const byId = (id: string): ConfusableGroup => {
  const g = CONFUSABLE_GROUPS.find((gg) => gg.id === id);
  if (!g) throw new Error(`group ${id} missing`);
  return g;
};
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/confusable-pair-groups.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement** — create `src/games/spot-all/confusable-pair-groups.ts`

```ts
import {
  getAllReversibles,
  getAllSets,
} from '@/data/confusables/query';
import type { RelationshipType } from '@/data/confusables/types';

export type ConfusableGroupId = RelationshipType | 'reversible';

export type ConfusableGroupChip =
  | { kind: 'pair'; pair: [string, string]; type: RelationshipType }
  | { kind: 'tripleSet'; members: readonly [string, string, string] }
  | { kind: 'reversible'; char: string };

export interface ConfusableGroup {
  id: ConfusableGroupId;
  chips: ConfusableGroupChip[];
}

const ORDER: ConfusableGroupId[] = [
  'mirror-horizontal',
  'mirror-vertical',
  'rotation-180',
  'visual-similarity',
  'transposition',
  'reversible',
];

const isTripleSet = (members: string[]): boolean =>
  members.length === 3;

const buildRelationshipGroups = (): Map<
  RelationshipType,
  ConfusableGroupChip[]
> => {
  const groups = new Map<RelationshipType, ConfusableGroupChip[]>();

  for (const set of getAllSets()) {
    // 3-way visual-similarity sets like il1 collapse into a single tripleSet chip.
    if (
      isTripleSet(set.members) &&
      set.relationships.every((r) => r.type === 'visual-similarity')
    ) {
      const chips = groups.get('visual-similarity') ?? [];
      chips.push({
        kind: 'tripleSet',
        members: [set.members[0]!, set.members[1]!, set.members[2]!],
      });
      groups.set('visual-similarity', chips);
      continue;
    }

    for (const rel of set.relationships) {
      const chips = groups.get(rel.type) ?? [];
      chips.push({
        kind: 'pair',
        pair: [rel.pair[0], rel.pair[1]],
        type: rel.type,
      });
      groups.set(rel.type, chips);
    }
  }

  return groups;
};

const buildReversibleChips = (): ConfusableGroupChip[] =>
  getAllReversibles().map((r) => ({
    kind: 'reversible',
    char: r.char,
  }));

const RELATIONSHIP_GROUPS = buildRelationshipGroups();

export const CONFUSABLE_GROUPS: ConfusableGroup[] = ORDER.map((id) => ({
  id,
  chips:
    id === 'reversible'
      ? buildReversibleChips()
      : (RELATIONSHIP_GROUPS.get(id) ?? []),
}));
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/confusable-pair-groups.test.ts`
Expected: PASS.

### T4.2 — Commit U4

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/confusable-pair-groups.ts src/games/spot-all/confusable-pair-groups.test.ts
git commit -m "feat(spot-all): derive 6 confusable picker groups (spec §6, App. A)"
```

---

## U5 — New types, reducer, buildRound, resolve-simple-config

**Scope:** Replace the SpotAll game-state core. Rewrite types (new schema), reducer (TAP_TILE auto-validate + cooldown), build-spot-all-round (uses `composeDistractors` + universal variation), and `resolve-simple-config` (no easy/medium/hard).

**Spec:** §4 (state, lifecycle), §6 (config), §7 (variation application).

**Files:**

- Modify: `src/games/spot-all/types.ts`
- Modify: `src/games/spot-all/spot-all-reducer.ts`
- Modify: `src/games/spot-all/spot-all-reducer.test.ts`
- Modify: `src/games/spot-all/build-spot-all-round.ts`
- Modify: `src/games/spot-all/build-spot-all-round.test.ts`
- Modify: `src/games/spot-all/resolve-simple-config.ts`
- Modify: `src/games/spot-all/resolve-simple-config.test.ts`

### T5.1 — Rewrite `types.ts`

- [ ] **Step 1: Replace `src/games/spot-all/types.ts`** entirely.

```ts
import type { RelationshipType } from '@/data/confusables/types';
import type { ConfigField } from '@/lib/config-fields';
import type { CssTransform } from '@/lib/distractors/types';
import type { SpotAllVisualVariation } from './visual-variation/pick-variation';

export interface SelectedConfusablePair {
  pair: [string, string];
  type: RelationshipType;
}

export interface SpotAllTile {
  id: string;
  label: string;
  isCorrect: boolean;
  transform?: CssTransform;
  visualVariation?: SpotAllVisualVariation;
}

export interface SpotAllRound {
  target: string;
  tiles: SpotAllTile[];
  correctCount: number;
}

export interface SpotAllConfig {
  gameId: 'spot-all';
  component: 'SpotAll';
  configMode?: 'simple' | 'advanced';
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
  correctTileCount: number;
  distractorCount: number;
  totalRounds: number;
  visualVariationEnabled: boolean;
  enabledFontIds: string[];
  roundsInOrder: boolean;
  ttsEnabled: boolean;
}

export interface SpotAllSimpleConfig {
  configMode: 'simple';
  selectedConfusablePairs: SelectedConfusablePair[];
  selectedReversibleChars: string[];
}

export const spotAllConfigFields: ConfigField[] = [
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'number',
    key: 'correctTileCount',
    label: 'Correct tiles',
    min: 1,
    max: 8,
  },
  {
    type: 'number',
    key: 'distractorCount',
    label: 'Distractor tiles',
    min: 1,
    max: 16,
  },
  {
    type: 'checkbox',
    key: 'visualVariationEnabled',
    label: 'Visual variation',
  },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: FAIL — old reducer / build-round / config-form / route still references the old `targetSetIds` / `relationshipTypes` / `difficulty` fields. Don't fix these yet — subsequent tasks land them.

### T5.2 — TDD: new reducer

- [ ] **Step 1: Replace `src/games/spot-all/spot-all-reducer.test.ts`** entirely.

```ts
import { describe, expect, it } from 'vitest';
import {
  ROUND_ADVANCE_MS,
  WRONG_COOLDOWN_MS,
  createInitialSpotAllState,
  spotAllReducer,
} from './spot-all-reducer';
import type { SpotAllRound } from './types';

const round = (overrides?: Partial<SpotAllRound>): SpotAllRound => ({
  target: 'b',
  correctCount: 2,
  tiles: [
    { id: 'c1', label: 'b', isCorrect: true },
    { id: 'c2', label: 'b', isCorrect: true },
    { id: 'd1', label: 'd', isCorrect: false },
  ],
  ...overrides,
});

describe('createInitialSpotAllState', () => {
  it('seeds rounds, picks the first round tiles, sets phase=playing', () => {
    const r = round();
    const state = createInitialSpotAllState([r]);
    expect(state.roundIndex).toBe(0);
    expect(state.tiles).toEqual(r.tiles);
    expect(state.selectedIds.size).toBe(0);
    expect(state.wrongCooldownIds.size).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.retryCount).toBe(0);
  });
});

describe('spotAllReducer · TAP_TILE', () => {
  it('selects an unselected correct tile', () => {
    const s = createInitialSpotAllState([round()]);
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    expect(next.selectedIds.has('c1')).toBe(true);
    expect(next.phase).toBe('playing');
  });

  it('deselects an already-selected correct tile', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    expect(next.selectedIds.has('c1')).toBe(false);
  });

  it('transitions phase=round-complete when last correct tile is selected', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    expect(next.phase).toBe('round-complete');
  });

  it('puts a wrong tile in wrongCooldownIds and increments retryCount, no selection change', () => {
    const s = createInitialSpotAllState([round()]);
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next.wrongCooldownIds.has('d1')).toBe(true);
    expect(next.selectedIds.has('d1')).toBe(false);
    expect(next.retryCount).toBe(1);
  });

  it('ignores TAP_TILE on a tile in cooldown', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next).toBe(s); // unchanged reference
  });

  it('ignores TAP_TILE when phase is not playing', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    // phase=round-complete now
    const next = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    expect(next).toBe(s);
  });
});

describe('spotAllReducer · CLEAR_WRONG_COOLDOWN', () => {
  it('removes a tile from wrongCooldownIds', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'd1' });
    const next = spotAllReducer(s, {
      type: 'CLEAR_WRONG_COOLDOWN',
      tileId: 'd1',
    });
    expect(next.wrongCooldownIds.has('d1')).toBe(false);
  });
});

describe('spotAllReducer · ADVANCE_ROUND', () => {
  it('moves to the next round, resets selection + cooldown', () => {
    const r1 = round();
    const r2 = round({ target: 'd' });
    let s = createInitialSpotAllState([r1, r2]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    const next = spotAllReducer(s, { type: 'ADVANCE_ROUND' });
    expect(next.roundIndex).toBe(1);
    expect(next.tiles).toEqual(r2.tiles);
    expect(next.selectedIds.size).toBe(0);
    expect(next.wrongCooldownIds.size).toBe(0);
    expect(next.phase).toBe('playing');
  });

  it('transitions to game-over when no next round exists', () => {
    let s = createInitialSpotAllState([round()]);
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c1' });
    s = spotAllReducer(s, { type: 'TAP_TILE', tileId: 'c2' });
    const next = spotAllReducer(s, { type: 'ADVANCE_ROUND' });
    expect(next.phase).toBe('game-over');
  });
});

describe('exported timing constants', () => {
  it('exposes WRONG_COOLDOWN_MS=600 and ROUND_ADVANCE_MS=750', () => {
    expect(WRONG_COOLDOWN_MS).toBe(600);
    expect(ROUND_ADVANCE_MS).toBe(750);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/spot-all-reducer.test.ts`
Expected: FAIL — old reducer doesn't have `wrongCooldownIds`, `retryCount`, the new TAP_TILE / CLEAR_WRONG_COOLDOWN actions, or the constants.

### T5.3 — Implement new reducer

- [ ] **Step 1: Replace `src/games/spot-all/spot-all-reducer.ts`**

```ts
import type { SpotAllRound, SpotAllTile } from './types';

export type SpotAllPhase = 'playing' | 'round-complete' | 'game-over';

export interface SpotAllState {
  rounds: SpotAllRound[];
  roundIndex: number;
  tiles: SpotAllTile[];
  selectedIds: Set<string>;
  wrongCooldownIds: Set<string>;
  phase: SpotAllPhase;
  retryCount: number;
}

export type SpotAllAction =
  | { type: 'INIT_ROUNDS'; rounds: SpotAllRound[] }
  | { type: 'TAP_TILE'; tileId: string }
  | { type: 'CLEAR_WRONG_COOLDOWN'; tileId: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'COMPLETE_GAME' };

export const WRONG_COOLDOWN_MS = 600;
export const ROUND_ADVANCE_MS = 750;

export const createInitialSpotAllState = (
  rounds: SpotAllRound[],
): SpotAllState => ({
  rounds,
  roundIndex: 0,
  tiles: rounds[0]?.tiles ?? [],
  selectedIds: new Set<string>(),
  wrongCooldownIds: new Set<string>(),
  phase: 'playing',
  retryCount: 0,
});

export const spotAllReducer = (
  state: SpotAllState,
  action: SpotAllAction,
): SpotAllState => {
  switch (action.type) {
    case 'INIT_ROUNDS': {
      return createInitialSpotAllState(action.rounds);
    }
    case 'TAP_TILE': {
      if (state.phase !== 'playing') return state;
      if (state.wrongCooldownIds.has(action.tileId)) return state;

      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile) return state;

      if (tile.isCorrect && state.selectedIds.has(action.tileId)) {
        const next = new Set(state.selectedIds);
        next.delete(action.tileId);
        return { ...state, selectedIds: next };
      }

      if (tile.isCorrect) {
        const next = new Set(state.selectedIds);
        next.add(action.tileId);
        const allCorrect = state.tiles
          .filter((t) => t.isCorrect)
          .every((t) => next.has(t.id));
        return {
          ...state,
          selectedIds: next,
          phase: allCorrect ? 'round-complete' : 'playing',
        };
      }

      const cooldown = new Set(state.wrongCooldownIds);
      cooldown.add(action.tileId);
      return {
        ...state,
        wrongCooldownIds: cooldown,
        retryCount: state.retryCount + 1,
      };
    }
    case 'CLEAR_WRONG_COOLDOWN': {
      if (!state.wrongCooldownIds.has(action.tileId)) return state;
      const next = new Set(state.wrongCooldownIds);
      next.delete(action.tileId);
      return { ...state, wrongCooldownIds: next };
    }
    case 'ADVANCE_ROUND': {
      if (state.phase !== 'round-complete') return state;
      const nextIndex = state.roundIndex + 1;
      const nextRound = state.rounds[nextIndex];
      if (!nextRound) {
        return { ...state, phase: 'game-over' };
      }
      return {
        ...state,
        roundIndex: nextIndex,
        tiles: nextRound.tiles,
        selectedIds: new Set<string>(),
        wrongCooldownIds: new Set<string>(),
        phase: 'playing',
      };
    }
    case 'COMPLETE_GAME': {
      return { ...state, phase: 'game-over' };
    }
    default: {
      return state;
    }
  }
};
```

- [ ] **Step 2: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/spot-all-reducer.test.ts`
Expected: PASS.

### T5.4 — TDD: new buildRound

- [ ] **Step 1: Replace `src/games/spot-all/build-spot-all-round.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/lib/seeded-random';
import { buildSpotAllRound } from './build-spot-all-round';
import type { SpotAllConfig } from './types';

const baseConfig = (
  overrides: Partial<SpotAllConfig> = {},
): SpotAllConfig => ({
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
  ],
  selectedReversibleChars: [],
  correctTileCount: 3,
  distractorCount: 2,
  totalRounds: 1,
  visualVariationEnabled: false,
  enabledFontIds: [],
  roundsInOrder: false,
  ttsEnabled: true,
  ...overrides,
});

describe('buildSpotAllRound', () => {
  it('produces correctTileCount + distractorCount tiles', () => {
    const r = buildSpotAllRound(baseConfig(), {
      rng: seededRandom('s1'),
    });
    expect(r.tiles).toHaveLength(5);
    expect(r.correctCount).toBe(3);
  });

  it('confusable distractors render WITHOUT a CSS transform', () => {
    const r = buildSpotAllRound(baseConfig({ forceTarget: 'b' }), {
      rng: seededRandom('s1'),
    });
    const distractors = r.tiles.filter((t) => !t.isCorrect);
    expect(distractors.every((t) => t.transform === undefined)).toBe(
      true,
    );
    expect(distractors.every((t) => t.label !== 'b')).toBe(true);
  });

  it('reversible distractors render the TARGET character with the reversal CSS transform', () => {
    const r = buildSpotAllRound(
      baseConfig({
        selectedConfusablePairs: [],
        selectedReversibleChars: ['2'],
        forceTarget: '2',
        distractorCount: 1,
      }),
      { rng: seededRandom('s1') },
    );
    const distractor = r.tiles.find((t) => !t.isCorrect);
    expect(distractor?.label).toBe('2');
    expect(distractor?.transform).toBe('scaleX(-1)');
  });

  it('applies visualVariation to BOTH correct and distractor tiles when enabled', () => {
    const r = buildSpotAllRound(
      baseConfig({
        visualVariationEnabled: true,
        enabledFontIds: ['andika', 'nunito'],
      }),
      { rng: seededRandom('s1') },
    );
    expect(r.tiles.every((t) => t.visualVariation !== undefined)).toBe(
      true,
    );
  });

  it('is deterministic when rng is seeded', () => {
    const a = buildSpotAllRound(baseConfig({ forceTarget: 'b' }), {
      rng: seededRandom('seed-X'),
    });
    const b = buildSpotAllRound(baseConfig({ forceTarget: 'b' }), {
      rng: seededRandom('seed-X'),
    });
    expect(a.tiles.map((t) => t.label)).toEqual(
      b.tiles.map((t) => t.label),
    );
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/build-spot-all-round.test.ts`
Expected: FAIL — old `buildSpotAllRound` signature, no rng option, distractors get transforms wrong.

### T5.5 — Implement new buildRound

- [ ] **Step 1: Replace `src/games/spot-all/build-spot-all-round.ts`**

```ts
import { nanoid } from 'nanoid';
import { composeDistractors } from '@/lib/distractors/compose';
import { listSources } from '@/lib/distractors/registry';
import type { DistractorSourceContext } from '@/lib/distractors/types';
import { pickVariation } from './visual-variation/pick-variation';
import type { SpotAllConfig, SpotAllRound, SpotAllTile } from './types';

export interface BuildSpotAllRoundOptions {
  rng?: () => number;
  forceTarget?: string;
}

const pickTarget = (
  config: SpotAllConfig,
  rng: () => number,
  forceTarget?: string,
): string => {
  if (forceTarget) return forceTarget;

  const pairChars = config.selectedConfusablePairs.flatMap(
    (p) => p.pair,
  );
  const reversibleChars = config.selectedReversibleChars;
  const pool = [...new Set([...pairChars, ...reversibleChars])];
  if (pool.length === 0) return 'b';
  return pool[Math.floor(rng() * pool.length)]!;
};

export const buildSpotAllRound = (
  config: SpotAllConfig,
  options: BuildSpotAllRoundOptions = {},
): SpotAllRound => {
  const rng = options.rng ?? Math.random;
  const target = pickTarget(config, rng, options.forceTarget);

  const ctx: DistractorSourceContext = {
    selectedConfusablePairs: config.selectedConfusablePairs,
    selectedReversibleChars: config.selectedReversibleChars,
  };

  const candidates = composeDistractors(
    listSources(),
    target,
    ctx,
    config.distractorCount,
    rng,
  );

  const distractorTiles: SpotAllTile[] = candidates.map((c) => ({
    id: nanoid(),
    label: c.label,
    isCorrect: false,
    transform: c.transform,
    visualVariation: config.visualVariationEnabled
      ? pickVariation(rng, config.enabledFontIds)
      : undefined,
  }));

  const correctTiles: SpotAllTile[] = Array.from(
    { length: config.correctTileCount },
    () => ({
      id: nanoid(),
      label: target,
      isCorrect: true,
      visualVariation: config.visualVariationEnabled
        ? pickVariation(rng, config.enabledFontIds)
        : undefined,
    }),
  );

  const tiles = shuffle([...correctTiles, ...distractorTiles], rng);
  return { target, tiles, correctCount: correctTiles.length };
};

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};
```

- [ ] **Step 2: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/build-spot-all-round.test.ts`
Expected: PASS.

### T5.6 — TDD + implement new resolve-simple-config

- [ ] **Step 1: Replace `src/games/spot-all/resolve-simple-config.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from './resolve-simple-config';
import { DEFAULT_ENABLED_FONT_IDS } from './visual-variation/pools';

describe('resolveSimpleConfig', () => {
  it('produces a SpotAllConfig from selected pairs/reversibles', () => {
    const cfg = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: [
        { pair: ['b', 'd'], type: 'mirror-horizontal' },
      ],
      selectedReversibleChars: ['2'],
    });
    expect(cfg.gameId).toBe('spot-all');
    expect(cfg.configMode).toBe('simple');
    expect(cfg.selectedConfusablePairs).toEqual([
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
    ]);
    expect(cfg.selectedReversibleChars).toEqual(['2']);
  });

  it('defaults: 4 correct, 4 distractors, 6 rounds, variation enabled, all fonts', () => {
    const cfg = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: [],
      selectedReversibleChars: [],
    });
    expect(cfg.correctTileCount).toBe(4);
    expect(cfg.distractorCount).toBe(4);
    expect(cfg.totalRounds).toBe(6);
    expect(cfg.visualVariationEnabled).toBe(true);
    expect(cfg.enabledFontIds).toEqual([...DEFAULT_ENABLED_FONT_IDS]);
    expect(cfg.roundsInOrder).toBe(false);
    expect(cfg.ttsEnabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/resolve-simple-config.test.ts`
Expected: FAIL — old shape uses `difficulty`.

- [ ] **Step 3: Replace `src/games/spot-all/resolve-simple-config.ts`**

```ts
import type { SpotAllConfig, SpotAllSimpleConfig } from './types';
import { DEFAULT_ENABLED_FONT_IDS } from './visual-variation/pools';

export const resolveSimpleConfig = (
  simple: SpotAllSimpleConfig,
): SpotAllConfig => ({
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: simple.selectedConfusablePairs,
  selectedReversibleChars: simple.selectedReversibleChars,
  correctTileCount: 4,
  distractorCount: 4,
  totalRounds: 6,
  visualVariationEnabled: true,
  enabledFontIds: [...DEFAULT_ENABLED_FONT_IDS],
  roundsInOrder: false,
  ttsEnabled: true,
});
```

- [ ] **Step 4: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/resolve-simple-config.test.ts`
Expected: PASS.

### T5.7 — Commit U5 (skip hooks for typecheck — components catch up in U6/U7)

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/types.ts src/games/spot-all/spot-all-reducer.ts src/games/spot-all/spot-all-reducer.test.ts src/games/spot-all/build-spot-all-round.ts src/games/spot-all/build-spot-all-round.test.ts src/games/spot-all/resolve-simple-config.ts src/games/spot-all/resolve-simple-config.test.ts
SKIP_TYPECHECK=1 git commit -m "feat(spot-all): rewrite reducer + buildRound + types for new schema (spec §4–§7)

SKIP_TYPECHECK=1 — UI components in U6/U7 reference the old schema until they
land in the next commits. Reducer + buildRound + resolve-simple-config tests
all green."
```

---

## U6 — SpotAllTile + SpotAllGrid + SpotAllPrompt rewrite

**Scope:** Leaf UI components updated to the new state shape.

**Spec:** §5 (UI components).

**Files:**

- Modify: `src/games/spot-all/SpotAllTile/SpotAllTile.tsx`
- Modify: `src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx`
- Modify: `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`

### T6.1 — Rewrite `SpotAllTile.tsx`

- [ ] **Step 1: Replace `src/games/spot-all/SpotAllTile/SpotAllTile.tsx`**

```tsx
import type { JSX } from 'react';
import type { SpotAllTile as SpotAllTileData } from '../types';
import { cn } from '@/lib/utils';

export interface SpotAllTileProps {
  tile: SpotAllTileData;
  isSelected: boolean;
  inCooldown: boolean;
  onTap: () => void;
}

export const SpotAllTile = ({
  tile,
  isSelected,
  inCooldown,
  onTap,
}: SpotAllTileProps): JSX.Element => (
  <button
    type="button"
    onClick={onTap}
    disabled={inCooldown}
    aria-pressed={isSelected}
    data-cooldown={inCooldown || undefined}
    className={cn(
      'flex min-h-24 min-w-24 items-center justify-center rounded-[var(--skin-tile-radius)] border-2 px-3 py-2 transition-all',
      'bg-[var(--skin-tile-bg)] text-[var(--skin-tile-text)] border-[var(--skin-tile-border)] shadow-[var(--skin-tile-shadow)]',
      isSelected &&
        'border-[var(--skin-correct-border)] bg-[var(--skin-correct-bg)]',
      inCooldown &&
        'border-[var(--skin-wrong-border)] bg-[var(--skin-wrong-bg)] animate-[shake_300ms_ease-in-out]',
    )}
  >
    <span
      style={{
        fontFamily: tile.visualVariation?.fontFamily,
        fontSize: tile.visualVariation?.fontSizePx,
        color: tile.visualVariation?.color,
        transform: tile.transform,
        display: 'inline-block',
      }}
      className="font-bold leading-none"
    >
      {tile.label}
    </span>
  </button>
);
```

### T6.2 — Rewrite `SpotAllGrid.tsx`

- [ ] **Step 1: Replace `src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx`**

```tsx
import type { JSX } from 'react';
import { SpotAllTile } from '../SpotAllTile/SpotAllTile';
import type { SpotAllState } from '../spot-all-reducer';

export const SpotAllGrid = ({
  state,
  onTap,
}: {
  state: SpotAllState;
  onTap: (tileId: string) => void;
}): JSX.Element => (
  <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {state.tiles.map((tile) => (
      <SpotAllTile
        key={tile.id}
        tile={tile}
        isSelected={state.selectedIds.has(tile.id)}
        inCooldown={state.wrongCooldownIds.has(tile.id)}
        onTap={() => onTap(tile.id)}
      />
    ))}
  </div>
);
```

### T6.3 — Rewrite `SpotAllPrompt.tsx` (i18n + AudioButton)

- [ ] **Step 1: Replace `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`**

```tsx
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';

export const SpotAllPrompt = ({
  target,
}: {
  target: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const prompt = t('spot-all-ui.prompt', { target });
  return (
    <p className="text-center text-2xl font-semibold text-foreground">
      {prompt}
      <AudioButton prompt={prompt} />
    </p>
  );
};
```

### T6.4 — Typecheck checkpoint

- [ ] **Step 1: Run typecheck — expect remaining failure in `SpotAll.tsx` only**

Run: `yarn typecheck`
Expected: errors limited to `src/games/spot-all/SpotAll/SpotAll.tsx` and the route's `resolveSpotAllConfig`. Tile/Grid/Prompt should be clean.

### T6.5 — Commit U6

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/SpotAllTile/SpotAllTile.tsx src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx
SKIP_TYPECHECK=1 git commit -m "refactor(spot-all): rewrite Tile/Grid/Prompt for skin tokens + new state (spec §5)

SKIP_TYPECHECK=1 — SpotAll.tsx still on the old reducer/build API; landed next
in U7."
```

---

## U7 — SpotAll.tsx integration with engine, skin, ProgressHUD

**Scope:** The big integration commit. Wraps SpotAll in `GameEngineProvider` + `GameShell`, adds the centred `ProgressHUD`, registers skin context, runs lifecycle effects per spec §4.

**Spec:** §4 (Component composition, lifecycle effects).

**Files:**

- Modify: `src/games/spot-all/SpotAll/SpotAll.tsx`
- Modify: `src/games/spot-all/SpotAll/SpotAll.test.tsx`

### T7.1 — TDD: extend SpotAll.test.tsx for new mechanic

- [ ] **Step 1: Replace `src/games/spot-all/SpotAll/SpotAll.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from '@/test/MemoryRouter';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';

const config: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
  ],
  selectedReversibleChars: [],
  correctTileCount: 2,
  distractorCount: 2,
  totalRounds: 1,
  visualVariationEnabled: false,
  enabledFontIds: [],
  roundsInOrder: true,
  ttsEnabled: false,
};

describe('SpotAll', () => {
  it('renders the prompt and a grid of tiles', () => {
    render(
      <MemoryRouter>
        <SpotAll config={config} seed="test-seed" />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('selects a correct tile on tap', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SpotAll config={config} seed="test-seed" />
      </MemoryRouter>,
    );
    const correctTile = screen
      .getAllByRole('button')
      .find((b) => b.textContent === 'b');
    expect(correctTile).toBeDefined();
    await user.click(correctTile!);
    expect(correctTile).toHaveAttribute('aria-pressed', 'true');
  });

  it('puts a wrong tile in cooldown on tap (data-cooldown attr)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SpotAll config={config} seed="test-seed" />
      </MemoryRouter>,
    );
    const wrongTile = screen
      .getAllByRole('button')
      .find((b) => b.textContent === 'd');
    expect(wrongTile).toBeDefined();
    await user.click(wrongTile!);
    expect(wrongTile).toHaveAttribute('data-cooldown', 'true');
  });
});
```

> **Note on the test harness:** if `@/test/MemoryRouter` does not yet exist, create a minimal wrapper at `src/test/MemoryRouter.tsx` that mounts a TanStack Router memory history with `/$locale` resolved to `en`. Reuse the pattern from existing route tests (e.g., `src/routes/$locale/_app/game/$gameId.test.tsx`). If a project-blessed test wrapper is already present under another name, prefer that — confirm with `grep`.

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/SpotAll/SpotAll.test.tsx`
Expected: FAIL — current SpotAll uses `onToggleTile` + Check button, no `aria-pressed` / `data-cooldown` attrs.

### T7.2 — Rewrite SpotAll.tsx

- [ ] **Step 1: Replace `src/games/spot-all/SpotAll/SpotAll.tsx`**

```tsx
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import type { JSX, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { buildSpotAllRound } from '../build-spot-all-round';
import {
  ROUND_ADVANCE_MS,
  WRONG_COOLDOWN_MS,
  createInitialSpotAllState,
  spotAllReducer,
} from '../spot-all-reducer';
import { SpotAllGrid } from '../SpotAllGrid/SpotAllGrid';
import { SpotAllPrompt } from '../SpotAllPrompt/SpotAllPrompt';
import type { SpotAllConfig } from '../types';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ProgressHUD } from '@/components/answer-game/ProgressHUD/ProgressHUD';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { useGameSounds } from '@/components/answer-game/useGameSounds';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { GameShell } from '@/components/game/GameShell';
import { buildRoundOrder } from '@/games/build-round-order';
import { seededRandom } from '@/lib/seeded-random';
import { useGameSkin } from '@/lib/skin';

export const SpotAll = ({
  config,
  seed,
}: {
  config: SpotAllConfig;
  seed?: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });
  const skin = useGameSkin('spot-all');
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const rounds = useMemo(() => {
    void sessionEpoch;
    const rng = seed === undefined ? Math.random : seededRandom(seed);
    const ordered = Array.from({ length: config.totalRounds }, () =>
      buildSpotAllRound(config, { rng }),
    );
    const order = buildRoundOrder(
      ordered.length,
      config.roundsInOrder,
      seed,
    );
    return order.map((index) => ordered[index]!).filter(Boolean);
  }, [config, seed, sessionEpoch]);

  const [state, dispatch] = useReducer(
    spotAllReducer,
    rounds,
    createInitialSpotAllState,
  );

  const { playCorrect, playWrong, confettiReady, gameOverReady } =
    useGameSounds();

  // Reset state when config/seed changes (or session restart).
  useEffect(() => {
    dispatch({ type: 'INIT_ROUNDS', rounds });
  }, [rounds]);

  const round = rounds[state.roundIndex];
  useRoundTTS(round?.target ?? '');

  // Round-complete → confetti → advance after ROUND_ADVANCE_MS.
  useEffect(() => {
    if (state.phase !== 'round-complete' || !confettiReady) return;
    const timer = globalThis.setTimeout(() => {
      dispatch({ type: 'ADVANCE_ROUND' });
    }, ROUND_ADVANCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [state.phase, confettiReady]);

  // Per-tile wrong-cooldown clear after WRONG_COOLDOWN_MS.
  useEffect(() => {
    if (state.wrongCooldownIds.size === 0) return;
    const timers = [...state.wrongCooldownIds].map((tileId) =>
      globalThis.setTimeout(() => {
        dispatch({ type: 'CLEAR_WRONG_COOLDOWN', tileId });
      }, WRONG_COOLDOWN_MS),
    );
    return () => {
      for (const t of timers) globalThis.clearTimeout(t);
    };
  }, [state.wrongCooldownIds]);

  const handleTap = (tileId: string): void => {
    const tile = state.tiles.find((t) => t.id === tileId);
    if (!tile) return;
    if (state.wrongCooldownIds.has(tileId)) return;
    if (state.phase !== 'playing') return;
    if (tile.isCorrect && !state.selectedIds.has(tileId)) playCorrect();
    if (!tile.isCorrect) playWrong();
    dispatch({ type: 'TAP_TILE', tileId });
  };

  const handlePlayAgain = (): void => setSessionEpoch((e) => e + 1);
  const handleHome = (): void => {
    void navigate({ to: '/$locale', params: { locale } });
  };

  if (!round) return <></>;

  return (
    <GameShell>
      <div
        className={`game-container skin-${skin.id}`}
        style={skin.tokens as CSSProperties}
      >
        {skin.SceneBackground ? <skin.SceneBackground /> : null}
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-6">
          <ProgressHUD
            roundIndex={state.roundIndex}
            totalRounds={rounds.length}
            levelIndex={0}
            isLevelMode={false}
            phase={
              state.phase === 'round-complete'
                ? 'round-complete'
                : 'playing'
            }
            showDots
            showFraction
            showLevel={false}
          />
          <AnswerGame.Question>
            <SpotAllPrompt target={round.target} />
          </AnswerGame.Question>
          <AnswerGame.Answer>
            <SpotAllGrid state={state} onTap={handleTap} />
          </AnswerGame.Answer>
        </div>
        {skin.RoundCompleteEffect ? (
          <skin.RoundCompleteEffect
            visible={state.phase === 'round-complete'}
          />
        ) : (
          <ScoreAnimation visible={state.phase === 'round-complete'} />
        )}
        {state.phase === 'game-over' && gameOverReady ? (
          skin.CelebrationOverlay ? (
            <skin.CelebrationOverlay
              retryCount={state.retryCount}
              onPlayAgain={handlePlayAgain}
              onHome={handleHome}
            />
          ) : (
            <GameOverOverlay
              retryCount={state.retryCount}
              onPlayAgain={handlePlayAgain}
              onHome={handleHome}
            />
          )
        ) : null}
        {/* Hidden announcement for screen readers. */}
        <span className="sr-only" aria-live="polite">
          {t('spot-all-ui.prompt', { target: round.target })}
        </span>
      </div>
    </GameShell>
  );
};
```

> **Open question from spec §4:** if `useGameSkin('spot-all')` requires `GameEngineProvider` to be mounted to read the skin context, wrap `SpotAll` in a `GameEngineProvider` around `GameShell` per the spec snippet. Validate during this task — if `useGameSkin` throws or returns the default classic skin without a provider, add the provider wiring (the spec already shows the structure under "Component composition"). The risks table flags a fallback path.

- [ ] **Step 2: Run unit tests**

Run: `yarn vitest run src/games/spot-all/`
Expected: PASS — all SpotAll tests now green.

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS for the spot-all subtree. The route file may still report unrelated errors — landed in U9.

### T7.3 — Commit U7

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/SpotAll/SpotAll.tsx src/games/spot-all/SpotAll/SpotAll.test.tsx
SKIP_TYPECHECK=1 git commit -m "feat(spot-all): wire GameShell + skin + ProgressHUD + per-tap auto-validate (spec §4)

SKIP_TYPECHECK=1 — route's resolveSpotAllConfig still on the old schema; lands
in U9."
```

---

## U8 — SpotAllConfigForm rewrite (grouped picker)

**Scope:** Replace the 3-button difficulty picker with the 6-group chip picker per spec §6. Mirrors WordSpell's grouped library pattern.

**Spec:** §6 (Config form — Grouped picker, Simple form, Advanced form).

**Files:**

- Modify: `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx`
- Create: `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.test.tsx`

> **Skill note:** if you find yourself adding inline JSX mocks for the group chip UI, check whether `WordSpellLibrarySource` already provides reusable presentational primitives (`<GroupHeader>`, `<Chip>`). Prefer reuse over duplication. If no reusable primitives exist, keep the new components private to `SpotAllConfigForm/` and do **not** extract to `src/components/` in this PR — that's scope creep.

### T8.1 — TDD: form tests

- [ ] **Step 1: Create `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@/test/i18n';
import { SpotAllConfigForm } from './SpotAllConfigForm';
import { resolveSimpleConfig } from '../resolve-simple-config';

describe('SpotAllConfigForm', () => {
  it('shows the invalid-selection message when nothing is selected', () => {
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          {
            ...resolveSimpleConfig({
              configMode: 'simple',
              selectedConfusablePairs: [],
              selectedReversibleChars: [],
            }),
          } as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/at least one group/i)).toBeVisible();
  });

  it('toggling a group header adds all chips in that group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          resolveSimpleConfig({
            configMode: 'simple',
            selectedConfusablePairs: [],
            selectedReversibleChars: [],
          }) as unknown as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: /mirror horizontal/i }),
    );
    const last = onChange.mock.lastCall?.[0] as Record<string, unknown>;
    expect(
      Array.isArray(last['selectedConfusablePairs']) &&
        last['selectedConfusablePairs'].length,
    ).toBeGreaterThan(0);
  });

  it('toggling a single chip adds just that pair', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          resolveSimpleConfig({
            configMode: 'simple',
            selectedConfusablePairs: [],
            selectedReversibleChars: [],
          }) as unknown as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /b ↔ d/i }));
    const last = onChange.mock.lastCall?.[0] as Record<string, unknown>;
    expect(last['selectedConfusablePairs']).toEqual([
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
    ]);
  });
});
```

> **Test harness note:** `@/test/i18n` must initialise `react-i18next` with the en translations. If a project-wide test setup already does this in `vitest.setup.ts`, drop the import. Confirm with `grep -l "i18next.use" src/test`.

- [ ] **Step 2: Run, expect failure**

Run: `yarn vitest run src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.test.tsx`
Expected: FAIL — old form is the difficulty picker.

### T8.2 — Implement grouped picker

- [ ] **Step 1: Replace `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx`**

```tsx
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CONFUSABLE_GROUPS,
  type ConfusableGroup,
  type ConfusableGroupChip,
} from '../confusable-pair-groups';
import { resolveSimpleConfig } from '../resolve-simple-config';
import type { SelectedConfusablePair, SpotAllConfig } from '../types';

type FormConfig = Partial<SpotAllConfig> & Record<string, unknown>;

const samePair = (
  a: SelectedConfusablePair,
  b: SelectedConfusablePair,
): boolean => a.pair[0] === b.pair[0] && a.pair[1] === b.pair[1];

const tripleSetPairs = (
  members: readonly [string, string, string],
): SelectedConfusablePair[] => [
  { pair: [members[0], members[1]], type: 'visual-similarity' },
  { pair: [members[0], members[2]], type: 'visual-similarity' },
  { pair: [members[1], members[2]], type: 'visual-similarity' },
];

const chipPairs = (
  chip: ConfusableGroupChip,
): SelectedConfusablePair[] => {
  if (chip.kind === 'pair')
    return [{ pair: chip.pair, type: chip.type }];
  if (chip.kind === 'tripleSet') return tripleSetPairs(chip.members);
  return [];
};

export const SpotAllConfigForm = ({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => {
  const { t } = useTranslation();
  const current = (config as FormConfig) ?? {};
  const selectedPairs = (current.selectedConfusablePairs ??
    []) as SelectedConfusablePair[];
  const selectedReversibles = (current.selectedReversibleChars ??
    []) as string[];

  const isPairSelected = (p: SelectedConfusablePair): boolean =>
    selectedPairs.some((sp) => samePair(sp, p));
  const isReversibleSelected = (char: string): boolean =>
    selectedReversibles.includes(char);

  const isChipSelected = (chip: ConfusableGroupChip): boolean => {
    if (chip.kind === 'reversible')
      return isReversibleSelected(chip.char);
    return chipPairs(chip).every((p) => isPairSelected(p));
  };

  const isGroupAllOn = (group: ConfusableGroup): boolean =>
    group.chips.length > 0 && group.chips.every(isChipSelected);

  const commit = (
    nextPairs: SelectedConfusablePair[],
    nextReversibles: string[],
  ): void => {
    const resolved = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: nextPairs,
      selectedReversibleChars: nextReversibles,
    });
    onChange({ ...current, ...resolved });
  };

  const toggleChip = (chip: ConfusableGroupChip): void => {
    if (chip.kind === 'reversible') {
      const next = isReversibleSelected(chip.char)
        ? selectedReversibles.filter((c) => c !== chip.char)
        : [...selectedReversibles, chip.char];
      commit(selectedPairs, next);
      return;
    }
    const pairs = chipPairs(chip);
    const allOn = pairs.every((p) => isPairSelected(p));
    const next = allOn
      ? selectedPairs.filter(
          (sp) => !pairs.some((p) => samePair(sp, p)),
        )
      : [...selectedPairs, ...pairs.filter((p) => !isPairSelected(p))];
    commit(next, selectedReversibles);
  };

  const toggleGroup = (group: ConfusableGroup): void => {
    const allOn = isGroupAllOn(group);
    if (group.id === 'reversible') {
      const chars = group.chips.flatMap((c) =>
        c.kind === 'reversible' ? [c.char] : [],
      );
      const next = allOn
        ? selectedReversibles.filter((c) => !chars.includes(c))
        : [...new Set([...selectedReversibles, ...chars])];
      commit(selectedPairs, next);
      return;
    }
    const groupPairs = group.chips.flatMap(chipPairs);
    const next = allOn
      ? selectedPairs.filter(
          (sp) => !groupPairs.some((p) => samePair(sp, p)),
        )
      : [
          ...selectedPairs,
          ...groupPairs.filter((p) => !isPairSelected(p)),
        ];
    commit(next, selectedReversibles);
  };

  const empty =
    selectedPairs.length === 0 && selectedReversibles.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {CONFUSABLE_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggleGroup(group)}
            className={[
              'rounded-lg px-3 py-2 text-left font-semibold transition-colors',
              isGroupAllOn(group)
                ? 'bg-primary text-primary-foreground'
                : group.chips.some(isChipSelected)
                  ? 'bg-primary/40 text-primary-foreground'
                  : 'bg-muted text-foreground',
            ].join(' ')}
          >
            {t(`spot-all-ui.config.groups.${group.id}`)}
          </button>
          <div className="flex flex-wrap gap-2 pl-2">
            {group.chips.map((chip) => (
              <button
                key={chipKey(chip)}
                type="button"
                onClick={() => toggleChip(chip)}
                className={[
                  'rounded-full border px-3 py-1 text-sm',
                  isChipSelected(chip)
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                {chipLabel(chip)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {empty && (
        <p className="text-destructive">
          {t('spot-all-ui.config.invalid-selection')}
        </p>
      )}
    </div>
  );
};

const chipKey = (chip: ConfusableGroupChip): string => {
  if (chip.kind === 'pair') return `pair:${chip.pair.join('-')}`;
  if (chip.kind === 'tripleSet')
    return `triple:${chip.members.join('-')}`;
  return `rev:${chip.char}`;
};

const chipLabel = (chip: ConfusableGroupChip): string => {
  if (chip.kind === 'pair') return `${chip.pair[0]} ↔ ${chip.pair[1]}`;
  if (chip.kind === 'tripleSet') return chip.members.join(', ');
  return `${chip.char} ↔ ${chip.char}̄`;
};
```

- [ ] **Step 2: Run, expect pass**

Run: `yarn vitest run src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.test.tsx`
Expected: PASS.

### T8.3 — Commit U8

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/SpotAllConfigForm/
SKIP_TYPECHECK=1 git commit -m "feat(spot-all): grouped-picker config form (spec §6)

SKIP_TYPECHECK=1 — route's resolveSpotAllConfig still on old schema; lands in U9."
```

---

## U9 — Wiring: skin registry, route, advanced fields, i18n

**Scope:** Final integration. Register `spot-all` in skin registry, wire the route's `resolveSpotAllConfig` to validate the new schema, update advanced-fields registry, add i18n keys. After this commit, `yarn typecheck`, `yarn lint`, and `yarn vitest` should all be green for the whole repo.

**Spec:** §4 (Skin), §5/§6 (route validation), §8 (i18n).

**Files:**

- Modify: `src/lib/skin/registry.ts`
- Modify: `src/games/config-fields-registry.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

### T9.1 — Register classicSkin for spot-all

- [ ] **Step 1: Read** `src/lib/skin/registry.ts` to confirm the registration API. The spec assumes `registerSkin('spot-all', classicSkin)` — check the actual export name (it may be a per-game default skin map). Adapt to whatever pattern WordSpell / NumberMatch use.

- [ ] **Step 2: Add `spot-all` registration** following the existing pattern. If the file uses a `DEFAULT_SKIN_BY_GAME_ID` map, add `'spot-all': 'classic'`. If it uses a `registerSkin(gameId, skin)` call, add the call right after the NumberMatch one.

- [ ] **Step 3: Run skin tests**

Run: `yarn vitest run src/lib/skin/`
Expected: PASS.

### T9.2 — Update route's `resolveSpotAllConfig`

- [ ] **Step 1: Open** `src/routes/$locale/_app/game/$gameId.tsx` and locate `resolveSpotAllConfig`. It currently spreads `Partial<SpotAllConfig>` over a base — rewrite to validate the new schema:

```ts
const resolveSpotAllConfig = (
  saved: Record<string, unknown> | undefined,
): SpotAllConfig => {
  const fallback = resolveSimpleConfig({
    configMode: 'simple',
    selectedConfusablePairs: [
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
      { pair: ['p', 'q'], type: 'mirror-horizontal' },
    ],
    selectedReversibleChars: [],
  });
  if (!saved || typeof saved !== 'object') return fallback;

  const merged = { ...fallback, ...saved } as SpotAllConfig;
  if (
    merged.selectedConfusablePairs.length === 0 &&
    merged.selectedReversibleChars.length === 0
  ) {
    return fallback;
  }
  return merged;
};
```

> **Defensive fallback** matches spec §6 ("route-level `resolveSpotAllConfig` falls back to the Mirror-Horizontal default"). Make sure the import for `resolveSimpleConfig` is added.

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: PASS for this file. Other files may still break — see T9.3.

### T9.3 — Update `config-fields-registry.tsx`

- [ ] **Step 1: Open** `src/games/config-fields-registry.tsx` and find the SpotAll entry. The new advanced fields list comes from `spotAllConfigFields` exported in `src/games/spot-all/types.ts`. Keep the existing import; no edit needed if the registry already pulls from `spotAllConfigFields`. If it inlines a copy, replace with the imported constant.

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: PASS across the repo.

### T9.4 — i18n: en/games.json

- [ ] **Step 1: Open** `src/lib/i18n/locales/en/games.json` and add the new keys. Append at top level (preserve existing keys / order):

```jsonc
{
  // …existing keys…
  "spot-all": "Spot the Match!",
  "spot-all-description": "Tap all the tiles that match the prompt — watch out for backwards and look-alike letters.",
  "instructions": {
    // …existing instruction keys…
    "spot-all": "Tap every tile that shows the highlighted character. Some tiles look similar but are flipped or different — only tap the correct ones.",
  },
  "spot-all-ui": {
    "prompt": "Select all the {{target}} tiles",
    "config": {
      "groups": {
        "mirror-horizontal": "Mirror Horizontal",
        "mirror-vertical": "Mirror Vertical",
        "rotation-180": "Rotation 180°",
        "visual-similarity": "Visual Similarity",
        "transposition": "Transposition",
        "reversible": "Reversible (self-mirror)",
      },
      "font-pool": { "label": "Font pool" },
      "visual-variation": { "label": "Visual variation on tiles" },
      "invalid-selection": "Pick at least one group to play",
    },
  },
}
```

> **Note:** `instructions` is already present — merge into the existing object rather than redefining it. If the existing structure uses dot-keys (`"instructions.spot-all": "…"`), match that pattern instead.

- [ ] **Step 2: Format**

Run: `npx prettier --write src/lib/i18n/locales/en/games.json`

### T9.5 — i18n: pt-BR/games.json

- [ ] **Step 1: Open** `src/lib/i18n/locales/pt-BR/games.json` and mirror the structure with translations:

```jsonc
{
  // …existing keys…
  "spot-all": "Encontre Todos!",
  "spot-all-description": "Toque em todas as peças que combinam com o pedido — cuidado com letras invertidas e parecidas.",
  "instructions": {
    "spot-all": "Toque em cada peça que mostra o caractere destacado. Algumas peças parecem similares mas estão invertidas ou são diferentes — toque apenas nas corretas.",
  },
  "spot-all-ui": {
    "prompt": "Selecione todos os {{target}}",
    "config": {
      "groups": {
        "mirror-horizontal": "Espelho Horizontal",
        "mirror-vertical": "Espelho Vertical",
        "rotation-180": "Rotação 180°",
        "visual-similarity": "Semelhança Visual",
        "transposition": "Transposição",
        "reversible": "Reversível (auto-espelho)",
      },
      "font-pool": { "label": "Conjunto de fontes" },
      "visual-variation": { "label": "Variação visual nas peças" },
      "invalid-selection": "Escolha ao menos um grupo para jogar",
    },
  },
}
```

- [ ] **Step 2: Format**

Run: `npx prettier --write src/lib/i18n/locales/pt-BR/games.json`

### T9.6 — Full repo green

- [ ] **Step 1: Typecheck + lint + unit**

Run: `yarn typecheck && yarn lint && yarn vitest run`
Expected: PASS.

### T9.7 — Commit U9

- [ ] **Step 1: Stage + commit**

```bash
git add src/lib/skin/registry.ts src/games/config-fields-registry.tsx src/routes/$locale/_app/game/$gameId.tsx src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
git commit -m "feat(spot-all): wire skin + route + i18n for redesigned schema (spec §4, §6, §8)"
```

> **Push checkpoint:** at this point the game should be playable end-to-end with `yarn dev`. Stop here, run `yarn dev`, navigate to `/en/game/spot-all`, and verify: prompt + grid render → tap correct tile → green → tap wrong → red shake → all correct → confetti + advance → game over → Play Again. If anything is broken, debug before the parallel tail.

---

## Parallel tail — UT-A · UT-B · UT-C (subagents)

These three units are independent. Dispatch in parallel with `superpowers:subagent-driven-development`.

---

## UT-A — Storybook stories (load `write-storybook` skill)

**Scope:** Five new `*.stories.tsx` files for SpotAll, following the project's single-Playground pattern + argTypes policy. **Required skill:** `write-storybook` (project skill — overrides plan boilerplate).

**Files (all NEW):**

- `src/games/spot-all/SpotAllTile/SpotAllTile.stories.tsx`
- `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.stories.tsx`
- `src/games/spot-all/SpotAll/SpotAll.stories.tsx`
- `src/games/spot-all/SpotAll/SpotAll.skin.stories.tsx`
- `src/games/spot-all/SpotAll.config-form.stories.tsx`

### TA.1 — SpotAllTile.stories.tsx

- [ ] **Step 1: Load `write-storybook` skill** for binding rules (single Playground, `argTypes`, decorators, no raw JSON controls). Treat the skill as authoritative if it conflicts with the snippets below.

- [ ] **Step 2: Create the file** with a single `Playground` story. Title MUST be **PascalCase**: `'Games/SpotAll/SpotAllTile'` (project rule from CLAUDE.md). `argTypes` should drive the 6 visual states from spec §5: default, selected, in-cooldown, with-transform, with-variation, selected+variation. Refer to `src/games/number-match/NumberMatchTile/NumberMatchTile.stories.tsx` for argTypes shape.

- [ ] **Step 3: Run storybook**

Run: `yarn storybook` (separate terminal). Open the story, exercise each control. Confirm all 6 states render correctly.

### TA.2 — SpotAllPrompt.stories.tsx

- [ ] **Step 1: Create** `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.stories.tsx` with a Playground story that takes `target` as a `select` argType drawn from a few sample chars (`b`, `d`, `2`, `9`, `oa`).

### TA.3 — SpotAll.stories.tsx

- [ ] **Step 1: Create** `src/games/spot-all/SpotAll/SpotAll.stories.tsx` with a Playground that mounts `<SpotAll>` with a deterministic `seed` and a sample `SpotAllConfig`. Wrap in any required test providers (i18n, router) — re-use the decorators NumberMatch's stories use.

### TA.4 — SpotAll.skin.stories.tsx

- [ ] **Step 1: Create** `src/games/spot-all/SpotAll/SpotAll.skin.stories.tsx` mirroring `NumberMatch.skin.stories.tsx`. v1 only registers `classic`, so a single story is fine; the file establishes the pattern for future skins.

### TA.5 — SpotAll.config-form.stories.tsx

- [ ] **Step 1: Create** `src/games/spot-all/SpotAll.config-form.stories.tsx` mirroring `NumberMatch.config-form.stories.tsx`. Two stories: simple harness and advanced harness (separate playgrounds is acceptable here per project precedent).

### TA.6 — Storybook test runner

- [ ] **Step 1: Run storybook tests**

Run: `yarn storybook:test`
Expected: PASS (all SpotAll stories render without errors).

### TA.7 — Commit UT-A

- [ ] **Step 1: Stage + commit**

```bash
git add src/games/spot-all/**/*.stories.tsx src/games/spot-all/SpotAll.config-form.stories.tsx
git commit -m "test(spot-all): storybook stories per write-storybook skill (spec §9)"
```

---

## UT-B — VR test (load `write-e2e-vr-tests` skill)

**Scope:** Append a `@visual` test for SpotAll to `e2e/visual.spec.ts`. **Required skill:** `write-e2e-vr-tests` (project skill — authoritative for VR placement and Docker workflow).

**Files:**

- Modify: `e2e/visual.spec.ts`

### TB.1 — Append SpotAll VR test

- [ ] **Step 1: Load `write-e2e-vr-tests` skill** — it specifies file placement (append to `e2e/visual.spec.ts`), the `@visual` tag, and the Docker-based update workflow.

- [ ] **Step 2: Append a single test** at the end of `e2e/visual.spec.ts`:

```ts
test('@visual spot-all happy-path layout', async ({ page }) => {
  await page.goto('/en/game/spot-all?seed=vr-spot-all-1');
  await page.getByRole('main').waitFor({ state: 'visible' });
  // Wait for the grid to be present so the screenshot is stable.
  await page.locator('[role=button][aria-pressed]').first().waitFor();
  await expect(page).toHaveScreenshot('spot-all-grid.png', {
    fullPage: true,
  });
});
```

> **Note on `?seed=`:** confirm SpotAll's route reads the `seed` search param (existing PR may already plumb it). If not, the simplest path is to add a `useSearch({ from: '/$locale/_app/game/$gameId' })` read of `seed` and forward to `<SpotAll seed={seed}>`. Treat this as part of UT-B if needed.

### TB.2 — Update baselines

- [ ] **Step 1: Generate baseline** (Docker required)

Run: `yarn test:vr:update`
Expected: writes `e2e/__snapshots__/visual.spec.ts/spot-all-grid-chromium.png` (or similar, per `snapshotPathTemplate`).

- [ ] **Step 2: Verify baseline**

Run: `yarn test:vr`
Expected: PASS.

### TB.3 — Commit UT-B

- [ ] **Step 1: Stage + commit**

```bash
git add e2e/visual.spec.ts e2e/__snapshots__/
git commit -m "test(spot-all): VR baseline for happy-path grid (spec §9)"
```

---

## UT-C — Functional E2E test (`write-e2e-vr-tests` skill)

**Scope:** New file `e2e/spot-all.spec.ts` covering the full game flow: instructions → start → tap correct tiles → confetti → advance → game-over → Play Again. **Required skill:** `write-e2e-vr-tests` for selector/wait conventions.

**Files:**

- Create: `e2e/spot-all.spec.ts`

### TC.1 — Author the flow test

- [ ] **Step 1: Create** `e2e/spot-all.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('spot-all full flow', async ({ page }) => {
  await page.goto('/en/game/spot-all?seed=e2e-spot-all-1');
  await page.getByRole('main').waitFor({ state: 'visible' });

  // Dismiss instructions overlay if present.
  const startButton = page.getByRole('button', { name: /start|play/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }

  // Tap every tile whose visible label matches the prompt target.
  // The prompt text reads "Select all the X tiles" — extract X.
  const promptText = (await page.locator('main').innerText()) || '';
  const match = promptText.match(/Select all the (\S+) tiles/);
  expect(match).not.toBeNull();
  const target = match![1]!;

  const tiles = page.locator('button[aria-pressed]');
  const count = await tiles.count();
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i);
    const text = (await tile.innerText()).trim();
    if (text === target) await tile.click();
  }

  // Round-complete + advance happens within ~1s. Wait for either a new
  // prompt or the game-over Play Again button.
  await Promise.race([
    page
      .getByRole('button', { name: /play again/i })
      .waitFor({ state: 'visible', timeout: 5_000 }),
    page.locator('main').waitFor({ state: 'attached', timeout: 5_000 }),
  ]);
});
```

> **Selector resilience:** the test reads the prompt to discover the target; if the i18n string changes, update the regex. Prefer keeping a stable test-id on the prompt span if changes prove brittle.

### TC.2 — Run

- [ ] **Step 1: Run the new test**

Run: `yarn playwright test e2e/spot-all.spec.ts`
Expected: PASS.

### TC.3 — Commit UT-C

- [ ] **Step 1: Stage + commit**

```bash
git add e2e/spot-all.spec.ts
git commit -m "test(spot-all): E2E happy-path flow (spec §9)"
```

---

## U-Final — PR description, push, verification

**Scope:** Sync everything to remote, update PR #252's description to reflect the redesign + link follow-up issues, run the full local pre-push gate.

### TF.1 — Local pre-push gate

- [ ] **Step 1: Run the full repo verification**

```bash
yarn lint && yarn typecheck && yarn vitest run && yarn build
```

Expected: PASS.

- [ ] **Step 2: VR cross-check** (re-run after UT-B commit landed)

Run: `yarn test:vr`
Expected: PASS.

### TF.2 — Push

- [ ] **Step 1: Push remaining commits**

```bash
git push
```

If the remote moved (concurrent agent commits), `git pull --rebase origin feat/confusable-spotall` then `git push`.

### TF.3 — Update PR #252 description

- [ ] **Step 1: Generate description** with `gh pr view 252 --json body --jq .body > /tmp/old-pr.md` and rewrite to the structure below. Use `gh pr edit 252 --body-file /tmp/new-pr.md`.

```markdown
## Summary

Rewrites the SpotAll game per the redesign spec at
`docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`.

Closes the 12 gaps from the original PR: missing R5b reversibles, no
GameShell/skin/ProgressHUD wiring, broken Check-button mechanic, distractor
transform bug, missing Storybook + VR + E2E coverage, hardcoded English
strings, and the broken difficulty-only config form.

## What changed

- **R5b reversibles** dataset + 3 query helpers (`getAllReversibles`,
  `getReversalTransform`, `isReversible`).
- **NEW `src/lib/distractors/`** library — `DistractorSource` interface +
  registry + deterministic `compose(...)` with seeded RNG. Two built-in
  sources: `confusable-pairs`, `reversible-chars`.
- **Per-tap auto-validate** mechanic; no Check button. Wrong tap = 600 ms tile
  cooldown with shake + `playWrong`.
- **GameShell + skin + ProgressHUD** integration.
- **Grouped picker** config form (5 confusable groups + Reversible).
- **Visual variation** applies to every tile (correct + distractor); colour
  pool is now CSS tokens (`--skin-variation-1..6`) so any future skin can
  override the palette without code changes.
- **Storybook** (5 new stories), **VR** (`@visual spot-all-grid`), **E2E**
  (`e2e/spot-all.spec.ts`).
- **i18n**: full `spot-all*` keys in `en` and `pt-BR`.

## Spec deltas

- VR/E2E paths follow the project's `write-e2e-vr-tests` skill (`e2e/`)
  rather than the spec's `tests-vr/`/`tests-e2e/` placeholders.

## Follow-ups (already filed)

- #257 — generalise `Slot` with `mode='tap-select'` + extract `useGameRound`
  (blocks #260 #261 #262)
- #258 — AnswerGame bounce animation for `lock-*` modes
- #259 — distractor library future sources meta-issue
- #260 #261 #262 — WordSpell / NumberMatch / SortNumbers adopt `useGameRound`

## Test plan

- [ ] `yarn lint && yarn typecheck && yarn vitest run && yarn build` green
- [ ] `yarn test:vr` green (Docker)
- [ ] `yarn playwright test e2e/spot-all.spec.ts` green
- [ ] Manual: `/en/game/spot-all` — full happy path
- [ ] Manual: try empty selection in custom config → "Pick at least one group"
- [ ] Manual: pt-BR locale — strings translated

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 2: Apply**

Run: `gh pr edit 252 --body-file /tmp/new-pr.md`

### TF.4 — Verify CI

- [ ] **Step 1: Watch CI**

Run: `gh pr checks 252 --watch`
Expected: All required checks green (`Lint`, `Type Check`, `Unit Tests`, `Storybook Tests`, `Build`, `E2E — chromium`).

If any check fails, debug and patch on the same branch — do **not** open a new PR.

### TF.5 — Hand off for review

- [ ] **Step 1: Run** `superpowers:requesting-code-review` to surface the PR for human review per CLAUDE.md.

---

## Out-of-scope reminders (do NOT touch in this PR)

- `Slot` / `AnswerGameProvider` / `answerGameReducer` — Issue #257.
- Bounce animation for `lock-*` — Issue #258.
- New distractor sources (`random-other`, `phonemic`, `case`) — Issue #259.
- WordSpell / NumberMatch / SortNumbers `useGameRound` adoption — #260–#262.

If a task forces you toward any of the above, **stop** and re-read the spec; the architecture has a deliberate seam there and crossing it is what will cause the next round of rework.

---

## Self-review notes

- All 12 spec gaps mapped to a unit (R5b → U1, engine wiring → U7, ProgressHUD → U7, skin → U3+U7+U9, TTS/AudioButton → U6, i18n → U9, custom config → U8+U9, Storybook → UT-A, VR/E2E → UT-B/C, transform bug → U5, mechanic → U5+U7, variation everywhere → U5).
- Type names consistent across tasks: `SpotAllConfig`, `SpotAllRound`, `SpotAllTile` (state) vs `SpotAllTile` (component) — distinct files, no collision in import scope. `SpotAllVisualVariation` exported from `pick-variation.ts` and re-imported by `types.ts`.
- TDD discipline: every reducer / source / compose / pickVariation / config-form behaviour has a failing-test step before implementation.
- Frequent commits: 12+ commits expected, one per unit + tail unit.
- Spec deltas listed at top (test paths · mdx classification).
