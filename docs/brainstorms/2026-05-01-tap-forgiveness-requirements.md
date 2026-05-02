# Tap Forgiveness: Treat Micro-Drags as Taps

**Date:** 2026-05-01
**Issue:** [#298](https://github.com/leocaseiro/base-skill/issues/298)
**Status:** Implemented (with revision — see Findings below)

## Findings from device testing (2026-05-02)

Distance-only forgiveness (the original spec below) failed in the field with
**zero behavioural change** even at 40px threshold. Captures from a debug
harness on real Chrome Android and Brave iOS devices revealed why:

- A typical thumb tap registers **75–100px** of contact movement in
  **50–65ms** due to **thumb-release drift** — the contact point pivots
  toward the base of the thumb as pressure releases. Distance alone cannot
  separate this from a deliberate drag without unacceptable false positives.
- `pointercancel` never fires for these gestures (contradicting an early
  hypothesis about iOS Safari). `lostpointercapture` fires correctly **after**
  `pointerup`. The existing onPointerUp check IS reached — the displacement
  check just always fails by a wide margin.
- Duration is a much cleaner discriminator. Every captured failing tap
  completed in <80ms; the shortest deliberate drag took 287ms — clean gap.

Revised rule: treat as tap if **either** displacement is below
`tapForgivenessThreshold` (default 17px) **OR** duration is below
`tapForgivenessTimeMs` (default 150ms — below human reaction time, so any
gesture this short is ballistic motion, not deliberate drag).

Both thresholds are configurable per-profile; setting either to 0 disables
that signal. Captured device logs are preserved in
`debug/logs/` (gitignored) for future regression checks.

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
