# Comprehensive Storybook Authoring Skill — Design Spec

**Date:** 2026-04-16
**Status:** Draft (awaiting user review)
**Owner:** `.claude/skills/write-storybook/SKILL.md`

## Background

A coverage audit of `src/components/**` found 12 components with no story file and a wider set of existing stories with gaps (raw JSON controls instead of proper inputs, missing interaction coverage, no edge-case variants). The chosen response is to make the existing `write-storybook` skill the durable contract for "what a good story looks like in this project," then ship implementation work in small, focused PRs (Split B from brainstorming) that each say "follows the skill."

This spec defines the updated skill content. Implementation plans for individual story PRs will be written separately as each is started.

## Goals

1. Codify project conventions so any future story (human- or agent-authored) is consistent with the rest of the codebase.
2. Document project-specific addon configuration (themes, viewports, a11y, actions) so authors don't fight or duplicate global setup.
3. Establish a "rich interaction by default" baseline using `play()` functions and proper controls.
4. Provide an audit checklist for upgrading existing stories when touched.

## Non-Goals

- Listing or prioritizing the 12 missing components — that lives in the brainstorming notes and individual implementation plans.
- Adding new addons (MSW, chromatic, etc.) — out of scope; flagged as "future" in the skill.
- Changing the global `.storybook/preview.tsx` or `.storybook/main.ts` — the skill describes how to use them, not how to alter them.
- Visual regression policy — VR is hand-curated in `e2e/visual.spec.ts`; the skill tells authors to add VR coverage there separately, not via stories.

## Project Reality (verified)

- Storybook 10.3.3 with `@storybook/react-vite`.
- Addons installed: `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/addon-docs`, `@storybook/addon-mcp`. Test runner: `@storybook/test-runner` 0.24.3.
- `parameters.a11y.test: 'error'` is global — every story is axe-checked and fails CI on any violation.
- `parameters.actions: { argTypesRegex: '^on[A-Z].*' }` is global — every `onFoo` prop is auto-mocked; per-prop `{ action }` config is unnecessary.
- 5 themes registered as global toolbar items: `light`, `dark`, `forest-light`, `forest-dark`, `high-contrast`.
- 5 viewports registered globally: `mobileSm` (360×640), `mobileLg` (390×844), `tabletPortrait` (768×1024), `tabletLandscape` (1024×768, default), `desktop` (1280×800).
- VR runs in Docker via `yarn test:vr` against the live app routes (`e2e/visual.spec.ts`), not against Storybook.
- No MSW addon installed.
- `@storybook/test` provides `userEvent`, `expect`, `within`, etc. for `play()` functions.

## Updated Skill Structure

The skill keeps its existing top-to-bottom flow and adds new sections. Final ordering:

1. Overview
2. Rules
3. File structure
4. Minimal template
5. Decorators
6. **Controls policy (NEW)**
7. **Complex object props (NEW)**
8. **Required variants (REFINED)**
9. **Rich interaction with `play()` (NEW)**
10. **A11y is enforced (NEW)**
11. **Themes per story (NEW)**
12. **Viewport per story (NEW)**
13. **Mocking & fixtures (NEW)**
14. **Visual regression boundary (NEW)**
15. Running storybook tests (kept)
16. **Audit/upgrade checklist (NEW)**
17. Common mistakes (refreshed)

## Section Specs

Each section below defines what goes in the skill, the key rule(s), and the example(s) it must include. Wording in the actual SKILL.md may differ; the spec captures intent.

Sections 1–5 and 15 are kept as-is from the current SKILL.md (Overview, Rules, File structure, Minimal template, Decorators, Running storybook tests). The implementation plan should re-read the existing skill and only touch the section bodies listed here.

### 6. Controls policy

**Rule:** Every prop that is not a callback, JSX node, or complex object MUST have an explicit `argTypes` entry with a proper interactive control. Raw JSON object inputs in the controls panel are not acceptable.

**Mapping table to include:**

| Prop type                    | Control                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| String union / enum          | `control: { type: 'select' }` with `options: [...]` (or `'radio'` for ≤4 options) |
| Boolean                      | `control: 'boolean'`                                                              |
| Bounded number               | `control: { type: 'range', min, max, step }`                                      |
| Free-text                    | `control: 'text'`                                                                 |
| Color                        | `control: 'color'`                                                                |
| Multi-select array of unions | `control: 'multi-select'` with `options`                                          |
| Callback (`onFoo`)           | `control: false` (auto-mocked by global `argTypesRegex`)                          |
| JSX / ReactNode              | `control: false`                                                                  |

**Note in the section:** Don't add `argTypes: { onFoo: { action: 'foo' } }` — the global `actions.argTypesRegex` already wires it up. Adding it manually is harmless but noise.

### 7. Complex object props

**Rule:** When a component takes a config-shaped object prop (e.g., a game `config` with mode + difficulty + counts), do NOT expose the whole object as a JSON control. Break it into individual args wired into a custom `render` function.

**Example to include:** A `GameConfigForm` whose `config` prop has `{ mode: 'easy' | 'hard'; rounds: number }`. The story declares `args: { mode, rounds }` and uses `render: (args) => <GameConfigForm config={{ mode: args.mode, rounds: args.rounds }} />` so each subfield gets its own proper control.

### 8. Required variants (refined from existing section)

Replace the current loose list with explicit gates:

- **Default** — required, happy path, all required props.
- **One story per enum value** of any prop that is a string union — required if the visual differs by value (skip if identical pixels).
- **State variants** — required for any state the component can be in: `Loading`, `Error`, `Empty`, `Disabled`, `Submitted`, etc. One story per distinct state the component can render.
- **Edge cases** — at least one for components that take user-controllable text/list props: `LongText`, `ManyItems`, `OneItem`, `MaxLength`.
- **Interaction** — at least one `play()` story exercising the primary user flow (see §9).

### 9. Rich interaction with `play()`

**Rule:** Every interactive component (forms, dialogs, anything with a click/keyboard handler) MUST have at least one `play()` story exercising the primary flow. Pure-display components are exempt.

**Imports & helpers to document:** `import { userEvent, within, expect } from '@storybook/test'`.

**Patterns to include in the section:**

- Form submit happy path: fill fields → click submit → assert success state.
- Form validation: submit empty → assert error message visible → focus assertion on first invalid field.
- Click sequence: open menu → select item → assert closed + selection visible.
- Keyboard-only: `userEvent.tab()` through the component, assert focus lands where expected.
- Disabled-state assertion: assert the submit button has `disabled` attribute when invariants fail.

**Convention:** Name interaction stories after the flow, not the state — `SubmitsValidForm`, `ShowsErrorOnEmptyName`, `ClosesOnEscape`. Keep them small and single-purpose; one assertion per story is fine.

### 10. A11y is enforced

**Rule:** A11y checks run automatically on every story via the global `parameters.a11y.test: 'error'` config. **You cannot opt out for a new story.** A story that triggers any axe violation (including color-contrast) will fail `yarn test:storybook` and CI.

**What authors do:** nothing extra by default. To tune for a story that legitimately needs it (e.g., a deliberately broken state to demonstrate fallback behavior), document the override pattern: `parameters: { a11y: { test: 'todo' } }` — but flag in the skill that this should be rare and requires justification in a comment.

### 11. Themes per story

Document the 5 global themes (`light`, `dark`, `forest-light`, `forest-dark`, `high-contrast`) and how to pin a story to one:

```tsx
export const Dark: Story = {
  globals: { theme: 'dark' },
};
```

Note that the toolbar lets users switch themes interactively too — a per-story `globals.theme` override is for when a specific variant is meaningfully different in a specific theme (e.g., a high-contrast-only edge case).

### 12. Viewport per story

Document the 5 global viewport names (`mobileSm`, `mobileLg`, `tabletPortrait`, `tabletLandscape`, `desktop`) and how to pin:

```tsx
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobileSm' } },
};
```

Mention the global default is `tabletLandscape`. Per-story viewport pinning is encouraged when a component's layout meaningfully differs at a breakpoint.

### 13. Mocking & fixtures

**Rule:** Don't inline large data blobs (word lists, configs, sample sentences) in stories. Move them to a co-located file (e.g. `MyComponent.fixtures.ts` next to the story, or a shared `*.fixtures.ts` if reused). The project does not currently have a top-level `src/test/fixtures/` directory; co-locate by default.

**For randomness/timers in `play()`:** Stub `Math.random` via `globalThis.Math.random = () => 0.42` inside `play()` for reproducible runs (mirror the pattern in `e2e/visual.spec.ts`). For timers, use `vi.useFakeTimers()` — note Vitest is the project's test runtime.

**MSW:** Not currently installed. If a story needs network mocking, install `msw-storybook-addon` first; the skill flags this as "future addition" and links here.

### 14. Visual regression boundary

**Rule:** **Stories are NOT a VR mechanism in this project.** VR is hand-curated Playwright tests in `e2e/visual.spec.ts` that drive the live app routes through Docker (`yarn test:vr`). Adding a new story does not add a VR snapshot.

**What this means for authors:**

- Do NOT add `parameters: { chromatic: ... }` — chromatic is not used.
- If a new component or visual state needs regression coverage, add a `test('@visual ...')` block in `e2e/visual.spec.ts` that loads the relevant route (or, for component-only shots, a Playwright route that mounts the component — currently not used; mention as future option).
- Storybook is for development/manual review and a11y/interaction tests; VR is for pixel guards on user-facing routes.

### 16. Audit/upgrade checklist

When you edit an existing story for any reason, run this checklist before opening the PR. Treat each item as a yes/no gate; if any are "no," either fix or explicitly justify in the PR description.

- [ ] All non-callback, non-JSX props have proper `argTypes` controls (no raw JSON for enums/booleans/numbers/colors)
- [ ] No manual `{ action: '...' }` for `onFoo` handlers (global `argTypesRegex` covers it)
- [ ] Required variants (§8) are present
- [ ] At least one `play()` interaction story if the component is interactive (§9)
- [ ] Decorators match current component dependencies (e.g., if the component started using `useSettings`, `withDb` is now required)
- [ ] No `parameters.chromatic` (we don't use it)
- [ ] Story file passes `yarn test:storybook --url <port>` locally

The skill should frame this as: "if you're touching the file, leave it better than you found it."

### 17. Common mistakes (refreshed)

Existing rows kept. Add:

| Mistake                                                  | Fix                                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Raw JSON control for an enum/union prop                  | Add `argTypes` with `select`/`radio` and explicit `options`                                        |
| Whole-config JSON blob as a single control               | Break into individual args + custom `render` (§7)                                                  |
| Manually adding `argTypes: { onFoo: { action: 'foo' } }` | Remove — global `argTypesRegex` already covers it                                                  |
| Adding `parameters.chromatic`                            | Remove — VR is in `e2e/visual.spec.ts`, not Storybook                                              |
| Trying to opt out of a11y on a new story                 | Don't — it's enforced. Fix the violation, or use `test: 'todo'` only with documented justification |
| Inlining `Math.random()` results in story args           | Pin via `globalThis.Math.random = () => N` inside `play()` for reproducibility                     |

## Acceptance Criteria

The updated `SKILL.md`:

1. Includes all sections in the order listed above.
2. Each new section includes at least one concrete example (TSX snippet) that compiles against the project's current Storybook 10 / `@storybook/react` types.
3. Removes the stale "argTypes for Event Handlers" guidance from the existing `argTypes` block (replaced by §6 + §17).
4. References real project paths (`.storybook/preview.tsx`, `e2e/visual.spec.ts`) — the implementation plan must verify each path still exists before committing.
5. Passes `yarn fix:md` and `yarn lint:md` cleanly.

## Out of Scope (explicit)

- Auto-generating VR snapshots from stories.
- Adding MSW or any new addon.
- Migrating existing stories — that's separate PRs (Split B Plans 2–6).
- The 12 missing components — separate PRs (Split B Plan 1, etc.).

## Follow-up Plans

After this skill update merges, individual implementation plans (one per Split B group) will be brainstormed and written separately:

1. AdvancedConfigModal alone
2. SaveConfigDialog + CoverPicker
3. 3 SimpleConfigForm components
4. 4 config primitives (Stepper, CellSelect, ChipStrip, ChunkGroup)
5. JSON-controls audit on existing stories
6. Coverage-gap fills on existing stories

Each plan will reference this skill as the source of truth for "what a good story looks like" and only specify what's unique to its scope.
