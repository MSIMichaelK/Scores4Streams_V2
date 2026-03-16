# MEMORY.md — Quick Reference

> Last updated: 2026-03-10

## Firebase

- **Project ID:** scores4streams-v2
- **Region:** us-central1
- **Console:** https://console.firebase.google.com/project/scores4streams-v2

## Test Account

- **Email:** claude-test@scores4streams.dev
- **Password:** TestAccount2026!
- **Team:** Test Thunder
- **Role:** Scorer
- **Purpose:** Claude's dev/test account for UI reviews and testing

## Firebase Admin

- **Service account key:** `/Users/mkronk/Downloads/scores4streams-v2-firebase-adminsdk-fbsvc-31e5c4b534.json`
- **Usage:** `export GOOGLE_APPLICATION_CREDENTIALS="/Users/mkronk/Downloads/scores4streams-v2-firebase-adminsdk-fbsvc-31e5c4b534.json"`

## Development

- **Node.js:** v25.6.1 at `/opt/homebrew/bin/node`
- **PATH prefix:** `export PATH="/opt/homebrew/bin:/usr/bin:$PATH"` (required before npm commands)
- **Dev server:** Vite on port 5173 (`npm run dev`)
- **Tests:** Jest (`npm test`) — 12 suites, 203 tests

## Routes

| Route | Purpose |
|-------|---------|
| `/` and `/console` | Dashboard — game list, team switching, game creation |
| `/login` | Firebase Auth (email/password + Google OAuth) |
| `/manual/:gameId` | Scoring interface (reads `scoringMode` from game doc) |
| `/overlay/:gameId` | Figma SVG overlay for OBS (public, no auth) |

## Firestore Schema

### `teams/{teamId}` (NEW in v2.0.0)

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Full team name |
| `shortName` | string | 3-4 chars for scoreboard display |
| `logoUrl` | string | Optional |
| `createdBy` | string | UID of creator |
| `createdAt` | Timestamp | |

### `teams/{teamId}/players/{playerId}` (NEW in v2.0.0)

| Field | Type | Notes |
|-------|------|-------|
| `firstName` | string | |
| `lastName` | string | |
| `name` | string | Computed "First Last" |
| `number` | string | Jersey number |
| `active` | boolean | Soft-delete for roster management |
| `createdAt` | Timestamp | |

### `users/{uid}` (UPDATED in v2.0.0)

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | |
| `activeTenant` | string | Real team doc ID (references `teams/{teamId}`) |
| `memberships` | map | `{ [teamId]: { roles: [...], teamName: "..." } }` |

### `games/{gameId}` (aggregate state — overlay reads this)

| Field | Type | Notes |
|-------|------|-------|
| `homeScore`, `awayScore` | int | |
| `balls`, `strikes`, `outs` | int | |
| `runners` | `{first, second, third}` | booleans |
| `inning` | int | |
| `isTop` | boolean | |
| `homeTeamName`, `awayTeamName` | string | |
| `scoringMode` | string | `"simple"` (default) or `"advanced"` |
| `pitchCount` | int | |
| `teamId` | string | Owning team doc ID (replaces `tenantId`) |
| `tenantId` | string | Backward compat alias for `teamId` |
| `homeTeamId` | string/null | References `teams/{teamId}`, null for ad-hoc |
| `awayTeamId` | string/null | Same |
| `createdBy` | string | user UID |
| `leagueName` | string | |
| `status` | string | `"scheduled"`, `"live"`, `"final"` |
| `scheduledStart` | Timestamp | |

### `games/{gameId}/events/{eventId}` (play-by-play)

| Field | Type | Notes |
|-------|------|-------|
| `seq` | int | Ordering: 1, 2, 3... |
| `timestamp` | string | ISO 8601 |
| `inning`, `isTop` | int, boolean | |
| `type` | string | `ball`, `strike`, `foul`, `out`, `hit`, `walk`, `strikeout`, `error`, `hbp`, `fc`, `sac_fly`, `score_adjust`, `runner_toggle` |
| `subType` | string/null | `"Single"`, `"Double"`, `"Triple"`, `"Home Run"` for hits; base name for toggle |
| `isPitch` | boolean | true for all ball-in-play events (drives pitch count) |
| `resultedInOut` | boolean | |
| `runsScored` | int | |
| `countBefore` | `{balls, strikes, outs}` | State at time of action |
| `stateAfter` | object | Full game state after action applied |
| `description` | string | Human-readable |
| `batterId`, `pitcherId` | null | Placeholders for future roster system |
| `undone` | boolean | Soft-delete flag for undo |

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/scoringEngine.js` | Pure scoring engine — 36 action types, polymorphic dispatch |
| `src/utils/rosterHelpers.js` | Roster helpers: lineup, batter/pitcher lookup, runner identity |
| `src/utils/statsEngine.js` | Per-game statistics: batting/pitching/fielding from events |
| `src/hooks/useGameState.js` | useReducer wrapper with undo/redo, roster management, runner identity |
| `src/hooks/useGameEvents.js` | Event recording hook — dual-write, pending queue, batterId/pitcherId |
| `src/components/ManualScoreController.jsx` | Scoring UI — matchup display, lineup flow, expandable menus |
| `src/components/LineupEditor.jsx` | Mobile-first lineup entry form (9/10 slots, DP/FLEX/DR) |
| `src/components/FielderPickerModal.jsx` | 3x3 fielder position grid for building chains |
| `src/components/RunnerPickerModal.jsx` | Base runner selection (single/multi-select) |
| `src/components/GameStats.jsx` | Collapsible game statistics panel (batting/pitching tabs) |
| `src/components/EventLog.jsx` | Collapsible play-by-play feed |
| `src/components/GameCreationForm.jsx` | New game form with scoring mode selector |
| `src/components/GameList.jsx` | Game list with mode badges |
| `src/components/TeamRosterManager.jsx` | Persistent team roster CRUD |
| `src/hooks/useTeams.js` | Team CRUD: createTeam, getTeam, listUserTeams |
| `src/hooks/useTeamRoster.js` | Player CRUD: addPlayer, getActivePlayers, updatePlayer |
| `src/pages/OverlayFromFigma.jsx` | SVG overlay page (reads aggregate state only) |
| `src/utils/updateSVGNodes.js` | SVG node manipulation for overlay |
| `src/contexts/AuthContext.jsx` | Firebase Auth context with custom claims |
| `public/figma_overlay_template.svg` | SVG template designed in Figma |

## Scoring Engine Actions

**Count:** `ball`, `strike`, `foul`
**Hits:** `single`, `double`, `triple`, `homerun`
**Outs (legacy):** `out`, `strikeout`, `walk`
**Outs (expanded):** `ground_out`, `fly_out`, `line_drive_out`, `popup_out`, `foul_fly_out`, `infield_fly`, `strikeout_swinging`, `strikeout_looking`, `double_play`, `triple_play`
**Plays:** `error`, `hbp`, `fc`, `sac_fly`, `sacrifice_bunt`, `bunt_hit`, `slap_hit`, `dropped_third_strike`, `intentional_walk`, `obstruction`, `interference`
**Base running:** `stolen_base`, `caught_stealing`, `pick_off`, `wild_pitch`, `passed_ball`, `illegal_pitch`
**Manual:** `toggle_first`, `toggle_second`, `toggle_third`, `score_home`, `score_away`, `runner_toggle`, `score_adjust`

## Test Game Data

| Game | File | Final Score | Key Features Tested |
|------|------|-------------|---------------------|
| Sunshine vs Knox | `gameReplay.test.js` | Away 9 – Home 8 | 5 innings, walks, strikeouts, hits, errors, full-count scenarios |
| NE Drillers vs Hill United Chiefs | `gameReplayDrillers.test.js` | Away 5 – Home 6 (walkoff) | 7 innings, HBP, sac fly, FC, DPs, stolen bases, pickoff |
| ACT vs South Australia (L2) | `gameReplayL2.test.js` | ACT 6 – SA 4 | 7 innings, Advanced mode object actions, DP/FLEX lineups, ground/fly/line outs, K swinging/looking, D3K, HR, 2B, 1B, BB, HBP, errors, SB, CS, WP |

## Known Bugs

- ~~Walk force-advance bug~~ **FIXED** — Walk handler now uses the same force-chain logic as HBP. Regression tests in `walkForceAdvance.test.js`.
- ~~DP pitch overcount~~ **FIXED** — `double_play` action records 2 outs from 1 pitch (AB-006 resolved).
- **Logo uploads disabled:** Cloud Function for logo processing is incomplete.

## Known Limitations

- FC-without-out cannot be modeled (FC action always records an out) (AB-007)
- Runner auto-advancement on hits is simplified (single always advances runner from 2nd to 3rd)
- Sac fly only scores runner from 3rd — tag-ups from 2nd need manual toggle (AB-009)
- All runs treated as earned — earned/unearned classification deferred to v1.1.0
- Inherited runner attribution supported in statsEngine but requires hooks layer wiring (AB-016)

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.1.0 | pre-2026 | Initial Firebase Auth, game creation, manual scoring, overlay |
| 0.2.0 | 2026-03-09 | Event recording, pitch count, play-by-play feed, scoring engine tests |
| 0.3.0 | 2026-03-09 | E/HBP/FC/SAC actions, force-advance logic, Drillers test, score_home/score_away |
| 0.4.0 | 2026-03-09 | Simple vs Advanced scoring mode selection |
| 0.5.0 | 2026-03-09 | Project workflow: context recovery, ARCHITECTURE.md, MEMORY.md, as-built.md |
| 0.6.0 | 2026-03-10 | Engine refactor: polymorphic dispatch, expanded outs, useGameState hook, controller rewrite |
| 0.7.0 | 2026-03-10 | Phase 2 play types, picker modals, decluttered Advanced UI |
| 0.8.0 | 2026-03-10 | Game-level rosters, lineup entry, batter/pitcher tracking, DP/FLEX/DR |
| 0.9.0 | 2026-03-11 | Per-game statistics engine, batting/pitching/fielding stats, GameStats UI |
| 1.0.0 | 2026-03-13 | L2 practice game integration test, inherited runner attribution |
| 1.1.0 | 2026-03-14 | Lineup validation: duplicate position prevention, first/last name split |
| 1.2.0 | 2026-03-14 | Responsive layout: phone/tablet/desktop breakpoints, one-screen scoring on mobile |
| 1.3.0 | 2026-03-15 | Bottom tab navigation, Settings page, player names on diamond |
| 2.0.0 | 2026-03-15 | Database redesign: teams collection, persistent players, team-based auth |
| 2.1.0 | 2026-03-16 | Interactive diamond: tap-to-select/move runners, enlarged diamond, layout redesign |
