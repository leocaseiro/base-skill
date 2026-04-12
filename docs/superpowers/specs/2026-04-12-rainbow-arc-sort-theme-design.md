# Rainbow Arc — SortNumbers Themed Re-Skin

## Summary

Re-skin the SortNumbers game as a rainbow painting activity. A grey rainbow arc
is displayed and the child drags arc-shaped number tiles onto it in the correct
order. Each correct placement fills the next band with its rainbow colour, building
the rainbow from the inside out (violet → red). Completing the sequence reveals a
full shimmering rainbow.

## Goals

- Make the SortNumbers game colourful and rewarding for young children
- Use a rainbow arc as the central visual — colour is the reward for correct sorting
- Arc-shaped tiles match the rainbow bands, reinforcing the visual connection
- Retain all existing SortNumbers game logic (config, rounds, levels, distractors)

## Theme: Rainbow Sky

### Setting

- **Background:** Daytime sky gradient (light blue → green grass at bottom)
- **Central element:** A large grey rainbow arc that fills with colour as the
  child sorts correctly
- **Bottom area:** Tile bank with shuffled arc-shaped number tiles (all grey)
- **Ambient:** Drifting clouds, soft and cheerful palette
- **Palette:** Rainbow colours (ROYGBIV) revealed progressively; grey (#d1d5db)
  for unfilled bands and tiles

### Rainbow Colours (outside to inside)

| Band | Colour | Hex     |
| ---- | ------ | ------- |
| 1    | Red    | #ef4444 |
| 2    | Orange | #f97316 |
| 3    | Yellow | #eab308 |
| 4    | Green  | #22c55e |
| 5    | Blue   | #3b82f6 |
| 6    | Indigo | #6366f1 |
| 7    | Violet | #a855f7 |

## Interaction Model

### Core Mechanic: Drag Arc Tiles to Rainbow

1. A large rainbow arc is displayed with all bands in grey
2. Arc-shaped tiles with numbers are shuffled in a tile bank at the bottom
3. Tiles and bands are all grey — **colour is hidden until correctly placed**
4. The child drags an arc tile onto the rainbow area
5. **Correct number:** the next band fills with its rainbow colour + sparkles.
   The number appears on the band in white text.
6. **Wrong number:** the target band shakes, tile returns to bank
7. **Drop outside rainbow:** tile returns to bank (no penalty)
8. When all bands are filled: full rainbow shimmers and celebration overlay appears

### Fill Order: Inside Out

The rainbow builds from the **smallest inner band to the largest outer band**:

- First correct number → violet (innermost, smallest arc)
- Second correct number → indigo
- ... progressively outward ...
- Last correct number → red (outermost, largest arc)

This creates a satisfying visual growth effect — the rainbow expands upward and
outward as the child progresses.

### No Answer Hints

Following the same philosophy as the other themes:

- All tiles in the bank look identical (grey arc shapes)
- No tile or band is highlighted as the "next correct" answer
- The HUD shows the **last completed number** so the child knows where they are
- The child must determine the correct order by reading the numbers
- Colour is the **reward**, not a hint

### How This Maps to the Existing Engine

| AnswerGame Concept      | Rainbow Arc Equivalent             |
| ----------------------- | ---------------------------------- |
| Slot (answer position)  | Rainbow band (drop zone)           |
| Tile (draggable number) | Arc-shaped grey tile in bank       |
| Tile bank               | Bottom tray with frosted glass bg  |
| Place tile in slot      | Drag arc tile onto rainbow         |
| Active slot highlight   | Target band glows while dragging   |
| Wrong tile feedback     | Band shakes                        |
| Round complete confetti | Full rainbow shimmer + celebration |

## Rainbow Visual Design

### Band Structure

The rainbow is built from concentric half-circle CSS borders:

- Outermost band (red): largest arc, highest point
- Innermost band (violet): smallest arc, lowest point
- Each band has a fixed border-width (28px) creating the coloured stripe
- Bands are positioned absolutely, centred at the bottom of the rainbow area
- Gap between bands creates visual separation

### Band States

| State          | Border colour  | Effect                           |
| -------------- | -------------- | -------------------------------- |
| Empty          | Grey #d1d5db   | None                             |
| Drop target    | Grey #d1d5db   | Gold glow (while dragging)       |
| Filled         | Rainbow colour | Colour glow + number label shown |
| Wrong (moment) | Grey #d1d5db   | Shake animation                  |

### Number Labels

After a band is filled, the number that was placed appears in white text centred
on the top of the arc. This gives a visual record of the sorting without needing
a separate completed-numbers display.

## Arc-Shaped Tiles

- **Shape:** Half-circle (border-radius 50% top, flat bottom) — visually matches
  the rainbow band shape
- **Size:** 72px wide, 40px tall
- **Style:** Grey gradient with light border, number centred
- **States:**
  - Available: grey, cursor grab
  - Dragging: slightly scaled up (1.12x), elevated shadow, follows cursor
  - Used: 25% opacity, non-interactive

## HUD (Heads-Up Display)

- Fixed position, top-centre of viewport
- Pill-shaped container with frosted glass effect (white/translucent)
- Shows:
  - Rainbow emoji + game name ("Rainbow")
  - **Last completed number** — grey "?" at start, turns green after each
    correct placement
  - Progress counter ("3 / 7")

## Animations

### Drag Interaction

- Arc tile follows cursor/finger with slight scale-up
- Next empty band glows while any tile is being dragged (not an answer hint —
  it always glows regardless of which tile is held)
- On correct drop: band transitions from grey to its rainbow colour (0.6s ease),
  sparkle particles burst from the band
- On wrong drop: band shakes horizontally (0.4s)

### Completion

- Full rainbow shimmers with brightness oscillation (2s cycle)
- Celebration overlay appears after 0.8s delay
- "Beautiful Rainbow!" message with paint-again button

### Ambient Scene

- **Clouds:** drift across the sky (25-35s linear loop)
- **Ground:** soft green gradient at bottom

## Integration with Existing Architecture

### What Changes

- **New theme component:** `SortNumbersRainbowArc` — renders rainbow scene with
  band drop targets instead of SlotRow
- **Arc-shaped tile component:** custom tile shape (half-circle) instead of
  standard rectangular/circular tiles
- **Inside-out fill mapping:** maps sorted number sequence to bands in reverse
  order (inner first)

### What Stays the Same

- `SortNumbersConfig` and all config resolution logic
- `build-sort-round.ts` — round generation
- `sort-numbers-level-generator.ts` — level progression
- `AnswerGameProvider` state management and reducer
- `SortNumbersConfigForm` — admin/teacher config UI
- Drag interaction hooks (`useDraggableTile`, etc.)

### Component Structure

```text
SortNumbersRainbowArc
├── RainbowScene (sky background + clouds)
│   └── RainbowArc (concentric band container)
│       └── RainbowBand × N (individual arc bands, drop targets)
├── RainbowTileBank (arc-shaped draggable tiles)
├── RainbowHUD (progress, last number)
└── CelebrationOverlay (rainbow complete)
```

### Theme Selection

Extends the `theme` prop on `SortNumbers`:

- `theme: 'classic'` — current tile-and-slot UI (default)
- `theme: 'bush-glider'` — Australian bush parallax scene
- `theme: 'rocket-launch'` — space rocket with porthole drop target
- `theme: 'rainbow-arc'` — rainbow painting with arc-shaped tiles

## Accessibility Considerations

- Grey-to-colour transition provides a clear visual state change beyond colour alone
  (shape fill + sparkle animation)
- Reduced-motion: disable shimmer, cloud drift, sparkles; use instant colour
  transitions
- Screen reader: announce "Place number X on the rainbow" and result feedback
- Number labels on filled bands provide text alongside colour

## Open Questions

1. **Band count flexibility** — the prototype uses 7 bands (ROYGBIV). For games
   with fewer numbers (e.g., 3), should we show fewer bands with a subset of
   colours, or always show 7 and map numbers to bands?
2. **Descending direction** — for descending sort, should the fill order reverse
   (outside-in, red first)? Or keep inside-out and just reverse the number order?
3. **Sound effects** — chime on each colour fill (ascending pitch), celebration
   jingle? Out of scope for this spec.

## Prototype

An interactive HTML prototype demonstrating the drag-to-rainbow mechanic,
inside-out fill, and arc-shaped tiles is available at:

`prototypes/rainbow-arc-sort-theme.html`
