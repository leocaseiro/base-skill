# Tap Forgiveness: Treat Micro-Drags as Taps

**Date:** 2026-05-01
**Issue:** [#298](https://github.com/leocaseiro/base-skill/issues/298)
**Status:** Ready for planning

## Problem

Young users (and some adults unfamiliar with touch devices) accidentally move
their finger slightly when tapping bank tiles. Once movement exceeds the 8px
`DRAG_THRESHOLD_PX`, the system enters drag mode. When the finger lifts — still
over the bank — the drag cancels as a no-op. The tile speaks its letter but
never gets placed, frustrating the user.

PR #287 solved a related but different problem (fast sequential taps arriving
before state updates). This issue remains.

## Solution

Add a **tap forgiveness threshold**: on pointer-up, if the drag is active but
total displacement from start is below a configurable pixel threshold AND the
finger is still over the bank area, treat the gesture as a tap (place the tile
in the next available slot).

## Requirements

### Core behavior

- On touch pointer-up in `useTouchDrag`, calculate Euclidean distance from
  `startPos` to current pointer position.
- If `isDragging === true` AND distance < tap forgiveness threshold AND pointer
  is over the bank area (not over a slot zone): treat as tap.
- "Treat as tap" means: clean up drag state, then invoke the same tap handler
  that `handleClick` uses (`speakTile` + `placeInNextSlot`). Since `onDragStart`
  already called `speakTile`, the fallback should only call `placeInNextSlot`.
- The existing `DRAG_THRESHOLD_PX = 8` (start-drag threshold) remains unchanged.
- Applies to all games that use `useTouchDrag` (global behavior, not
  game-specific).

### Configurable threshold

- Add an optional `tapForgivenessThreshold` field to `SettingsDoc` (per-profile
  settings schema).
- Default value: **20px** (hardcoded fallback when no setting is saved).
- Expose in the settings UI as a slider or numeric input so testers/parents can
  tune it per child.
- `useTouchDrag` reads the threshold from settings context at pointer-up time.

### Non-goals

- Time-based detection (rejected during brainstorm — distance alone is
  sufficient).
- Recording/analytics of drag movements (mentioned in issue as alternative,
  deferred).
- Changes to desktop HTML5 DnD behavior (touch-only, gated by
  `pointerType !== 'mouse'`).
- Changes to the fast-tap queue from PR #287.

## Key decisions

| Decision           | Choice                            | Rationale                                                                   |
| ------------------ | --------------------------------- | --------------------------------------------------------------------------- |
| Detection method   | Distance from start on pointer-up | Simpler than time; directly measures "how far did the finger actually move" |
| Threshold location | Per-profile `SettingsDoc`         | Persists per child, testable without code changes                           |
| Default value      | 20px                              | ~2.5x the drag-start threshold; forgiving without catching real drags       |
| Scope              | All games via `useTouchDrag`      | The hook is shared; the problem isn't game-specific                         |

## Affected files

- `src/components/answer-game/useTouchDrag.ts` — tap forgiveness check in
  `onPointerUp`
- `src/components/answer-game/useDraggableTile.ts` — pass `onTapFallback`
  callback
- `src/db/schemas/settings.ts` — add `tapForgivenessThreshold` field
- `src/routes/$locale/_app/settings.tsx` — add slider/input for the threshold
- `src/db/hooks/useSettings.ts` — expose the new field

## Success criteria

- A user who moves their finger ≤20px during a tap has the tile placed in the
  next slot (same as a clean tap).
- A user who intentionally drags >20px and returns to the bank still cancels
  (no accidental placement).
- The threshold is adjustable per profile from the settings page.
- Existing tap and drag flows are unaffected (regression tests pass).
