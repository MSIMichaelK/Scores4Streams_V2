---
name: roster-lineup
description: "Use when modifying game rosters, lineup entry, batting order, batter/pitcher tracking, runner identity, DP/FLEX/DR positions, persistent team players, team roster manager, lineup import, lineup validation, or player substitutions"
---

# Roster & Lineup Navigator

Rosters exist at two levels: persistent team players (`teams/{teamId}/players`) and per-game lineups (embedded in game state). Runner identity is tracked via a parallel map alongside the boolean runners.

## Key Files

| File | Role |
|------|------|
| `src/utils/rosterHelpers.js` | Pure helpers: `getBattingLineup`, `getCurrentBatter/Pitcher`, `updateRunnerIdentity`, `validateLineup` |
| `src/components/LineupEditor.jsx` | Mobile-first lineup entry (9/10 slots, DP/FLEX/DR, team import) |
| `src/components/TeamRosterManager.jsx` | Persistent team roster CRUD (add/edit/deactivate) |
| `src/hooks/useTeams.js` | Team CRUD: createTeam, getTeam, listUserTeams |
| `src/hooks/useTeamRoster.js` | Player CRUD: addPlayer, getActivePlayers, updatePlayer, deactivatePlayer |
| `src/hooks/useGameState.js` | `__SET_LINEUP__`, `__SET_BATTER_INDEX__` reducer actions, runner identity auto-update |
| `src/hooks/useGameEvents.js` | `recordEvent` accepts `batterId`/`pitcherId` params |
| `src/__tests__/roster.test.js` | 39 tests: lineup helpers, batter auto-advance, runner identity, validation |

## As-Built Decisions

- **AB-012 (game-level rosters):** Per-game rosters with minimal data (`id, name, number, battingOrder, position`). No PII. UUID per player per game. DP/FLEX/DR positions supported from day 1.
- **AB-013 (runner identity):** Parallel `runnerIdentity` map alongside boolean `runners`. Engine uses booleans for logic; identity map maintained by diffing before/after each action. Never change `runners` from booleans to objects.
- **AB-017 (persistent players):** `teams/{teamId}/players/{playerId}` with soft-delete via `active` flag. Game roster entries get a `playerId` field linking to persistent player. Lineup import is additive.

## Runner Identity Heuristic

`updateRunnerIdentity()` in rosterHelpers.js:
1. Works from 3rd base backward to 1st
2. For each newly occupied base, checks previous bases (3rd checks both 2nd and 1st for doubles)
3. If no previous runner found, assigns current batter's ID
4. On `changeSides`, all identities clear to null

## Open Assumptions

- None directly, but opposition roster system is an open issue (#36).

## Related Closed Issues

- **#11** Database Structure for User Roles & Teams
- **#36** (OPEN) Opposition roster system: persistent opponent teams
- **#46** Housekeeping: fix docs, versions

## Regression Risks

1. **Never change runners to objects** — the engine has dozens of `if (state.runners.first)` boolean checks. The parallel map pattern is intentional (AB-013).
2. **Batter auto-advance** — batting order advances after plate appearances. If you change PA detection, batter index may drift.
3. **Lineup validation** — duplicate positions are blocked (except EH/DH). First/last name split must maintain backward compat with old single `name` field.
4. **Import vs manual entry** — lineup import replaces current lineup; manual entry remains as fallback. Don't break either path.
5. **PII boundary** — game-level rosters have no PII (name + number only). Don't add email/phone/DOB here — that belongs in persistent player database with proper access controls.
