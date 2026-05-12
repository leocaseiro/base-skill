# Draggable-tile ghost consistency (TODO)

Surfaced while skinning WordSpell (cave-dragon). The user-visible bug: during
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

1. **Square chrome visible during drag** even when the skin renders the
   resting tile as a non-rectangular shape (e.g. cave-dragon's stone tablet).
   Each ghost defaults to `background: var(--card)` or similar.
2. **Inconsistent visible size** when the parent has `transform: scale(N)`:
   the ghost is sized to `getBoundingClientRect()` (post-transform) but
   inherits no transform itself, so children sized in `font-size` / `em`
   render too big on small screens, too small on big ones.
3. **`transform: scale(1.08)` lift** is hardcoded in two of the three —
   harmless on classic skin but compounds the size mismatch when the
   parent already scales.

## What "fixed" looks like

- **One** ghost-builder helper in `answer-game/` that all three call sites
  use, accepting the source element + drag context.
- Reads `getComputedStyle(source).background` for skinned-tile transparency
  to pass through.
- Computes `visualScale = sourceRect.width / sourceEl.offsetWidth` and
  applies it to the ghost's `font-size` (already done in
  `slot-animations.ts`, missing in the other two).
- Clones the source's `innerHTML` so the skin's tile decoration (e.g. the
  cave-dragon stone SVG) flies along with the letter. Requires the skin's
  decoration CSS to be globally scoped, not nested under `.skin-<id>` —
  see the `.cave-dragon-stone` class in `cave-dragon-skin.tsx` for the
  pattern.
- VR coverage per ghost type so a skin regression is caught before merge.

## Suggested VR shots

Add to `e2e/visual.spec.ts`:

- Mouse drag from slot, ghost mid-flight (lock-auto-eject + cave-dragon)
- Touch drag from bank, ghost over an empty slot (mobile viewport, cave-dragon)
- Eject fly-back ghost halfway between slot and bank-hole (cave-dragon)
- All three above for classic skin too — guards against accidental regression
  when refactoring the helper.

## Out of scope here

- Animating the ghost is its own concern (fly-back uses CSS transition,
  follow uses pointer-position polling). The consistency fix only standardizes
  the **starting visual** of the ghost, not its motion.
- The skin-aware state ring (correct/wrong) on the **slot** itself is already
  resolved via `slotDecoration` — see `cave-dragon-skin.tsx`.
