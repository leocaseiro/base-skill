# Countable Dots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each dot in `DotGroupQuestion` individually tappable so kids
can count them one by one, with per-dot numbering and TTS on each tap.

**Tech Stack:** TypeScript, React, Tailwind CSS, Web Speech API (TTS)

**Spec:**
[docs/superpowers/specs/2026-04-10-match-number-improvements-design.md](../specs/2026-04-10-match-number-improvements-design.md)
(Section 3 — Countable Dots)

---

## File Map

### New files

_(none)_

### Modified files

- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` — add
  per-dot tap state, numbering overlay, TTS on tap, auto-reset on count
  change
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.test.tsx` —
  tests for tap-to-count, sequential numbering, reset on count change
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.stories.tsx` —
  update stories to demonstrate countable dots

---

## Steps

- [ ] **Step 1 — Add per-dot tap state**
  - File: `DotGroupQuestion.tsx`
  - Add `useState<(number | null)[]>` initialised to
    `Array(count).fill(null)` — tracks assigned count per dot
  - Add a `useRef<number>` for `nextCount` starting at `1`
  - Reset both when `count` changes (use `useEffect` with `count` dependency)

- [ ] **Step 2 — Convert dots from `<span>` to `<button>`**
  - File: `DotGroupQuestion.tsx`
  - Replace each `<span role="presentation">` dot with a
    `<button type="button">`
  - Keep existing styling: `size-10 rounded-full bg-primary`
  - Add `aria-label` for accessibility (e.g. "Dot 3 of 7")
  - Add `onClick` handler for the tap logic

- [ ] **Step 3 — Implement tap handler**
  - File: `DotGroupQuestion.tsx`
  - On tap of an unnumbered dot (value is `null`):
    - Assign `nextCount.current` to that dot's position in the state array
    - Increment `nextCount.current`
  - Already-tapped dots do nothing on re-tap (guard: if value !== null, return)

- [ ] **Step 4 — Render number overlay on tapped dots**
  - File: `DotGroupQuestion.tsx`
  - When a dot has an assigned number, render the number centered on the dot
  - White text (`text-white`), bold, centered over the primary circle
  - Use `relative` positioning on the button with an `absolute` number overlay
  - Font size: `text-sm font-bold`

- [ ] **Step 5 — Add TTS on tap**
  - File: `DotGroupQuestion.tsx`
  - On each tap, speak the cardinal word for the assigned number
    (e.g. "one", "two", "three")
  - Use the existing `useGameTTS()` hook or `speechSynthesis.speak()` directly
  - Use `toCardinalText` from `number-words.ts` for locale-aware words
  - Locale sourced from existing context/params

- [ ] **Step 6 — Auto-reset on count change**
  - File: `DotGroupQuestion.tsx`
  - `useEffect` with `[count]` dependency:
    - Reset state array to `Array(count).fill(null)`
    - Reset `nextCount.current` to `1`
  - This handles round transitions

- [ ] **Step 7 — Update tests**
  - File: `DotGroupQuestion.test.tsx`
  - Test: tapping a dot assigns sequential numbers (1, 2, 3...)
  - Test: tapping an already-numbered dot does nothing
  - Test: state resets when `count` prop changes
  - Test: dots render as buttons with correct aria-labels

- [ ] **Step 8 — Update stories**
  - File: `DotGroupQuestion.stories.tsx`
  - Update existing stories to show interactive countable dots
  - Add a story with a higher count (e.g. 9 dots) to show wrapping

- [ ] **Step 9 — Verify**
  - `yarn typecheck` passes
  - `yarn lint` passes
  - `yarn test` passes
