---
name: scoring-modes
description: "Use when modifying simple vs advanced mode gating, scoringMode field, mode selection at game creation, toggling features by mode, or deciding which UI elements appear in simple vs advanced scoring"
---

# Scoring Modes Navigator

Games have a `scoringMode` field: `"simple"` (default) or `"advanced"` (opt-in at creation). Simple mode is lean for parents/volunteers. Advanced mode adds granular play types for dedicated scorers.

## Key Files

| File | Role |
|------|------|
| `src/components/GameCreationForm.jsx` | Mode selector toggle at game creation |
| `src/components/ManualScoreController.jsx` | Conditional rendering based on `scoringMode` |
| `src/components/GameList.jsx` | Mode badges on game cards |

## As-Built Decisions

- **AB-008 (mode split):** `scoringMode` on game doc. Simple = Ball/Strike/Foul/Out + Hits + toggles + score +/- + undo/redo. Advanced = all of Simple + E/HBP/FC/SAC + expanded outs + fielder chains + base running actions + roster/lineup.
- Mode can be switched mid-game (no data loss — events preserved regardless).
- Both modes write to the same Firestore doc and overlay.

## Mode Feature Matrix

| Feature | Simple | Advanced |
|---------|--------|----------|
| Ball/Strike/Foul/Out | Yes | Yes |
| Hits (1B/2B/3B/HR) | Yes | Yes |
| Runner toggles, Score +/- | Yes | Yes |
| Undo/Redo | Yes | Yes |
| Expanded outs (GO, FO, LO, K, DP...) | No | Yes |
| Plays (E, HBP, FC, SAC...) | No | Yes |
| Base running (SB, CS, PK, WP, PB) | No | Yes |
| Fielder position tracking | No | Yes |
| Roster / Lineup | No | Yes |
| Player tracking on events | No | Yes |

## Open Assumptions

- None directly.

## Related Closed Issues

- **#15** Full-scoring-engine (Advanced mode is the full engine)
- **#27** Runner move UX (works in both modes)

## Regression Risks

1. **Don't add complexity to Simple mode** — its value is being lean. Gate new features behind `scoringMode === "advanced"`.
2. **Conditional rendering** — check ManualScoreController's `scoringMode` checks before adding new UI sections.
3. **Event compatibility** — both modes write events to the same subcollection. Simple mode events are coarser but must remain valid for stats computation.
