# Bush Glider — SortNumbers Themed Re-Skin

## Summary

Re-skin the SortNumbers game as an Australian bush adventure where a sugar glider
(or flying fox) glides between numbered trees. Instead of dragging tiles into slots,
players tap trees in the correct ascending/descending order. The camera pans across
a wide parallax scene, showing 3-4 trees per viewport at a time, following the animal
as it flies between trees.

## Goals

- Make the SortNumbers game visually engaging and playful for young children
- Replace abstract tile-and-slot UI with a narrative scene (animal + trees + bush)
- Add satisfying animations that reward correct answers and make the game feel alive
- Retain all existing SortNumbers game logic (config, rounds, levels, distractors)

## Theme: Australian Night Bush

### Setting

- **Time:** Night — dark sky with stars, moon, and fireflies
- **Environment:** Australian bushland — eucalyptus/gum trees, native grasses,
  distant rolling hills
- **Palette:** Deep greens (#1b4332, #2d6a4f), night sky blues (#0a0a2e, #111144),
  warm accent golds (#fde68a) from moonlight and fireflies

### Character

- **Sugar glider** (primary choice) or **flying fox** — to be decided during
  implementation. Both are native Australian gliding/flying animals
- The character sits on the current tree and glides to the next correct tree when
  the player taps it
- Custom SVG illustration required (no suitable emoji exists)
- Faces direction of travel (flips horizontally)

### Trees

- Scattered across a wide scene at varying heights and horizontal positions
- Each tree has a **number badge on its trunk** (circular, styled by state)
- Tree art: illustrated eucalyptus/gum tree silhouettes (2-3 variants for variety)
- Trees gently sway via CSS animation for a living-world feel

## Interaction Model

### Core Change: Tap-in-Order (replaces drag-and-drop)

The existing SortNumbers game uses drag-and-drop tiles into ordered slots. This
theme replaces that with a **tap-in-order** mechanic:

1. All trees are rendered in the scene with shuffled numbers on their trunks
2. The player taps trees in the correct sorted order (ascending or descending)
3. On correct tap: the sugar glider animates from its current tree to the tapped tree
4. On wrong tap: the number badge shakes and flashes red; the glider stays put
5. When all trees are tapped correctly: celebration overlay

### How This Maps to the Existing Engine

The existing AnswerGame engine supports `inputMethod: 'type'` which uses sequential
tap/click input rather than drag. The Bush Glider theme builds on this pattern:

| AnswerGame Concept      | Bush Glider Equivalent                 |
| ----------------------- | -------------------------------------- |
| Slot (answer position)  | Tree (positioned in scene)             |
| Tile (draggable number) | Number badge on tree trunk             |
| Tile bank               | The scene itself (all trees visible)   |
| Place tile in slot      | Tap tree in correct order              |
| Active slot highlight   | Golden pulsing badge on next target    |
| Wrong tile feedback     | Red shake on wrong tree badge          |
| Round complete confetti | Celebration overlay + glider animation |

## Camera and Parallax System

### Viewport Constraint: 3-4 Trees Visible at a Time

- The full scene is wider than the viewport (approximately 2.5x viewport width for
  7 trees)
- At any point, the viewport shows **3-4 trees** — enough to present a choice
  without overwhelming the player
- Trees beyond the viewport edges are hidden by overflow clipping

### Camera-Follow Behaviour

1. **On game start:** camera centres on the first target tree (lowest/highest number)
2. **After correct tap:** camera pans smoothly to centre the **next target tree**
3. **Pan timing:** camera begins panning as the glider starts its flight, arriving
   together
4. **Arrow hint:** a bouncing arrow appears above the next target after the camera
   settles, helping younger players locate it

### Parallax Layers (back to front)

| Layer          | Content               | Pan Speed | Notes                     |
| -------------- | --------------------- | --------- | ------------------------- |
| Sky            | Stars, moon, gradient | 0.08x     | Near-static, subtle drift |
| Fireflies      | Floating particles    | 0.15x     | Slow ambient movement     |
| Distant hills  | Rolling silhouettes   | 0.3x      | Soft depth cue            |
| Ground + Trees | Grass, trees, glider  | 1.0x      | Moves with camera         |

All layers use CSS `transform: translateX()` with a shared cubic-bezier easing
(`0.4, 0, 0.2, 1`) and ~1.4s duration for smooth, coordinated movement.

### Pan Calculation

```text
targetOffset = -(treePixelPosition - viewportWidth / 2)
clampedOffset = clamp(targetOffset, -(sceneWidth - viewportWidth), 0)

skyTranslateX  = clampedOffset * 0.08
hillsTranslateX = clampedOffset * 0.3
sceneTranslateX = clampedOffset * 1.0
```

## Animations

### Glider Flight

- **Path:** CSS transition on `left` and `bottom` properties (1s duration)
- **Wing flap:** subtle scaleY oscillation during flight
- **Trail particles:** golden dots spawned along the flight arc, fading out over
  0.8s
- **Direction:** glider faces right when moving right, left when moving left
  (CSS scaleX flip)

### Tree Interactions

- **Correct tap — landing:** leaves (🍃🌿🍂) scatter from the tree on impact;
  5-6 particles with random trajectories, 1.2s duration
- **Correct tap — badge:** transitions from gold (next) to green (done) with a
  glow effect
- **Wrong tap:** badge turns red, shakes horizontally (0.5s), returns to previous
  state
- **Idle trees:** gentle sway animation on tree canopy (4s cycle)

### Ambient Scene

- **Stars:** twinkle animation (opacity oscillation, 3s cycle, staggered delays)
- **Fireflies:** float in gentle loops with fade in/out (4-6s cycles)
- **Grass:** subtle sway at ground level (4s cycle, staggered)
- **Moon:** static with soft radial glow

### Celebration (Round Complete)

- Overlay with semi-transparent backdrop + blur
- Sugar glider emoji/illustration centred with party effects
- "Well done!" heading + contextual message
- "Play again" / "Next round" button
- Replaces existing confetti animation (or supplements it)

## HUD (Heads-Up Display)

- Fixed position, top-centre of viewport
- Pill-shaped container with frosted glass effect (backdrop-filter blur)
- Shows:
  - Animal icon + game name ("Bush Glider")
  - Progress counter ("3 / 7")
  - Sort direction indicator ("Sort ascending ↑" or "Sort descending ↓")

## Number Badge States

| State             | Background                         | Border  | Shadow                | Text       |
| ----------------- | ---------------------------------- | ------- | --------------------- | ---------- |
| Waiting           | Grey gradient (#57534e → #78716c)  | #a8a29e | None                  | Light grey |
| Next target       | Gold gradient (#f59e0b → #d97706)  | #fde68a | Gold glow, pulse anim | White      |
| Completed         | Green gradient (#22c55e → #16a34a) | #86efac | Green glow            | White      |
| Wrong (momentary) | Red gradient (#ef4444 → #dc2626)   | #fca5a5 | Red glow, shake anim  | White      |

## Tree Layout Algorithm

Trees need to be scattered naturally (not in a grid) while ensuring:

1. **No overlap** — minimum horizontal distance between trees
2. **Vertical variation** — bottom position varies between ~24-36% to create depth
3. **Even horizontal spread** — trees distributed across the full scene width so
   panning covers the whole scene
4. **Deterministic from seed** — same config + seed produces same layout (for
   visual regression tests and round replay)

### Suggested Approach

```text
For N trees on a scene of width W:
  segmentWidth = W / N
  For each tree i:
    baseX = i * segmentWidth
    offsetX = seededRandom(i) * (segmentWidth * 0.5) — jitter within segment
    x = baseX + offsetX
    y = 24% + seededRandom(i) * 12% — vertical variation
```

This ensures trees spread across the scene while feeling organic. With 7 trees on
a 250vw scene, each segment is ~36vw, showing 3-4 trees per 100vw viewport.

## Integration with Existing Architecture

### What Changes

- **New theme component:** `SortNumbersBushGlider` — wraps the same game state
  but renders the bush scene instead of SlotRow + TileBank
- **New input handler:** tap-in-order (click on a tree = attempt to place the next
  number in sequence)
- **New visual layer:** parallax scene renderer with camera controller

### What Stays the Same

- `SortNumbersConfig` and all config resolution logic
- `build-sort-round.ts` — round generation (tiles, correct order)
- `sort-numbers-level-generator.ts` — level progression
- `AnswerGameProvider` state management and reducer
- `SortNumbersConfigForm` — admin/teacher config UI
- All game logic: round advancement, scoring, level completion

### Component Structure

```text
SortNumbersBushGlider
├── BushGliderScene (viewport + parallax layers)
│   ├── SkyLayer (stars, moon, fireflies)
│   ├── HillsLayer (distant silhouettes)
│   └── GroundLayer (grass, trees, glider)
│       ├── BushTree (per tree: icon + number badge + state)
│       └── GliderCharacter (positioned, animated)
├── BushGliderHUD (progress, direction)
├── BushGliderArrowHint (bouncing indicator)
└── CelebrationOverlay (round/level/game complete)
```

### Theme Selection

The existing `SortNumbers` component should gain a `theme` prop (or config field):

- `theme: 'classic'` — current tile-and-slot UI (default, backwards compatible)
- `theme: 'bush-glider'` — Australian bush parallax scene

This allows both UIs to coexist and be selected per-game configuration.

## Accessibility Considerations

- Number badges must have sufficient contrast in all states (WCAG AA)
- Arrow hint provides a non-colour cue for the next target
- Tap interaction works on touch and mouse (no drag required)
- Reduced-motion: disable parallax panning, glider flight arc, and ambient
  animations; show instant transitions instead
- Screen reader: announce "Tap tree with number X" for each target

## Open Questions

1. **Sugar glider vs flying fox** — which animal to illustrate? Sugar glider is
   cuter and more recognisable for kids; flying fox has more dramatic wingspan for
   glide animations
2. **Distractors** — when `tileBankMode: 'distractors'` is active, extra trees
   with wrong numbers appear in the scene. Should wrong-number trees look visually
   distinct (e.g., dead/bare trees) or identical to correct ones?
3. **Sound effects** — whoosh on glide, leaf rustle on landing, night cricket
   ambient loop? Sound design is out of scope for this spec but worth noting
4. **Day mode variant** — the current design is night-themed. A daytime variant
   (blue sky, sun, kookaburras instead of fireflies) could be a future option

## Prototype

An interactive HTML prototype demonstrating the camera-follow parallax, tap-in-order
mechanic, and glider animation is available at:

`.superpowers/brainstorm/37795-1775993970/content/camera-parallax-v2.html`
