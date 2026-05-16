# Draggable-tile ghost consistency (TODO)

Surfaced while skinning WordSpell (dragon-cave). The user-visible bug: during
drag the floating "ghost" tile renders at a different size and shape than the
source tile, especially when the parent has a `transform: scale(...)` or a skin
that overrides the default rounded-square chrome.

## Where the ghosts come from

There are **three independent ghost implementations** in the answer-game shared
component, each with its own hardcoded styling. None of them currently respect
the skin tokens or the parent's effective transform scale.

| File                                                                                                    | Ghost type                          | Triggered by                           |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------- |
| [`Slot/slot-animations.ts`](../src/components/answer-game/Slot/slot-animations.ts) `triggerEjectReturn` | Eject fly-back (slot → bank)        | `wrongTileBehavior: 'lock-auto-eject'` |
| [`useSlotTileDrag.ts`](../src/components/answer-game/useSlotTileDrag.ts) `setCustomNativeDragPreview`   | HTML5 drag image (mouse, slot tile) | Mouse drag of a placed tile            |
| [`useTouchDrag.ts`](../src/components/answer-game/useTouchDrag.ts) `buildGhost`                         | Touch-pointer follow element        | Touch drag (any tile)                  |

## Symptoms today

**Updated:** all three ghosts now read `getComputedStyle(source).background`
and apply `font-size = sourceFontSize × visualScale` (commits `38c7fbe8d`,
`46cb06194`, and the bank-drag/HUD pass). That removes the white-card flash
and font-size mismatch for the dragon-cave skin and any future skin.

What still needs work:

1. **`transform: scale(1.08)` lift** is hardcoded in two of the three —
   harmless on classic skin but compounds with the source's own scale
   when the parent already transforms. A skin-aware lift would either
   live as a token or be dropped in favour of the existing shadow.
2. **No single helper.** The three call sites duplicate the same pattern
   (snapshot bg, snapshot shadow, compute visual scale, clone innerHTML,
   apply ghost styles). A shared `buildSkinAwareGhost(source)` helper
   would mean future skins or drag pathways only have to be tested once.
3. **No VR coverage** — a regression on the ghost is currently invisible
   to CI. See the "Suggested VR shots" below.

## What "fixed" looks like

- **One** ghost-builder helper in `answer-game/` that all three call sites
  use, accepting the source element + drag context.
- Reads `getComputedStyle(source).background` for skinned-tile transparency
  to pass through. ✅ All three call sites do this now.
- Computes `visualScale = sourceRect.width / sourceEl.offsetWidth` and
  applies it to the ghost's `font-size`. ✅ All three call sites do this now.
- Clones the source's `innerHTML` so the skin's tile decoration (e.g. the
  dragon-cave stone SVG) flies along with the letter. Requires the skin's
  decoration CSS to be globally scoped, not nested under `.skin-<id>` —
  see the `.dragon-cave-stone` class in `dragon-cave-skin.tsx` for the
  pattern. ✅ useTouchDrag now clones innerHTML; the other two already did.
- ⏳ Pull the duplicated logic into a shared helper.
- ⏳ Drop or token-ize the hardcoded `transform: scale(1.08)` lift.
- ⏳ VR coverage per ghost type so a skin regression is caught before merge.

## Suggested VR shots

Add to `e2e/visual.spec.ts`:

- Mouse drag from slot, ghost mid-flight (lock-auto-eject + dragon-cave)
- Touch drag from bank, ghost over an empty slot (mobile viewport, dragon-cave)
- Eject fly-back ghost halfway between slot and bank-hole (dragon-cave)
- All three above for classic skin too — guards against accidental regression
  when refactoring the helper.

## Out of scope here

- Animating the ghost is its own concern (fly-back uses CSS transition,
  follow uses pointer-position polling). The consistency fix only standardizes
  the **starting visual** of the ghost, not its motion.
- The skin-aware state ring (correct/wrong) on the **slot** itself is already
  resolved via `slotDecoration` — see `dragon-cave-skin.tsx`.
