# MEMORY.md — Quick Reference

> Last updated: 2026-03-10

## Firebase

- **Project ID:** scores4streams-v2
- **Region:** us-central1
- **Console:** https://console.firebase.google.com/project/scores4streams-v2

## Development

- **Node.js:** v25.6.1 at `/opt/homebrew/bin/node`
- **PATH prefix:** `export PATH="/opt/homebrew/bin:/usr/bin:$PATH"` (required before npm commands)
- **Dev server:** Vite on port 5173 (`npm run dev`)
- **Tests:** Jest (`npm test`) — 9 suites, 106 tests

## Routes

| Route | Purpose |
|-------|---------|
| `/` and `/console` | Dashboard — game list, team switching, game creation |
| `/login` | Firebase Auth (email/password + Google OAuth) |
| `/manual/:gameId` | Scoring interface (reads `scoringMode` from game doc) |
| `/overlay/:gameId` | Figma SVG overlay for OBS (public, no auth) |

## Firestore Schema

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
| `tenantId` | string | |
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
| `src/utils/scoringEngine.js` | Pure scoring engine — 35 action types, polymorphic dispatch |
| `src/hooks/useGameState.js` | useReducer wrapper around engine with undo/redo stacks |
| `src/hooks/useGameEvents.js` | Event recording hook — dual-write, pending queue, commit |
| `src/components/ManualScoreController.jsx` | Scoring UI — generic handleAction, expandable menus |
| `src/components/FielderPickerModal.jsx` | 3x3 fielder position grid for building chains |
| `src/components/RunnerPickerModal.jsx` | Base runner selection (single/multi-select) |
| `src/components/EventLog.jsx` | Collapsible play-by-play feed |
| `src/components/GameCreationForm.jsx` | New game form with scoring mode selector |
| `src/components/GameList.jsx` | Game list with mode badges |
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

## Known Bugs

- ~~Walk force-advance bug~~ **FIXED** — Walk handler now uses the same force-chain logic as HBP. Regression tests in `walkForceAdvance.test.js`.
- ~~DP pitch overcount~~ **FIXED** — `double_play` action records 2 outs from 1 pitch (AB-006 resolved).
- **Logo uploads disabled:** Cloud Function for logo processing is incomplete.

## Known Limitations

- FC-without-out cannot be modeled (FC action always records an out) (AB-007)
- Runner auto-advancement on hits is simplified (single always advances runner from 2nd to 3rd)
- Sac fly only scores runner from 3rd — tag-ups from 2nd need manual toggle (AB-009)

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
