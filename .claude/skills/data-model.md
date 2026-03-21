---
name: data-model
description: "Use when modifying Firestore schema, dual-write pattern, event subcollection, pending event queue, recordEvent/commitEvents ordering, game document fields, teams collection, users collection, security rules, or any Firestore read/write logic"
---

# Data Model Navigator

Scores4Streams uses a dual-write Firestore pattern: aggregate state for real-time overlay + event subcollection for stats/audit. The schema evolved through a major redesign in v2.0.0 (teams collection).

## Key Files

| File | Role |
|------|------|
| `src/hooks/useGameEvents.js` | Dual-write hook: pending queue, recordEvent, commitEvents |
| `src/hooks/useGameState.js` | Reducer managing game state, dispatches to scoringEngine |
| `src/components/ManualScoreController.jsx` | Firestore sync useEffect (setDoc + commitEvents) |
| `src/contexts/AuthContext.jsx` | Firebase Auth + custom claims (tenantId, roles) |
| `firestore.rules` | Security rules: teams, games, users, events |
| `functions/index.js` | Cloud Function: setClaims for custom auth claims |
| `src/hooks/useTeams.js` | Team CRUD operations |
| `src/hooks/useTeamRoster.js` | Player CRUD operations |
| `scripts/purge-test-data.js` | Firebase Admin: delete test data |
| `scripts/seed-dev-data.js` | Firebase Admin: seed sample data |

## As-Built Decisions

- **AB-001 (dual-write):** Every action writes BOTH aggregate state to `games/{id}` AND events to `games/{id}/events`. They serve different consumers (overlay vs stats). Never merge them.
- **AB-002 (pending queue):** `recordEvent()` BEFORE state changes (captures `countBefore`). `commitEvents()` AFTER state settles (stamps `stateAfter`). Reversing this order corrupts event data.
- **AB-017 (teams collection):** `teams/{teamId}` with `players` subcollection. Games get `teamId` field alongside `tenantId` for backward compat. Custom claim key stays `tenantId`.

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `games/{gameId}` | Aggregate state (overlay reads this unauthenticated) |
| `games/{gameId}/events/{eventId}` | Play-by-play event stream |
| `teams/{teamId}` | Team documents (name, shortName, logoUrl) |
| `teams/{teamId}/players/{playerId}` | Persistent players (soft-delete via `active` flag) |
| `users/{uid}` | User profile + memberships map |

## Open Assumptions

- **A-001:** Firebase free tier is sufficient for current game volume. Monitor during multi-game weekends.

## Related Closed Issues

- **#11** Database Structure for User Roles & Teams
- **#42** Firestore rules not included in hosting deploy
- **#46** Housekeeping: fix docs, versions, worktree cleanup
- **#8** Multi-Tenant User Model in Firestore
- **#4** Database structure for user roles & tenants

## Regression Risks

1. **recordEvent/commitEvents ordering** — recordEvent MUST be called BEFORE dispatch. If called after, `countBefore` will reflect the new state, not the old state.
2. **Dual-write divergence** — aggregate state and events must stay in sync. If one write fails, the other still succeeds (no transaction). Monitor for drift.
3. **Backward compat** — old games have `tenantId` but no `teamId`. New games write both. Don't remove `tenantId` yet.
4. **Security rules** — overlay reads `games/{gameId}` unauthenticated. Team writes require membership. Don't lock down game reads.
5. **Event schema** — adding fields to events is safe (backward compat). Removing or renaming fields breaks stats computation.
