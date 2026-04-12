# Dino Egg Hatch — SortNumbers Themed Re-Skin

## Summary

Re-skin the SortNumbers game as a dinosaur egg hatching activity. A nest with
grey eggs is displayed and the child drags golden speckled egg tiles onto it in
the correct order. Each correct placement triggers a three-phase hatching
animation: the number appears on the egg, crack lines form, then a baby dinosaur
pops out. Completing the sequence makes all baby dinos perform a happy dance.

## Goals

- Make the SortNumbers game tactile and rewarding for young children
- Use egg hatching as the central mechanic — baby dinos are the reward for
  correct sorting
- Egg-shaped tiles match the nest slots, reinforcing the visual connection
- Retain all existing SortNumbers game logic (config, rounds, levels, distractors)

## Theme: Prehistoric Nest

### Setting

- **Background:** Warm prehistoric gradient (pale yellow sky → yellow-green →
  grass green → dark green)
- **Central element:** A large nest with grey egg slots that hatch when filled
  correctly
- **Bottom area:** Tile bank with shuffled golden speckled egg tiles
- **Ambient:** Swaying palm trees, rocks, distant volcano with lava glow
- **Palette:** Warm earth tones — brown nest (#78350f), golden eggs (#fbbf24),
  grey unfilled (#d6d3d1), green accents

### Dinosaur Varieties

Each egg slot hatches a different baby dino:

| Slot | Dino Emoji | Description |
| ---- | ---------- | ----------- |
| 1    | 🦕         | Sauropod    |
| 2    | 🦖         | T-Rex       |
| 3    | 🐢         | Turtle      |
| 4    | 🦎         | Lizard      |
| 5    | 🐸         | Frog        |
| 6    | 🐲         | Dragon      |

For games with more or fewer numbers, dinos cycle through the list.

## Interaction Model

### Core Mechanic: Drag Egg Tiles to Nest

1. A nest with grey egg slots is displayed in the centre of the scene
2. Golden speckled egg tiles with numbers are shuffled in a tile bank at the
   bottom
3. The child drags an egg tile onto the nest area
4. **Correct number:** three-phase hatching animation plays (see below)
5. **Wrong number:** the target egg slot shakes, tile returns to bank
6. **Drop outside nest:** tile returns to bank (no penalty)
7. When all eggs are hatched: all baby dinos perform a happy dance and
   celebration overlay appears

### Hatching Animation (Three Phases)

Each correct placement triggers a satisfying three-phase animation:

1. **Number appears** (0ms) — the number fades in on the grey egg shell
2. **Crack lines** (300ms) — jagged crack lines appear across the egg shell
3. **Hatch!** (800ms) — the egg shell disappears, baby dino pops out with a
   spring animation, and paw print particles scatter around the slot

### No Answer Hints

Following the same philosophy as the other themes:

- All egg tiles in the bank look identical (same golden speckled style)
- No tile or slot is highlighted as the "next correct" answer
- The HUD shows the **last completed number** so the child knows where they are
- The child must determine the correct order by reading the numbers
- The baby dino is the **reward**, not a hint

### How This Maps to the Existing Engine

| AnswerGame Concept      | Dino Egg Hatch Equivalent            |
| ----------------------- | ------------------------------------ |
| Slot (answer position)  | Egg slot in nest (drop zone)         |
| Tile (draggable number) | Golden speckled egg tile in bank     |
| Tile bank               | Bottom tray with frosted glass bg    |
| Place tile in slot      | Drag egg tile onto nest              |
| Active slot highlight   | Target egg glows gold while dragging |
| Wrong tile feedback     | Egg slot shakes                      |
| Round complete confetti | All dinos happy dance + celebration  |

## Nest Visual Design

### Structure

The nest is a horizontal container centred in the scene with:

- A brown bowl shape at the bottom (radial gradient, rounded)
- Stick/twig texture overlay (repeating linear gradient)
- Egg slots arranged in a row with wrapping for larger counts

### Egg Slot States

| State       | Egg Appearance     | Effect                          |
| ----------- | ------------------ | ------------------------------- |
| Empty       | Grey egg shape     | None                            |
| Drop target | Grey egg shape     | Gold glow (while dragging)      |
| Placed      | Grey + number      | Number fades in                 |
| Cracking    | Grey + crack lines | Jagged line across middle       |
| Hatched     | Shell gone         | Baby dino pops out + paw prints |
| Wrong       | Grey egg shape     | Shake animation                 |

### Baby Dino Appearance

After hatching, the baby dino:

- Pops out from the top of the egg slot with a spring animation
  (cubic-bezier overshoot)
- Has a subtle drop shadow for depth
- Shell fragments appear at the bottom of the slot (small egg emoji at low
  opacity)

## Egg-Shaped Tiles

- **Shape:** Egg shape (border-radius with 60% top, 40% bottom ratio)
- **Size:** 52px wide, 64px tall
- **Style:** Golden gradient (#fef3c7 → #fde68a → #fbbf24) with brown border
  and speckle pattern overlay
- **States:**
  - Available: golden, cursor grab
  - Dragging: slightly scaled up (1.12x), elevated shadow, follows cursor
  - Used: 20% opacity, non-interactive

## HUD (Heads-Up Display)

- Fixed position, top-centre of viewport
- Pill-shaped container with frosted glass effect (brown/translucent)
- Shows:
  - Dino emoji + game name ("Dino Hatch")
  - **Last completed number** — grey "?" at start, turns green after each
    correct placement
  - Progress counter ("3 / 6")

## Animations

### Drag Interaction

- Egg tile follows cursor/finger with slight scale-up
- Next empty egg slot glows gold while any tile is being dragged (not an answer
  hint — it always glows regardless of which tile is held)
- On correct drop: three-phase hatching (number → crack → hatch)
- On wrong drop: egg slot shakes horizontally (0.4s)

### Hatching Sequence

| Phase  | Delay | Duration | What Happens                  |
| ------ | ----- | -------- | ----------------------------- |
| Number | 0ms   | 300ms    | Number fades in on egg shell  |
| Crack  | 300ms | 500ms    | Crack lines appear across egg |
| Hatch  | 800ms | 500ms    | Shell vanishes, dino pops out |
| Prints | 800ms | 1200ms   | Paw print particles scatter   |

### Completion

- All baby dinos perform a happy dance (alternating rotation ±10°, 0.5s loop)
- Celebration overlay appears after 1.5s delay with "All hatched!" message
- "Hatch more" button to replay

### Ambient Scene

- **Palm trees and ferns:** gentle sway animation (5s ease-in-out loop)
- **Volcano:** distant background element with pulsing lava glow (2s cycle)
- **Rocks:** static decorative elements
- **Ground:** soft green gradient at bottom

## Integration with Existing Architecture

### What Changes

- **New theme component:** `SortNumbersDinoEggHatch` — renders prehistoric
  scene with nest egg slots instead of SlotRow
- **Egg-shaped tile component:** custom tile shape (egg) instead of standard
  rectangular/circular tiles
- **Three-phase hatching animation:** placed → cracking → hatched state
  transitions with timed delays

### What Stays the Same

- `SortNumbersConfig` and all config resolution logic
- `build-sort-round.ts` — round generation
- `sort-numbers-level-generator.ts` — level progression
- `AnswerGameProvider` state management and reducer
- `SortNumbersConfigForm` — admin/teacher config UI
- Drag interaction hooks (`useDraggableTile`, etc.)

### Component Structure

```text
SortNumbersDinoEggHatch
├── DinoScene (prehistoric background)
│   ├── Volcano (distant background element)
│   ├── Plants (palm trees, ferns, rocks)
│   └── NestArea (nest container)
│       ├── NestBowl (brown bowl shape + stick texture)
│       └── EggSlot × N (individual egg slots, drop targets)
│           ├── EggShell (grey egg, crack lines)
│           ├── EggNumber (number label)
│           └── BabyDino (hidden until hatched)
├── DinoTileBank (egg-shaped draggable tiles)
├── DinoHUD (progress, last number)
└── CelebrationOverlay (all hatched)
```

### Theme Selection

Extends the `theme` prop on `SortNumbers`:

- `theme: 'classic'` — current tile-and-slot UI (default)
- `theme: 'bush-glider'` — Australian bush parallax scene
- `theme: 'rocket-launch'` — space rocket with porthole drop target
- `theme: 'rainbow-arc'` — rainbow painting with arc-shaped tiles
- `theme: 'dino-egg-hatch'` — prehistoric nest with hatching eggs

## Accessibility Considerations

- Hatching animation provides clear visual state change beyond colour alone
  (shape transform + particle effects)
- Reduced-motion: disable sway, lava glow, happy dance; use instant
  transitions for hatching phases
- Screen reader: announce "Place number X in the nest" and result feedback
- Number labels on placed eggs provide text before hatching occurs

## Open Questions

1. **Egg count flexibility** — the prototype uses 6 eggs. For games with more
   numbers (e.g., 10), should the nest wrap to two rows or scroll?
2. **Sound effects** — crack sound on each hatch, dino chirp on reveal,
   celebration jingle? Out of scope for this spec.
3. **Dino variety** — should baby dinos be randomly assigned or follow a fixed
   sequence? Current design uses a fixed cycle.

## Prototype

An interactive HTML prototype demonstrating the drag-to-nest mechanic,
three-phase hatching animation, and egg-shaped tiles is available at:

`prototypes/dino-egg-hatch-sort-theme.html`
