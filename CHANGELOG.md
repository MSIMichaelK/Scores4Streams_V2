# Changelog

All notable changes to Scores4Streams V2.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [Semantic Versioning](https://semver.org/).

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
