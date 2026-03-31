# ADR 0001: RxDB local data without TanStack Query (defer to M6)

## Status

Accepted

## Context

BaseSkill persists learner data offline-first in RxDB. The stack already includes TanStack Router and related packages; `@tanstack/react-query` is a natural fit for server-backed APIs. Milestone 2 introduces only local IndexedDB-backed storage and reactive reads via RxDB observables.

## Decision

Defer adopting `@tanstack/react-query` until **Milestone 6** when cloud sync and network-backed APIs land. Until then, the app reads and writes through RxDB only, using small React hooks that subscribe to RxDB queries (no parallel client cache).

## Consequences

- **Positive:** Single source of truth (RxDB); no duplicate cache invalidation between Query and RxDB; simpler M2 scope.
- **Positive:** Hooks pattern (`useRxQuery`, collection-specific hooks later) stays stable when Query is added for remote data only.
- **Negative:** When M6 adds Query, remote reads must be wired explicitly; local data remains on RxDB hooks.

## References

- `docs/data-model.md`
- `docs/architecture.md`
