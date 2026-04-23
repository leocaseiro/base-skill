# Handoff: WordLibraryExplorer mobile + PhonemeBlender — spec ready, plan next

**Date:** 2026-04-23
**Branch:** claude/hardcore-driscoll-b81954
**Worktree:** worktrees/hardcore-driscoll-b81954
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/.claude/worktrees/hardcore-driscoll-b81954`
**Git status:** clean
**Last commit:** `ddfa9e68 docs(spec): chips tap-to-play; recolor blender purple/yellow`
**Ahead of origin:** 2 commits
**PR:** none yet (push + open after the implementation plan lands)

## Resume command

```
/resync
cd .claude/worktrees/hardcore-driscoll-b81954
# Approved spec is committed. Next: write the implementation plan.
# Invoke superpowers:writing-plans against the spec below.
```

## Current state

**Task:** Phase B of a 3-part WordLibraryExplorer improvement track. Bug 1
(audio sticks on cmd+tab) is folded into this phase via an audio
stop-on-blur installer in `phoneme-audio.ts`. Phase C (custom-word entry)
is deferred.
**Phase:** spec approved, ready for implementation planning.

## What we did

Brainstormed and committed a design spec for a mobile-friendly redesign of
the WordLibraryExplorer card and shell, plus a new reusable
`PhonemeBlender` component (continuous scrub + ▶ play + speed selector).
Iterated 4 visual mockups via the brainstorming visual companion before
locking the layout. The spec also folds in the audio-sticks bug fix.

## Decisions made

- **Continuous scrub, not snap.** More child-friendly. Zone widths
  proportional to phoneme `duration`; thumb sweeps faster through short
  stops, lingers on long vowels.
- **Stop consonants fire once per drag pass.** No re-trigger on wiggle.
  New `pointerdown` clears the fired set.
- **Color states over fade** — WCAG 1.4.3 contrast. Idle / active / passed
  letter colors. Active zone gets an ink ring.
- **Colors purple + yellow** (loopable / stop). Originally indigo + pink;
  user requested swap.
- **Thumb radius `.5em`**, outer track radius `.75rem` (matches WordSpell
  `LetterTileBank` `rounded-xl`).
- **Flat seams between zones** — no per-zone rounding; hairline white
  divider between zones.
- **Speaker button** in card info row uses `🔈 /ipa/` as visible label;
  `aria-label="Speak {word}"` so SR doesn't read IPA aloud.
- **Chips kept in card** (not removed). Tap/click plays the phoneme once
  via `playPhoneme(p)` (no sustain, no hover). Chips toggle defaults: on
  in portrait/desktop, off in landscape.
- **Audio stop guard** lives in `phoneme-audio.ts` (module-level,
  installed once). Listens to `visibilitychange`, `blur`, `pagehide`. Not
  per-component — every consumer benefits.
- **Mobile shell:** filter sheet via existing `#/components/ui/sheet`
  (`side="bottom"`); active-filter pill row under search; pagination at
  bottom. Desktop sidebar stays; pagination moves to header bar.
- **Scope split:** Phase B = redesign + bug fix. Phase C (custom words)
  deferred to its own spec.

## Spec / Plan

- Spec: [docs/superpowers/specs/2026-04-23-wordlibraryexplorer-mobile-blender-design.md](../../docs/superpowers/specs/2026-04-23-wordlibraryexplorer-mobile-blender-design.md)
- Visual mockups (gitignored, brainstorming session): `.superpowers/brainstorm/49592-1776907571/content/explorer-mobile-v4.html`
- Plan: not yet written — next step.

## Key files (will be touched by implementation)

- [src/data/words/WordLibraryExplorer.tsx](../../src/data/words/WordLibraryExplorer.tsx) — restructure `ResultCard`, replace `GraphemeChips` hover with tap-only, add filter sheet shell + active-filter pills + chips toggle.
- [src/data/words/phoneme-audio.ts](../../src/data/words/phoneme-audio.ts) — add `installAutoStopGuards()` invoked from first `playPhoneme` call.
- [src/data/words/WordLibraryExplorer.test.ts](../../src/data/words/WordLibraryExplorer.test.ts) — adjust assertions, cover chips-toggle default + pill removal.
- [src/data/words/phoneme-audio.test.ts](../../src/data/words/phoneme-audio.test.ts) — cover visibility + blur + pagehide stops.
- `src/components/phoneme-blender/PhonemeBlender.tsx` (new) — the component.
- `src/components/phoneme-blender/PhonemeBlender.test.tsx` (new).
- `src/components/phoneme-blender/PhonemeBlender.stories.tsx` (new) — words from levels 1–4, all three speeds, portrait + landscape viewports.
- `src/components/phoneme-blender/PhonemeBlender.flows.mdx` (new) — short architecture doc per project policy.

## Open questions / blockers

None. Speed multipliers (slow ×1.6, normal ×1.0, fast ×0.55) are starting
values to tune during implementation review.

## Next steps

1. [ ] In a fresh session: `superpowers:writing-plans` against
       `docs/superpowers/specs/2026-04-23-wordlibraryexplorer-mobile-blender-design.md`.
2. [ ] Execute plan in this same worktree (baby-step commits).
3. [ ] Push + open PR targeting master once tests + storybook are green.
4. [ ] After merge: separate spec for Phase C (custom-word entry — letting the user type any word, e.g. `putting`, `should`, and synthesise the grapheme breakdown on the fly).

## Context to remember

- This is a Storybook dev tool (`/story/data-wordlibraryexplorer--default`),
  but the `PhonemeBlender` component is intentionally written for reuse
  inside the actual app (gameplay screens). Don't bake explorer-specific
  layout into the component.
- The user is a senior dev — terse responses, no "what changed" summaries
  unless asked.
- Always work on a worktree; never commit to master directly. Markdown
  must pass `yarn fix:md` before commit.
- TDD required for the bug-fix portion (audio stop-on-blur) — write the
  failing visibility/blur tests before the install-guard code.
