# Rocket Launch — SortNumbers Themed Re-Skin

## Summary

Re-skin the SortNumbers game as a rocket launch countdown (or fuel-up). The child
drags circular number tiles into the rocket's porthole window in the correct order.
Completing the sequence triggers a launch animation. Uses the existing drag-and-drop
mechanic from the AnswerGame engine, with a single drop target (the porthole) instead
of multiple slots.

## Goals

- Make the SortNumbers game visually exciting for young children with a space theme
- Use drag-and-drop interaction — child drags number tiles to the rocket window
- Support both ascending ("Fuel up!") and descending ("Countdown!") directions
- Retain all existing SortNumbers game logic (config, rounds, levels, distractors)

## Theme: Space Launch

### Setting

- **Background:** Deep space gradient (#0a0a2e → #111144 → #1a1a5e) with
  twinkling stars
- **Central element:** A rocket on a launch pad, vertically centred
- **Bottom area:** Tile bank with shuffled circular number tiles
- **Palette:** Indigo/violet tiles (#6366f1, #8b5cf6), silver rocket body,
  red fins, golden accents

### Direction Framing

| Direction  | Label       | Narrative                                     |
| ---------- | ----------- | --------------------------------------------- |
| Descending | Countdown ↓ | "10, 9, 8... Liftoff!" Classic rocket launch  |
| Ascending  | Fuel up ↑   | "1, 2, 3... Power up!" Filling the fuel gauge |

Both directions end with the same launch animation on completion.

## Interaction Model

### Core Mechanic: Drag to Porthole

The existing SortNumbers drag-and-drop mechanic is preserved but simplified to a
**single drop target** — the rocket's porthole window:

1. Shuffled circular number tiles are displayed in a tile bank at the bottom
2. The child picks up a tile and drags it to the rocket's porthole
3. **Correct number:** porthole flashes green, number briefly appears inside,
   tile is consumed. A small green badge appears on the rocket body showing the
   completed number.
4. **Wrong number:** porthole flashes red and shakes, tile returns to the bank
5. **Drop outside porthole:** tile returns to the bank (no penalty)
6. When all numbers are placed: exhaust flames ignite, rocket launches upward

### No Answer Hints

Following the same philosophy as the Bush Glider theme:

- All tiles in the bank look identical (same indigo/violet style)
- No tile is highlighted as the "next correct" answer
- The HUD shows the **last completed number** (green badge) so the child knows
  where they are, but not what comes next
- The child must determine the correct order by reading the numbers

### How This Maps to the Existing Engine

| AnswerGame Concept      | Rocket Launch Equivalent               |
| ----------------------- | -------------------------------------- |
| Slot (answer position)  | Porthole window (single drop target)   |
| Tile (draggable number) | Circular number tile in bank           |
| Tile bank               | Bottom tile tray with frosted glass bg |
| Place tile in slot      | Drag tile into porthole                |
| Active slot highlight   | Porthole glows gold while dragging     |
| Wrong tile feedback     | Red flash + shake on porthole          |
| Round complete confetti | Rocket launch animation                |

## Rocket Visual Design

### Structure (top to bottom)

```text
        /\
       /  \          ← Nose cone (CSS triangles, silver/grey)
      /    \
     |      |
     | (  ) |        ← Porthole window (circular, dark blue)
     | [badges] |    ← Completed number badges (small green circles)
     |      |
     |______|        ← Body (silver gradient)
    /|      |\
   / |______| \      ← Fins (red) + base
     | flame |       ← Exhaust (hidden until launch)
```

### Porthole States

| State      | Border  | Background          | Effect            |
| ---------- | ------- | ------------------- | ----------------- |
| Idle       | #64748b | Dark space gradient | None              |
| Drop ready | #fde68a | Dark space gradient | Gold glow         |
| Correct    | #86efac | Dark green gradient | Green glow, flash |
| Wrong      | #fca5a5 | Dark space gradient | Red glow, shake   |

"Drop ready" activates when the child starts dragging any tile — the porthole
glows gold to indicate it is the drop target. This is not an answer hint (it
always glows, regardless of which tile is held).

### Completed Number Badges

After each correct drop, a small green circle badge (24px) with the number
appears on the rocket body above the porthole. These accumulate as the child
progresses, giving a visual record of their work.

## Number Tiles

- **Shape:** Circular (50% border-radius) — matches the porthole window
- **Size:** 56px diameter
- **Style:** Indigo/violet gradient with light border and shadow
- **States:**
  - Available: full opacity, cursor grab
  - Dragging: slightly scaled up (1.1x), elevated shadow, follows cursor
  - Used: 30% opacity, non-interactive

## HUD (Heads-Up Display)

- Fixed position, top-centre of viewport
- Pill-shaped container with frosted glass effect
- Shows:
  - Rocket icon + game name ("Rocket Launch")
  - **Last completed number** — grey "?" badge at start, turns green after each
    correct drop. Shows where the child is without revealing the next answer.
  - Progress counter ("3 / 5")
  - Direction toggle — clickable label ("Countdown ↓" / "Fuel up ↑")

## Animations

### Drag Interaction

- Tile follows cursor/finger with slight scale-up
- Porthole glows gold while any tile is being dragged
- On correct drop: porthole border transitions to green, number appears inside
  briefly (0.6s), then resets
- On wrong drop: porthole shakes horizontally (0.4s), red flash

### Launch Sequence (Round Complete)

1. **Delay** (0.7s) — brief pause after final tile
2. **Ignition** — exhaust flames fade in (orange/yellow gradient, flicker animation)
3. **Liftoff** (0.8s later) — rocket translates upward off-screen with
   cubic-bezier easing (slow start, fast exit)
4. **Celebration** (1.2s after liftoff) — overlay appears with "Liftoff!" message
   and play-again button

### Ambient Scene

- **Stars:** twinkling opacity animation (3s cycle, staggered)
- **Exhaust flames:** scaleX/Y flicker when active (0.15-0.2s alternating)

## Integration with Existing Architecture

### What Changes

- **New theme component:** `SortNumbersRocketLaunch` — renders rocket scene with
  single-porthole drop target instead of SlotRow
- **Simplified drop logic:** only one drop zone (the porthole) instead of
  multiple slots
- **New visual layer:** rocket illustration, launch pad, star field

### What Stays the Same

- `SortNumbersConfig` and all config resolution logic
- `build-sort-round.ts` — round generation
- `sort-numbers-level-generator.ts` — level progression
- `AnswerGameProvider` state management and reducer
- `SortNumbersConfigForm` — admin/teacher config UI
- Drag interaction hooks (`useDraggableTile`, etc.)

### Component Structure

```text
SortNumbersRocketLaunch
├── RocketScene (star field background)
│   ├── Rocket (nose, body, fins, exhaust)
│   │   ├── Porthole (single drop target)
│   │   └── CompletedBadges (green number circles)
│   └── LaunchPad (ground element)
├── RocketTileBank (circular draggable tiles)
├── RocketHUD (progress, last number, direction)
└── CelebrationOverlay (launch complete)
```

### Theme Selection

Extends the same `theme` prop on `SortNumbers`:

- `theme: 'classic'` — current tile-and-slot UI (default)
- `theme: 'bush-glider'` — Australian bush parallax scene
- `theme: 'rocket-launch'` — space rocket with porthole drop target

## Accessibility Considerations

- Porthole glow provides a clear drop target indicator during drag
- Correct/wrong feedback uses colour + animation (not colour alone)
- Reduced-motion: disable launch animation, star twinkle, flame flicker;
  show instant transitions
- Screen reader: announce "Drop number X into the rocket" and result feedback

## Open Questions

1. **Multiple portholes for harder levels?** — could show 2-3 portholes for
   longer sequences, but the single-porthole-sequential approach is simpler
   and more thematic
2. **Sound effects** — rocket rumble on ignition, whoosh on liftoff, beep on
   correct/wrong drop? Out of scope for this spec.
3. **Level progression visual** — could show the rocket at different altitudes
   across levels (launch pad → orbit → moon → mars)

## Prototype

An interactive HTML prototype demonstrating the drag-to-porthole mechanic,
launch animation, and direction toggle is available at:

`prototypes/rocket-launch-sort-theme.html`
