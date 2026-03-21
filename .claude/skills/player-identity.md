---
name: player-identity
description: "Use when modifying player records, cross-team player identity, player linking/merging, league/association/season hierarchy, organizational structure, player PII/privacy, player search, or planning the evolution from per-team players to a shared player database"
---

# Player Identity & Org Hierarchy Navigator

The system is evolving from game-level player UUIDs (AB-012) through team-level persistent players (AB-017) toward a single player identity across teams, leagues, associations, and national/state squads.

## Current State

```
teams/{teamId}/players/{playerId}   ← player exists only within one team
games/{gameId}.homeRoster[]         ← per-game copies with game-scoped UUIDs
```

- Game rosters have per-game UUIDs (`id`) + optional `playerId` linking to persistent team player
- No cross-team identity — same person on two teams = two separate records
- No organizational hierarchy above teams
- No PII beyond name + jersey number (intentional — AB-012)

## Target Architecture (Planned)

```
players/{playerId}                  ← single identity, minimal PII
  ├── memberships: [teamA, stateTeam, nationalSquad]
  └── stats aggregated across all

associations/{id}                   ← e.g., "Softball Australia"
  └── leagues/{id}                  ← e.g., "NSW Metro League"
      └── seasons/{id}             ← e.g., "2026 Winter"
          └── fixtures/standings/teams
```

## Key Files (Current)

| File | Role |
|------|------|
| `src/hooks/useTeamRoster.js` | Team-level player CRUD |
| `src/hooks/useTeams.js` | Team CRUD |
| `src/utils/rosterHelpers.js` | Lineup helpers, runner identity |
| `src/components/TeamRosterManager.jsx` | Team roster UI |
| `src/components/LineupEditor.jsx` | Game lineup entry with team import |
| `firestore.rules` | Current team/player security rules |

## As-Built Decisions

- **AB-012 (game-level rosters):** No PII. UUID per player per game. DP/FLEX/DR from day 1.
- **AB-013 (runner identity):** Parallel map, never change runners from booleans.
- **AB-017 (teams collection):** `teams/{teamId}/players/{playerId}` with soft-delete. Game rosters get `playerId` link. Custom claim key stays `tenantId`.

## Open Assumptions

- **A-001:** Firebase free tier — cross-team queries will increase read volume.

## Related Open Issues

- **#36** Opposition roster system (stepping stone — persistent opponent teams)

## Migration Considerations

1. **Backward compat** — existing `teams/{teamId}/players/{playerId}` must keep working during migration
2. **Player merging** — when introducing shared identity, need to merge duplicate player records across teams
3. **Game roster links** — `playerId` on game rosters currently points to team-level player. Will need to point to shared player ID eventually.
4. **PII escalation** — shared player database will hold PII (email, DOB, medical). Requires proper access control model, consent, data retention.
5. **Security rules** — cross-team player reads need careful scoping. A scorer shouldn't see all player data, only what's relevant to their team/game.
6. **Stats aggregation** — cross-team stats depend on single identity being correct. Bad merges = wrong career stats.

## Regression Risks

1. **Don't add PII to game-level rosters** — game rosters are embedded in game docs which are publicly readable (overlay). PII belongs in the shared player database with access controls.
2. **Don't break existing team-level players** — migration must be additive, not destructive.
3. **Runner identity depends on game-level UUIDs** — the `id` field on game roster entries drives `runnerIdentity`. Changing this breaks in-game tracking.
