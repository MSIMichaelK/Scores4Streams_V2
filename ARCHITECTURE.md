# ARCHITECTURE.md — System Map

> Version: 0.5.0 | Last updated: 2026-03-09

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
│   │   ├── ManualScoreController.jsx  # Main scoring UI (all handlers, state)
│   │   └── EventLog.jsx         # Collapsible play-by-play feed
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Firebase Auth + custom claims (user, tenantId, roles)
│   │   └── FirebaseContext.jsx  # Firebase app instance
│   ├── hooks/
│   │   └── useGameEvents.js     # Event recording: queue, commit, undo/redo, pitch count
│   ├── pages/
│   │   ├── LoginPage.jsx        # Login route wrapper
│   │   ├── ManualScoringPage.jsx # Scoring route wrapper (extracts gameId)
│   │   └── OverlayFromFigma.jsx # SVG overlay page (public, onSnapshot listener)
│   ├── utils/
│   │   ├── scoringEngine.js     # Pure scoring engine for game replay testing
│   │   └── updateSVGNodes.js    # SVG DOM manipulation for overlay
│   ├── __tests__/
│   │   ├── gameReplay.test.js           # Sunshine vs Knox (5-inning game)
│   │   ├── gameReplayDrillers.test.js   # Drillers vs Chiefs (7-inning walkoff)
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
1. Scorer taps button (e.g., "Strike")
   │
2. ManualScoreController handler:
   ├── saveSnapshot() → push to undoStack (for undo/redo)
   ├── recordEvent() → queue pending event in useGameEvents
   │   (event has countBefore, type, isPitch, etc.)
   ├── Update local React state (setBalls, setStrikes, etc.)
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
| **Plays** | — | E, HBP, FC, SAC |
| **Manual adjustments** | Runner toggles, Score +/- | Same |
| **Player tracking** | No (batterId/pitcherId null) | Planned |
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
