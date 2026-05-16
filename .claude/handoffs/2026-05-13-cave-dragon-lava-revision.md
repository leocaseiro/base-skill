# Handoff: cave-dragon skin — lava revision + PR #358 follow-ups

**Date:** 2026-05-13
**Branch:** `feat/word-spell-cave-dragon-skin`
**Worktree:** `worktrees/feat-word-spell-cave-dragon-skin`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat-word-spell-cave-dragon-skin`
**Git status:** clean working tree (1 untracked `cliff-left copy.png` is user's local; leave alone)
**Last commit:** `9515088a1 feat(cave-dragon): animated lava — y-gradient, bobbing wave, rising bubbles`
**PR:** [#358 — feat(word-spell): Cave & Dragon skin](https://github.com/leocaseiro/base-skill/pull/358) — OPEN
**Related issue:** [#359 — refactor: simplify draggable-tile styling + consolidate drag-ghost implementations](https://github.com/leocaseiro/base-skill/issues/359)
**Related PR (blocking):** [#357 — PR 1b WordSpell + SortNumbers XState migration](https://github.com/leocaseiro/base-skill/pull/357) — rewrites `WordSpell.tsx` and the game route

## Resume command

```bash
/resync
cd worktrees/feat-word-spell-cave-dragon-skin
# Then open in editor + storybook
yarn storybook
```

Storybook URL once running: `http://localhost:6006` → `Games / WordSpell / Skin Harness → Default` → skin "Cave & Dragon" (selection persists in localStorage).

## Current state

**Task:** Cave & Dragon skin polish on the open PR. The skin is feature-complete and the PR is open; this handoff exists because the user wants to revise the lava in a fresh session before merge.

**Phase:** review / polish

**Progress:** 19 commits ahead of master, 281 tests pass, all hooks green, PR-preview deploy at <https://leocaseiro.github.io/base-skill/pr/358/docs/> works.

## What we did across the PR

Built the cave-dragon skin end-to-end on top of the existing `GameSkin` extension surface, with **zero HTML changes to `WordSpell.tsx`** beyond a one-line `skin={skin}` prop pass to `LetterTileBank`. Closed two real architecture gaps along the way:

1. `LetterTileBank` didn't consume `skin.tileDecoration` (only `SortNumbersTileBank` did) — added the same hook so the cave-dragon stone SVG can replace the default rounded-rect tile.
2. `Slot.tsx` didn't render `tileDecoration` for the placed-tile button — added it so a placed tile keeps the stone look inside a filled slot.

Discovered and partially patched a cross-cutting drag-ghost issue (three independent ghost implementations all with hardcoded white card + scale lift + raw font-size); user-visible bugs fixed in this PR, larger refactor captured as **issue #359**.

Stage geometry — `aspect-ratio: 2738/1536`, `max-width: min(2738px, calc(100dvh × 2738/1536))`, `min-width: 667px`, `container-type: inline-size`, plus `transform: scale(calc(100cqi / 962px))` on every direct child except the scene so the inner UI auto-scales with the stage from iPhone SE landscape up to ultrawide.

## ⚠️ Open user request — revise the lava

The user **preferred the pre-revision lava** (commit `9515088a1` replaced it with a single-gradient SVG + bobbing wave + simple bubbles, which they don't want kept). They asked for two specific changes against the **previous lava implementation** (pre-`9515088a1`):

### 1. Add a y-axis gradient to the previous lava waves

The previous lava was a tileable `lava-floor-tile.svg` ([public/skins/word-spell/cave-dragon/lava-floor-tile.svg](public/skins/word-spell/cave-dragon/lava-floor-tile.svg) — still in the repo) with **five wave layers** (yellow top, orange, red-orange, red, deep-red base) repeated via `background: url(...) repeat-x`. The user liked that layered look. They want it back but **with a y-axis gradient overlay** so the lava reads as one continuous gradient from yellow at the top to deep red at the bottom.

The SVG already has per-layer linear gradients (`lavaTop` / `lavaUpper` / `lavaMid` / `lavaLower` / `lavaBase`) — each layer fades top-to-bottom — but stacked they don't form a single smooth gradient. **Options to explore:**

- Edit the SVG so each layer's start/end gradient stops slot into a single coherent y-progression (e.g. layer-top = previous-layer-bottom).
- Or: keep the existing layers but lower their opacity and add a single full-height gradient `<rect>` behind them.

Either way, the multi-wave silhouette stays — the user explicitly wants those waves back.

### 2. Fix the bubbles

The animated bubbles in commit `9515088a1` had two problems:

1. **Too oval.** They render as `<circle>` inside an SVG with `preserveAspectRatio="none"`, so the non-square viewBox aspect (1200×300) stretches them horizontally. Fix: use a square viewBox (e.g. drop `preserveAspectRatio="none"`) **or** size the bubbles via `<ellipse>` with rx/ry computed to compensate for the stretch ratio, **or** stop stretching and let `meet` aspect leave letterbox bars.
2. **Float higher before pop.** Bubbles currently translate from `cy=250` to `cy=70` (−180 units) and fade to 0 across the rise. The user wants them to **rise further** before popping. Reference: the user's mockup HTML pasted in chat — `gsap.to(circle, { y: -150, opacity: 0, ... })` with bubbles starting at `cy=600..700` and ending at `cy=450..550` (rising ~150–200 px in a 700px-tall stage = ~25%). My current rise is similar in viewBox units but the **opacity fades too early in the animation** — the user wants them to **stay visible longer, then pop quickly near the top**. Tune the keyframe stops: keep `opacity: 0.75` until later in the animation (e.g. 80%), then drop to 0 sharply near 100%.

### Reference mockup (user pasted in chat)

The user's GSAP-based mockup is the source of truth for the look:

```html
<linearGradient id="lavaGrad" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0%" stop-color="#FF4500" />
  <stop offset="40%" stop-color="#FF8C00" />
  <stop offset="100%" stop-color="#8B0000" />
</linearGradient>
```

```js
gsap.to('#lava-surface', {
  attr: { d: 'M0,550 Q150,570 300,550 T600,550 ... ' },
  duration: 2,
  yoyo: true,
  ease: 'sine.inOut',
});

// 20 bubbles, random cx/r/duration/delay
// Animates y: -150, opacity: 0
```

Don't add GSAP as a dependency — CSS animations cover the same effect (already proven in `9515088a1`).

## Decisions made (carry forward)

- **No HTML changes to `WordSpell.tsx`** except the `<LetterTileBank skin={skin}>` prop pass. The skin works entirely through `GameSkin.tokens`, `SceneBackground`, `tileDecoration`, and `slotDecoration`.
- **`max-width: 2738px`** (asset-native — sum of bg-left + bg-right widths). Game UI scales up to ~2.85× on ultrawide; OK per user.
- **`min-width: 667px`** (iPhone SE landscape). Below this, the parent app shell should force landscape (out of skin scope).
- **`scale` anchor = 962** (width at which the natural game UI height = stage height at our aspect). At ≥962px viewport game UI is at scale 1+; below it scales down to ~0.69 at the floor.
- **`mode: 'recall'`** in the storybook harness baseConfig (no picture card). User said picture mode is the worst layout.
- **`ttsEnabled: true`** in the harness so the audio button is visible — needed to skin it (gold `#f7d168` + black icon + drop-shadow lift).
- **`SkinHarness` persists selected skin in localStorage** per-gameId (`skin-harness:selected-skin:<gameId>`).
- **All asset paths use `import.meta.env.BASE_URL`**, never hardcoded `/`. Documented in [CLAUDE.md](../../CLAUDE.md#static-assets-in-public) + [AGENTS.md](../../AGENTS.md#static-assets-in-public). Memory saved under `feedback_vite_base_url_for_public_assets.md`.
- **Drag-ghost user-visible fixes shipped in this PR**; helper consolidation + VR coverage deferred to issue [#359](https://github.com/leocaseiro/base-skill/issues/359).
- **PR #357 (XState) blocks "wire skin into actual game route"** — it rewrites `WordSpell.tsx` (175+/133−) and the game route. Wait for #357 to land, rebase, then wire.

## Key files

- [src/games/word-spell/skins/cave-dragon-skin.tsx](src/games/word-spell/skins/cave-dragon-skin.tsx) — the entire skin (CSS template string + `SceneBackground` JSX + `tileDecoration` + `slotDecoration` + tokens). This is where the lava revision lands.
- [src/games/word-spell/LetterTileBank/LetterTileBank.tsx](src/games/word-spell/LetterTileBank/LetterTileBank.tsx) — added `skin?: GameSkin` prop, renders `{skin?.tileDecoration?.(tile)}` inside the button.
- [src/games/word-spell/WordSpell/WordSpell.tsx](src/games/word-spell/WordSpell/WordSpell.tsx) — one-line change at the `<LetterTileBank skin={skin} />` site.
- [src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx](src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx) — harness baseConfig (`mode: 'recall'`, `ttsEnabled: true`, `wrongTileBehavior: 'lock-auto-eject'` — user set this manually).
- [src/components/answer-game/Slot/Slot.tsx](src/components/answer-game/Slot/Slot.tsx) — renders `skin?.tileDecoration?.({...})` inside the placed-tile button.
- [src/components/answer-game/Slot/slot-animations.ts](src/components/answer-game/Slot/slot-animations.ts) — eject-ghost reads `getComputedStyle(source).background` + scales font-size; uses `Object.assign` (not cssText) to survive empty-string returns from jsdom.
- [src/components/answer-game/useTouchDrag.ts](src/components/answer-game/useTouchDrag.ts) + [useSlotTileDrag.ts](src/components/answer-game/useSlotTileDrag.ts) — same pattern; `scale(1.08)` lift removed.
- [src/lib/skin/SkinHarness.tsx](src/lib/skin/SkinHarness.tsx) — localStorage persistence + Fullscreen button.
- [public/skins/word-spell/cave-dragon/](public/skins/word-spell/cave-dragon/) — assets. Note `lava-floor-tile.svg` is **still in the repo even though `9515088a1` stopped using it** — the lava revision should bring it back.
- [docs/draggable-tile-ghost-consistency.md](docs/draggable-tile-ghost-consistency.md) — drag-ghost TODO doc; mirrors issue #359.
- [CLAUDE.md → Static assets in `public/`](../../CLAUDE.md#static-assets-in-public) — BASE_URL convention.

## Open questions / blockers

- [ ] **Lava revision direction** — keep the old multi-layer wave silhouette but add a unified y-gradient (option A: stitch existing per-layer gradients into one progression; option B: full-height gradient `<rect>` behind low-opacity layers). Pick one with the user.
- [ ] **Bubble shape fix** — square viewBox, or compensated `<ellipse>` with stretch correction? Square viewBox is cheaper but changes the wave aspect; ellipse compensation keeps the lava aspect intact.
- [ ] **PR #357 timing** — wait for it to merge before wiring the skin into the actual game route (item 2 in the original queue).

## Next steps

1. [ ] **Revert the lava commit `9515088a1`** locally (don't push the revert — just amend the lava work) and rebuild on top of the previous lava-tile-as-background approach.
2. [ ] **Add a y-axis gradient** to the multi-layer lava SVG ([public/skins/word-spell/cave-dragon/lava-floor-tile.svg](public/skins/word-spell/cave-dragon/lava-floor-tile.svg)) or layer it via an overlay rect. Confirm direction with the user (option A vs B above) before coding.
3. [ ] **Re-add the bubble animation** but:
   - Use a square viewBox (or `<ellipse>` with compensation) so the bubbles stay round.
   - Tune `cd-lava-bubble-rise` keyframes so opacity stays high (≥0.6) until ~85% of the animation, then drops to 0 sharply near 100%. Visually they should float higher before popping.
   - Keep the staggered per-bubble `animation-delay` / `animation-duration` so they don't sync.
4. [ ] Commit + push (PR #358 auto-updates). 281 tests should still pass.
5. [ ] Once user approves the revised lava, mark PR #358 ready for review/merge.
6. [ ] **After PR #358 lands**: wait for PR #357 to merge, rebase, then implement "wire skin into actual game route" (was the original item 2). Will need a follow-up PR.
7. [ ] **Tile sizing math** for variable word lengths + cliff-shift to make room — raise a separate GH issue + PR (was the original item 3).

## Context to remember

- **User's preferences** ([CLAUDE.md](../../CLAUDE.md) + memory): commit freely with baby steps, push freely for features, named exports only (no `export default` except framework config), full worktree paths in all output, prose Q&A over `AskUserQuestion` menus for walkthroughs, en-AU is the default locale, never proactively run sync — recommend `/resync` instead.
- **No GSAP** — animations stay CSS-only. The project doesn't have GSAP and shouldn't add it for this skin.
- **`prefers-reduced-motion: reduce`** must continue to disable the lava animations in the revised version.
- **`.cave-dragon-stone` CSS is intentionally unscoped** (not nested under `.skin-cave-dragon`) so it applies inside the drag/eject ghosts that are appended to `document.body`. Don't re-scope it.
- **The skin's `SceneBackground` component renders both the scene's static `<style>` block AND a hidden symbol library** (`<svg width="0" height="0">` with `cd-stoneTile`, `cd-stRim`, etc.). Symbol IDs are `cd-`-prefixed to avoid clashing with other skins.
- **Storybook harness has a Fullscreen button** — useful for previewing without harness chrome at mobile-landscape viewports, where the toolbar otherwise eats vertical space.
- **`wrongTileBehavior: 'lock-auto-eject'`** in the harness baseConfig was set manually by the user during the session — keep it; don't revert.
- **There's an untracked `cliff-left copy.png`** in `public/skins/word-spell/cave-dragon/` and a modified `cliff-left.png` — both are user-local. Don't `git add` them.
