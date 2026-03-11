# Changelog

All notable changes to Scores4Streams V2.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [Semantic Versioning](https://semver.org/).

---

## [0.9.0] — 2026-03-11

### Added
- **Per-game statistics engine:** `statsEngine.js` — pure functions computing batting, pitching, and fielding stats from event stream
- **Batting stats:** PA, AB, H, 1B, 2B, 3B, HR, RBI, BB, IBB, HBP, K, SF, SH, SB, CS, GDP, R, TB, XBH, BA, OBP, SLG, OPS
- **Pitching stats:** BF, IP, H, R, ER, BB, HBP, K, WP, pitches, ERA, WHIP, K/9, BB/9, K/BB (softball 7-inning ERA)
- **Fielding stats:** PO, A, E, DP, TC, FPCT (from positions arrays in Advanced mode)
- **Per-player breakdowns:** individual batting and pitching lines when rosters are loaded
- **GameStats component:** collapsible stats panel on scoring page with batting/pitching tabs
- **Team summary view:** quick-glance AB/H/HR/R/BB/K/BA line for each team
- **Player stat tables:** detailed batting and pitching tables with horizontal scroll for mobile
- `statsEngine.test.js` (36 tests) — team-level, per-player, edge cases, fielding

### Known Limitations
- All runs treated as earned (earned/unearned classification deferred to Phase 5)
- Inherited runner attribution not implemented (all runs charged to current pitcher)

---

## [0.8.0] — 2026-03-10

### Added
- **Game-level rosters:** per-game player tracking with name, jersey number, position, batting order
- **DP/FLEX/DR support:** 10-player lineup with designated player, flex, and designated runner positions
- **LineupEditor component:** mobile-first lineup entry form with position dropdowns
- **Pre-game lineup flow:** Advanced mode prompts for lineup entry before first pitch (skippable)
- **Batter auto-advance:** batting order automatically advances after plate appearances
- **Matchup display:** shows current batter and pitcher above count section
- **Pitcher change action:** `pitcher_change` records pitching changes in event log
- **Runner identity tracking:** parallel `runnerIdentity` map tracks which players are on base
- **Overlay integration:** `batterName`/`pitcherName` populated from roster for live display
- `rosterHelpers.js` — pure helpers: `getBattingLineup`, `getCurrentBatter/Pitcher`, `updateRunnerIdentity`, `validateLineup`
- `roster.test.js` (39 tests) — lineup helpers, batter auto-advance, runner identity, validation

### Changed
- `useGameState` hook: `__SET_LINEUP__` and `__SET_BATTER_INDEX__` reducer actions, runner identity auto-update
- `useGameEvents`: `recordEvent` accepts `batterId`/`pitcherId` params (no longer hardcoded null)
- `ManualScoreController`: Firestore sync includes roster fields, Lineups button in header
- `createGameState` extended with roster fields (null defaults, fully backward compatible)

---

## [0.7.0] — 2026-03-10

### Added
- **Phase 2 play types:** stolen_base, caught_stealing, pick_off, wild_pitch, passed_ball, illegal_pitch, sacrifice_bunt, bunt_hit, slap_hit, dropped_third_strike, intentional_walk, obstruction, interference
- `FielderPickerModal` — 3x3 position grid for building fielder chains (e.g., 6-4-3)
- `RunnerPickerModal` — base selection for SB/CS/PK (single) and WP/PB (multi-select)
- Expandable Out sub-menu in Advanced mode (GO, FO, LO, PO, FF, IF, K, KC, DP, TP, INT)
- Collapsible "More Plays" toggle for Batting + Base Running sections
- `baseRunning.test.js` (22 tests), `battingVariants.test.js` (12 tests)

### Changed
- ManualScoreController decluttered: default view shows 3 button rows + "More Plays" toggle

---

## [0.6.0] — 2026-03-10

### Added
- **Polymorphic `applyAction`:** accepts string (`"single"`) or object (`{ type: "ground_out", positions: [6, 3] }`)
- **Expanded out types:** ground_out, fly_out, line_drive_out, popup_out, foul_fly_out, infield_fly, strikeout_swinging, strikeout_looking, double_play, triple_play
- `runner_toggle` and `score_adjust` action types in engine
- `useGameState` hook — `useReducer` wrapper with undo/redo stacks and `initFromFirestore`
- Extracted helpers: `handleForceAdvance`, `handleSingleAdvance`, `formatPositions`
- `objectActions.test.js` (8 tests), `expandedOuts.test.js` (22 tests)

### Changed
- ManualScoreController rewritten from 690 → ~350 lines using `useGameState` dispatch
- Generic `handleAction` pattern replaces 14 duplicated handler functions
- Double play now properly clears scoring runners (timing play fix)

### Fixed
- DP pitch overcount resolved: `double_play` action records 2 outs from 1 pitch (AB-006)

---

## [0.5.0] — 2026-03-09

### Added
- Project workflow infrastructure: CLAUDE.md (session rules), ARCHITECTURE.md, MEMORY.md, docs/as-built.md (11 decisions), CHANGELOG.md
- SessionStart hook with mandatory context recovery and proof checklist
- Worktree prompt template for standardized new sessions

---

## [0.4.0] — 2026-03-09

### Added
- Simple vs Advanced scoring mode selection at game creation
- `scoringMode` field on game document (`"simple"` default, `"advanced"` opt-in)
- Mode selector toggle in GameCreationForm
- Mode badge in GameList and ManualScoreController
- CSS styles for mode selector and badges

### Changed
- E/HBP/FC/SAC "Plays" section only renders in Advanced mode
- CLAUDE.md updated with scoring mode architecture decision

---

## [0.3.0] — 2026-03-09

### Added
- Error (E) action — reaches on error, single-equivalent runner advancement
- Hit By Pitch (HBP) action — proper force-chain logic for runner advancement
- Fielder's Choice (FC) action — records out + batter reaches 1st
- Sacrifice Fly (SAC) action — records out + runner from 3rd scores
- `score_home` / `score_away` actions for manual score adjustment
- NE Drillers vs Hill United Chiefs game replay test (7 innings, 200+ actions)
- "Plays" UI section with E/HBP/FC/SAC buttons

### Fixed
- `isPitch` changed from `false` to `true` for out, hit, error, hbp, fc, sac_fly — pitch count was ~30% too low
- HBP force-advance rewritten with proper chain logic (only forces runners in continuous chain from 1st)

### Known Issues
- Walk handler still uses simplified force-advance logic (pre-existing bug, AB-004)
- DPs modeled as 2x out — overcounts 1 pitch per DP
- FC-without-out cannot be modeled

---

## [0.2.0] — 2026-03-09

### Added
- Play-by-play event recording to `games/{gameId}/events` subcollection
- `useGameEvents` hook with pending event queue and dual-write pattern
- Pitch count tracking (persisted in Firestore, restored on reload)
- `EventLog` component — collapsible play-by-play feed
- Pure `scoringEngine.js` for testable game replay
- Sunshine vs Knox game replay test (5 innings, full game)
- Soft-delete undo/redo for events (`undone: true` flag)

---

## [0.1.0] — Pre-2026

### Added
- Firebase Auth (email/password + Google OAuth) with custom claims
- Game creation form with team names, start time, league
- Game list with role-based access (admin/scorer)
- Manual scoring: balls, strikes, outs, base runners, walks, strikeouts, hits, fouls, innings
- Undo/redo for scoring actions
- Real-time Firestore sync for live game data
- Figma SVG overlay for OBS/streaming (`OverlayFromFigma`)
- `updateSVGNodes` utility for SVG DOM manipulation
- Mobile-first dark theme UI
- Environment-based Firebase config
- Firestore security rules
- Cloud Functions for custom claims (`setClaims`)
