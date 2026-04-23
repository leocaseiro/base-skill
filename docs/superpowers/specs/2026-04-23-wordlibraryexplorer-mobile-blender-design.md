# WordLibraryExplorer — Mobile redesign + PhonemeBlender

**Date:** 2026-04-23
**Status:** Draft (brainstorming output)
**Scope:** `src/data/words/WordLibraryExplorer.tsx`,
`src/data/words/phoneme-audio.ts`, plus a new
`src/components/phoneme-blender/PhonemeBlender.tsx` component shared with the
app.

## Problem

The Storybook explorer at
`/story/data-wordlibraryexplorer--default` has three usability problems on
the per-word card:

1. **Audio sticks after window switch.** Each grapheme chip starts a sustained
   phoneme loop on `pointerEnter` and stops on `pointerLeave` / `blur`. When
   the user `cmd+tab` away mid-hover, neither event fires, so the loop runs
   until the tab is re-focused or another chip is hovered.
2. **No mobile interaction.** Hover is the only way to sustain a phoneme on
   the chips. Touch users get one-shot tap only — no blending experience.
3. **Visual clutter on small screens.** The card stacks word, syllabification,
   IPA, badges, chips, and the speak button across many rows. In landscape on
   a phone (≈360 px tall), a single card no longer fits.

The shell around the cards also fights small screens: the filter sidebar is a
fixed 320 px column that stacks above results on mobile, pushing the actual
content below the fold.

## Goals

- Replace the hover-only chip interaction with a single, discoverable
  **PhonemeBlender** control: continuous scrub track + ▶ play button + speed
  selector — works equally well on touch and mouse.
- Stop sustained audio when the page becomes hidden or the window loses focus.
- Make one card visible per viewport in mobile landscape (≈720×360) without
  losing dev-relevant info (syllables, IPA, level/syllable badges, grapheme
  chips on demand).
- Collapse the filter sidebar into a sheet on mobile so results dominate the
  viewport.
- Keep the new `PhonemeBlender` reusable so the gameplay app can adopt it
  later without code duplication.

## Non-goals

- Custom-word entry / on-the-fly grapheme construction (deferred — separate
  spec).
- Reworking which filters exist or how `filterWords` runs.
- URL-syncing the active card or blender state.
- Building the blender into the actual game screens — only the shared
  component lands here. Adoption inside `WordSpell` / `NumberMatch` is a
  follow-up.
- Re-recording or re-timing the phoneme sprite. Existing `phonemes.json`
  durations drive zone widths as-is.

## Design

### PhonemeBlender component

New file: `src/components/phoneme-blender/PhonemeBlender.tsx`.

**Props**

```ts
interface PhonemeBlenderProps {
  word: string; // display label, e.g. "putting"
  graphemes: ReadonlyArray<{ g: string; p: string }>;
  // Optional override per phoneme. Falls back to the sprite manifest entry
  // (durationMs, loopable). Component reads phonemes.json once via the
  // existing module-level cache in phoneme-audio.ts.
  phonemeOverrides?: Record<
    string,
    { durationMs?: number; loopable?: boolean }
  >;
}
```

**Anatomy**

```text
┌─────────────────────────────────────────────────┐
│              p u tt ing                         │  ← word, per-letter color states
│  ┌──┐ ┌─────────────────────────────────────┐   │
│  │▶ │ │ [zone][zone] [zone]  [zone]   [▮]   │   │  ← play button + scrub track + thumb
│  └──┘ └─────────────────────────────────────┘   │
│              🐢 slow  🐈 normal  🐇 fast         │  ← speed selector
└─────────────────────────────────────────────────┘
```

**Word display**

- Each grapheme rendered as `<span data-idx={i}>g</span>`. Three visual
  states drive the color (no opacity-only fade — WCAG 1.4.3 contrast):
  - **idle** (`unplayed`): faint indigo (`text-indigo-200`)
  - **active** (currently sounding): ink (`text-foreground`, full contrast)
  - **passed** (already played in this scrub/play pass): indigo-dark
    (`text-indigo-700`)
- A passed letter reverts to idle when the scrub returns past it (manual
  drag) or when a fresh play pass starts.

**Track**

- Single horizontal bar, full width of the player row.
- Outer bar uses `border-radius: 0.75rem` to match
  `LetterTileBank` (`rounded-xl`).
- Inside, one **zone** per grapheme. Zone widths are flex-proportional to the
  phoneme's `duration` (ms) from the sprite manifest.
- Adjacent zones butt up flat against each other (no per-zone rounding).
  Hairline white divider between zones for visual separation.
- Zone color encodes phoneme type:
  - `loopable: true` → indigo (`bg-indigo-500`) — sustainable.
  - `loopable: false` → pink (`bg-pink-500`) — stop consonant.
- Active zone gets an ink ring (`box-shadow: 0 0 0 2px white inset, 0 0 0 2px var(--ink)`) so the active state survives the indigo background.

**Thumb**

- Small tile, 1.85 rem square, `border-radius: 0.5em`.
- **Idle**: white fill, ink border.
- **Active** (drag in progress or auto-play running): ink fill, white border.
- Same active/idle affordance as the active zone — the thumb is the
  "currently selected tile" picked up off the track.
- `pointer-events: none` on the thumb itself; pointer events live on a
  hit-area wrapper covering the whole track row.

**Play button (▶ / ⏸)**

- Round, ink border, white fill. Sits to the left of the track.
- Press → walks the thumb left→right at real-time pace, one phoneme zone at
  a time, multiplied by the speed selector. While playing, the icon swaps to
  ⏸; pressing again stops and clears the highlight.
- Auto-play uses `requestAnimationFrame` reading wall time (`performance.now()`)
  for accurate timing across speed changes.

**Speed selector**

- Three buttons, child-friendly icon + label, single-select pill group:
  - `🐢 slow` (real-time × 1.6)
  - `🐈 normal` (real-time × 1.0, default)
  - `🐇 fast` (real-time × 0.55)
- State lives on the component (uncontrolled). Persisting across cards is
  out of scope.

**Audio behaviour**

- Continuous scrub: pointer position maps to `[0, totalMs]`. The active
  zone is whichever phoneme's `[start, start+duration)` window the pointer
  is inside.
- Entering a **loopable** zone calls `playPhoneme(p, { sustain: true })`.
- Entering a **stop** zone fires the phoneme **once per drag pass**: the
  component tracks a `Set<number>` of "already-fired stop indices" cleared
  on each `pointerdown`. Wiggling back and forth across a `t` does not
  stutter; lifting and re-pressing starts a new pass.
- Leaving the track row (`pointerleave`), `pointerup`, `pointercancel`, or
  any of the global stop conditions (see next section) calls `stopPhoneme()`
  and clears the active highlight.

**Keyboard a11y**

- The track row has `role="slider"`, `aria-valuemin=0`, `aria-valuemax={totalMs}`,
  `aria-valuenow`, `aria-valuetext` of the active grapheme/phoneme.
- `←` / `→` step by one grapheme; `Home` / `End` jump to first / last.
- `Space` / `Enter` toggle auto-play.
- Play button is a regular `<button>` with `aria-label="Play /word/" / "Pause"`.

### Audio stop-on-blur (the bug fix)

In `src/data/words/phoneme-audio.ts`:

- Add a one-time module-level installer `installAutoStopGuards()` invoked
  the first time `playPhoneme` runs.
- The guard subscribes to:
  - `document.addEventListener('visibilitychange', ...)` — calls
    `stopCurrent()` whenever `document.hidden` becomes true.
  - `window.addEventListener('blur', ...)` — calls `stopCurrent()`.
  - `window.addEventListener('pagehide', ...)` — covers iOS Safari
    backgrounding.
- Listeners are added once; the install function is idempotent (guarded by
  a module-level `boolean`).
- `__resetPhonemeAudioForTests` resets that guard so tests start fresh.
- Rationale: this is a global audio invariant ("stop playing if the user
  isn't here"), not a per-component concern. Centralising avoids every
  caller re-implementing the same wiring.

### Card layout (explorer)

`ResultCard` (in `WordLibraryExplorer.tsx`) recomposes to:

```text
┌─────────────────────────────────────────────────┐
│  putting                                        │
│  [put·ting]   🔈 /ˈpʊtɪŋ/        L3  2 syl      │
│  ┌─────────────────────────────────────────┐    │
│  │  PhonemeBlender                         │    │
│  └─────────────────────────────────────────┘    │
│  · · · · · · · · · · · · · · · · · · · · · ·    │
│  p[p]  u[ʊ]  tt[t]  ing[ɪŋ]                     │
└─────────────────────────────────────────────────┘
```

- **Title row** — `word` (large bold).
- **Info row** — `[syllabification]` + `🔈 /ipa/` button (TTS, replaces the
  old top-right icon button) + level/syllable badges right-aligned.
  - Speaker button: `🔈 /ipa/` becomes the visible label; clicking calls
    `speak(word, { rate: 0.9, lang: 'en-AU' })` exactly as today.
    `aria-label="Speak {word}"` so screen readers don't read the IPA
    string aloud.
- **Blender block** — `PhonemeBlender` instance, surrounded by a tinted
  `bg-indigo-50` rounded box.
- **Chips row** — `g[p]` chips (existing `GraphemeChips` data, simplified to
  display-only spans). Hidden by the chips toggle (see next section). The
  old hover-to-blend chip behaviour is removed; the blender owns that
  interaction now.

### Explorer shell (mobile + desktop)

**Top bar (mobile only).** Replaces the current always-visible sidebar:

- ⚙️ button opens a filter sheet (existing
  `#/components/ui/sheet` component, `side="bottom"`). The sheet contains the
  existing Filters card content unchanged.
- A small badge on the ⚙️ button shows the count of active filter
  predicates (region is excluded; only user-meaningful filters count).
- Title `Word Library` centered.

**Active-filter pills (mobile only).** A horizontal-scroll row beneath the
search input shows each active filter as a removable pill (e.g. `L1–L3 ✕`,
`2 syll ✕`). Tapping the ✕ clears that one filter. A trailing
`+ add filter` pill opens the filter sheet.

**Results meta bar.** Always visible:

- Left: `Showing N–M of K`
- Right: `□ show g[p] chips` checkbox controlling the chip row's visibility
  on every card.
  - Default `true` in portrait + desktop.
  - Default `false` in landscape (saves vertical space; one card fits the
    viewport).
  - State lives on `WordLibraryExplorer` (uncontrolled).
- Page-size select moves into the desktop header bar; on mobile it lives
  inside the filter sheet to free room.

**Pagination.** Touch-sized buttons (`min-height: 2.25rem`) at the **bottom**
of the result list on mobile. On desktop, pagination moves to the **header
bar** above the results to free vertical room.

**Result grid.**

- Mobile portrait/landscape: single column, list-style.
- Desktop: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`.

**Breakpoints.** Tailwind defaults:

- `< 768px` → mobile layout.
- `>= 768px` → desktop layout (sidebar visible).
- Landscape detection uses `@media (orientation: landscape) and (max-height: 480px)` to drive the chips-toggle default.

### File touch list

- `src/data/words/WordLibraryExplorer.tsx` — restructure `ResultCard`,
  `WordLibraryExplorer` shell, drop hover wiring from `GraphemeChips`,
  introduce filter sheet + active-filter pills + chips toggle.
- `src/data/words/WordLibraryExplorer.test.ts` — adjust assertions; add
  coverage for chips-toggle default and pill removal.
- `src/data/words/phoneme-audio.ts` — add `installAutoStopGuards`.
- `src/data/words/phoneme-audio.test.ts` — add coverage for visibility +
  blur stops.
- `src/components/phoneme-blender/PhonemeBlender.tsx` — new component.
- `src/components/phoneme-blender/PhonemeBlender.test.tsx` — new tests.
- `src/components/phoneme-blender/PhonemeBlender.stories.tsx` — Storybook
  story with sample words from levels 1–4.
- `src/components/phoneme-blender/PhonemeBlender.flows.mdx` — short
  architecture doc per project policy.

### Testing

- **Unit (vitest):**
  - `phoneme-audio`: visibilitychange + blur + pagehide each call
    `stopCurrent()`; install is idempotent.
  - `PhonemeBlender`: zone widths proportional to durations; pointer drag
    sets the active index; auto-play advances at expected wall-time
    intervals (vi.useFakeTimers + RAF mock); stop consonants fire once per
    drag pass; keyboard arrows advance/retreat.
- **Storybook visual tests:** new story for `PhonemeBlender` (default + each
  speed + portrait + landscape). Existing
  `WordLibraryExplorer` story regenerates baselines (gated by VR rules in
  `CLAUDE.md`).
- **E2E (Playwright):** smoke test on the explorer story:
  - opens the filter sheet on mobile viewport,
  - removes an active-filter pill,
  - drags the blender thumb and asserts the active letter highlights,
  - switches to a different tab and asserts no audio source remains
    playing (via a `__phonemeAudioState` debug hook gated by
    `import.meta.env.DEV`).

### Performance

- Sprite + manifest already cached at module level; the blender adds no
  new fetches.
- `requestAnimationFrame` loop only runs while auto-play is active and
  cancels on stop.
- Zone re-render is keyed by `(word, graphemes)` — pure CSS flex
  proportions, no per-frame DOM churn.

## Open questions

None blocking. Speed multipliers (×1.6, ×1.0, ×0.55) are starting values
and may be tuned during implementation review.

## Out of scope (next specs)

- Custom-word entry that lets the user type any word and synthesise the
  grapheme breakdown on the fly (option C from the original brainstorm).
- Adopting `PhonemeBlender` inside `WordSpell` and `NumberMatch` gameplay.
