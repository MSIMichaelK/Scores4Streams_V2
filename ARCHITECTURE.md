# ARCHITECTURE.md — System Map

> Version: 0.9.0 | Last updated: 2026-03-11

## Overview

Scores4Streams V2 is a mobile-first web app for real-time baseball/softball scoring with live broadcast overlay generation. Scorers enter game data on their phone/tablet, Firestore syncs it in real-time, and overlay pages render live scoreboards as SVG for OBS/streaming.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       React 19 + Vite                       │
│                                                             │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ LoginPage│  │   Console Page   │  │ ManualScoringPage│  │
│  │          │  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │
│  │ AuthForm │  │ │GameCreation  │ │  │ │ManualScore   │ │  │
│  │          │  │ │Form          │ │  │ │Controller    │ │  │
│  │          │  │ ├──────────────┤ │  │ │  ┌──────────┐│ │  │
│  │          │  │ │GameList      │ │  │ │  │EventLog  ││ │  │
│  │          │  │ └──────────────┘ │  │ │  └──────────┘│ │  │
│  │          │  │                  │  │ │  useGameEvents│ │  │
│  └──────────┘  └──────────────────┘  │ └──────────────┘ │  │
│                                      └──────────────────┘  │
│                                                             │
│  ┌──────────────────┐                                       │
│  │OverlayFromFigma  │  ← public, no auth, reads aggregate  │
│  │  updateSVGNodes  │     state only via onSnapshot         │
│  └──────────────────┘                                       │
├─────────────────────────────────────────────────────────────┤
│                     React Contexts                          │
│  AuthContext (user, tenantId, roles)                         │
│  FirebaseContext (app instance)                              │
├─────────────────────────────────────────────────────────────┤
│                       Firebase                              │
│                                                             │
│  Auth ──── Firestore ──── Cloud Functions ──── Storage      │
│  │         │                │                   │           │
│  │         ├─ games/{id}    │ setClaims          │ logos     │
│  │         │   (aggregate)  │ (custom claims)    │ (planned)│
│  │         │                │                               │
│  │         └─ games/{id}/events/{eid}                       │
│  │            (play-by-play subcollection)                   │
│  │                                                          │
│  └─ email/password + Google OAuth                           │
│     custom claims: { tenantId, roles[] }                    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + React Router 7 |
| Backend | Firebase (Auth, Firestore, Cloud Functions, Storage, Hosting) |
| Overlays | SVG templates from Figma, rendered via `react-inlinesvg` |
| Testing | Jest + Babel |
| Deployment | Firebase Hosting (not yet deployed to production) |

## Project Structure

```
Scores4Streams_V2/
├── CLAUDE.md                    # Session rules and enforcement (auto-loaded)
├── ARCHITECTURE.md              # This file — system map
├── MEMORY.md                    # Quick-reference lookup
├── CHANGELOG.md                 # Release history
├── docs/
│   └── as-built.md              # Design decisions journal (AB-001+)
├── src/
│   ├── components/
│   │   ├── AuthForm.jsx         # Login/register form
│   │   ├── Console.jsx          # Dashboard page wrapper
│   │   ├── GameCreationForm.jsx # New game form (incl. scoring mode selector)
│   │   ├── GameList.jsx         # Game list with mode badges
│   │   ├── ManualScoreController.jsx  # Main scoring UI (matchup display, lineup flow)
│   │   ├── LineupEditor.jsx           # Mobile-first lineup entry (9/10 slots, DP/FLEX/DR)
│   │   ├── FielderPickerModal.jsx     # 3x3 position grid for fielder chains
│   │   ├── RunnerPickerModal.jsx      # Base runner selection (single/multi)
│   │   └── EventLog.jsx         # Collapsible play-by-play feed
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Firebase Auth + custom claims (user, tenantId, roles)
│   │   └── FirebaseContext.jsx  # Firebase app instance
│   ├── hooks/
│   │   ├── useGameState.js      # useReducer wrapper: scoring engine + undo/redo
│   │   └── useGameEvents.js     # Event recording: queue, commit, undo/redo, pitch count
│   ├── pages/
│   │   ├── LoginPage.jsx        # Login route wrapper
│   │   ├── ManualScoringPage.jsx # Scoring route wrapper (extracts gameId)
│   │   └── OverlayFromFigma.jsx # SVG overlay page (public, onSnapshot listener)
│   ├── utils/
│   │   ├── scoringEngine.js     # Pure scoring engine — 36 action types, polymorphic dispatch
│   │   ├── rosterHelpers.js     # Roster helpers: lineup, batter/pitcher, runner identity
│   │   ├── statsEngine.js      # Per-game stats: batting/pitching/fielding from events
│   │   └── updateSVGNodes.js    # SVG DOM manipulation for overlay
│   ├── __tests__/
│   │   ├── gameReplay.test.js           # Sunshine vs Knox (5-inning game)
│   │   ├── gameReplayDrillers.test.js   # Drillers vs Chiefs (7-inning walkoff)
│   │   ├── objectActions.test.js        # Polymorphic dispatch (8 tests)
│   │   ├── expandedOuts.test.js         # Expanded out types, DP, TP (22 tests)
│   │   ├── baseRunning.test.js          # SB, CS, PK, WP, PB, IP (22 tests)
│   │   ├── battingVariants.test.js      # Sac bunt, bunt hit, D3K, IBB, etc (12 tests)
│   │   ├── roster.test.js              # Roster helpers, batter auto-advance, validation (39 tests)
│   │   ├── statsEngine.test.js        # Per-game stats: team/player batting, pitching, fielding (36 tests)
│   │   ├── walkForceAdvance.test.js     # AB-004 regression tests (10 tests)
│   │   ├── OverlayFromFigma.test.jsx    # Overlay unit tests
│   │   └── OverlayFromFigma.integration.test.jsx
│   ├── Doco/
│   │   ├── Requirements.md      # Original requirements spec (from V1 planning)
│   │   └── Data Model.md        # Planned statistics models (batting/pitching/fielding)
│   ├── router.jsx               # React Router route definitions
│   ├── App.jsx                  # Root component (FirebaseProvider + AuthProvider + Router)
│   ├── App.css                  # All styles (dark theme, mobile-first)
│   └── main.jsx                 # Entry point
├── functions/
│   └── index.js                 # Cloud Functions (setClaims for custom auth claims)
├── public/
│   └── figma_overlay_template.svg  # SVG template designed in Figma
├── .claude/
│   ├── launch.json              # Vite dev server config for preview tools
│   ├── settings.json            # SessionStart hook config
│   ├── settings.local.json      # Local bash/tool permissions (gitignored)
│   ├── hooks/
│   │   └── context-recovery.sh  # Mandatory context recovery script
│   └── worktree-prompt-template.md  # Template for starting new worktree sessions
├── firebase.json
├── firestore.rules
├── package.json
└── vite.config.js
```

## Data Flow: Scoring Action

```
1. Scorer taps button (e.g., "Ground Out" → FielderPickerModal → 6-3)
   │
2. ManualScoreController.handleAction(action):
   ├── Clone state → run applyAction preview → extract new events
   ├── recordEvent() for each event → queue in useGameEvents (countBefore captured)
   ├── dispatch(action) → useGameState reducer → applyAction(state, action)
   │   (useGameState manages undo/redo stacks automatically)
   │
3. React state change triggers Firestore sync useEffect:
   ├── setDoc(games/{gameId}, { aggregate state }, { merge: true })
   └── commitEvents(currentState)
       ├── Stamp stateAfter on all pending events
       ├── Optimistically add to local events array
       └── writeBatch to games/{gameId}/events subcollection
   │
4. Overlay page (separate browser/OBS):
   └── onSnapshot(games/{gameId}) → updateSVGNodes() → live scoreboard
```

## Data Flow: Overlay

```
OBS Browser Source → /overlay/{gameId}
  │
  OverlayFromFigma component
  ├── Loads figma_overlay_template.svg via react-inlinesvg
  ├── onSnapshot(games/{gameId}) listens for real-time changes
  └── updateSVGNodes(svg, gameData) updates SVG text/visibility:
      - Team names, scores, inning
      - Ball/strike/out indicators
      - Base runner diamonds
      - Pitch count
```

## Scoring Modes

| | Simple | Advanced |
|---|---|---|
| **Default** | Yes | No (opt-in at game creation) |
| **Count** | Ball, Strike, Foul, Out | Same |
| **Hits** | 1B, 2B, 3B, HR | Same |
| **Outs** | Generic Out | Expandable: GO, FO, LO, PO, FF, IF, K, KC, DP, TP, INT |
| **Plays** | — | E, HBP, FC, SAC, SAC-B, BH, SL, D3K, IBB, OBS |
| **Base running** | — | SB, CS, PK, WP, PB (via "More Plays" toggle) |
| **Fielder tracking** | — | Position picker (e.g., 6-4-3) |
| **Manual adjustments** | Runner toggles, Score +/- | Same |
| **Player tracking** | No (batterId/pitcherId null) | Roster + batter/pitcher on events |
| **Events recorded** | Yes (coarse) | Yes (granular play types) |
| **Target user** | Parent, volunteer | Dedicated scorer/statistician |
| **Firestore doc** | Same `games/{gameId}` | Same |
| **Overlay** | Same | Same |

## Documentation Map

| Document | Purpose | When to Read |
|----------|---------|-------------|
| `CLAUDE.md` | Session rules, enforcement, common mistakes | Every session start (hook enforces this) |
| `ARCHITECTURE.md` | System map, data flow, file structure | When you need to understand what exists |
| `MEMORY.md` | Quick lookup: entity names, schema, key files | When you need a specific name or value |
| `docs/as-built.md` | Design decisions, what was tried, what was rejected | Before changing any scoring logic or data model |
| `CHANGELOG.md` | Release history | Before version bumping |
| `src/Doco/Requirements.md` | Original requirements spec | For planned features and roadmap context |
| `src/Doco/Data Model.md` | Planned statistics models | When building stats computation layer |
| `gh issue list --state open` | Current priorities | Every session start |
