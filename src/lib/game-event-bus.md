# Game event bus (Milestone 2)

Internal-only typed pub/sub for game lifecycle and session recording. Matches `docs/game-engine.md` §3.

- **Import:** `getGameEventBus()` from `@/lib/game-event-bus` (or construct `createGameEventBus()` for tests).
- **Future:** May become a stable public package export; until then treat as app-internal.
