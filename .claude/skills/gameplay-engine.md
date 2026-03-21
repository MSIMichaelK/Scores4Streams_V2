---
name: gameplay-engine
description: "Use when modifying scoring actions, runner advancement, force-advance logic, isPitch flags, polymorphic dispatch, base running (SB/CS/PK/WP/PB), fielder chains, DP/TP, FC, sac fly, error advancement, hits, outs, walks, HBP, or any action type in scoringEngine.js"
---

# Gameplay Engine Navigator

The scoring engine (`src/utils/scoringEngine.js`) is a pure function handling all 36 action types via polymorphic dispatch. Every change here risks pitch count regressions, runner state corruption, or force-advance bugs.

## Key Files

| File | Role |
|------|------|
| `src/utils/scoringEngine.js` | Pure engine — `applyAction(state, action)`, 36 action types |
| `src/hooks/useGameState.js` | `useReducer` wrapper: dispatches to engine, manages undo/redo stacks |
| `src/components/ManualScoreController.jsx` | UI layer: `handleAction` → preview → `recordEvent` → `dispatch` |
| `src/components/FielderPickerModal.jsx` | 3x3 position grid for fielder chains (e.g., 6-4-3) |
| `src/components/RunnerPickerModal.jsx` | Base runner selection (single for SB/CS/PK, multi for WP/PB) |

## As-Built Decisions

- **AB-003 (isPitch):** ALL ball-in-play events have `isPitch: true` — out, hit, error, hbp, fc, sac_fly. If you add a new action type, decide whether it counts as a pitch.
- **AB-004 (force-advance):** Walk AND HBP use force-chain logic — only runners in continuous chain from 1st are forced. Regression tests in `walkForceAdvance.test.js`.
- **AB-005 (errors):** Error = single-equivalent advancement + manual adjustments. Don't make the error action smarter.
- **AB-006 (DP):** `double_play` action records 2 outs from 1 pitch. Legacy 2x-out encoding overcounts pitches.
- **AB-007 (FC):** FC always records an out. FC-without-out cannot be modeled — use manual toggles.
- **AB-009 (sac fly):** Only scores runner from 3rd. Tag-ups from 2nd need manual toggle.
- **AB-010 (score adjust):** `score_home`/`score_away` are escape hatches for cases auto-advance misses.

## Findings

- **F-001:** isPitch must be true for all ball-in-play events. Pitch counts were ~30% low when this was wrong. Nearly re-broken in a later session.
- **F-003:** Test data pitch counts are correct — verified against real GameChanger data. Never change test expectations without checking the source.

## Open Assumptions

- None directly affecting gameplay engine.

## Related Closed Issues

- **#15** Full-scoring-engine (original tracking issue)
- **#35** Runner doesn't advance to home from 3rd (fielder markers intercepted clicks)
- **#31** Full field view with fielder positions

## Regression Risks

1. **isPitch regression** — any new action type must set `isPitch` correctly. Verify with `gameReplayDrillers.test.js` pitch counts.
2. **Force-advance corruption** — walk/HBP must use chain logic. Test with `walkForceAdvance.test.js` (all 8 base-state combos).
3. **Runner state leaks** — `changeSides` must clear all runners. DP/TP must clear the correct runners.
4. **Polymorphic dispatch breakage** — engine accepts both strings (`"single"`) and objects (`{ type: "ground_out", positions: [6,3] }`). Both paths must stay working.
5. **Test data is authoritative** — Sunshine Knox, Drillers Chiefs, and ACT vs SA L2 games are encoded from real games.

## Test Suites

| Suite | Tests | What it covers |
|-------|-------|---------------|
| `gameReplay.test.js` | ~20 | Sunshine vs Knox 5-inning game |
| `gameReplayDrillers.test.js` | ~30 | Drillers vs Chiefs 7-inning walkoff |
| `gameReplayL2.test.js` | 17 | ACT vs SA L2 practice (Advanced mode object actions) |
| `objectActions.test.js` | 8 | Polymorphic dispatch |
| `expandedOuts.test.js` | 22 | Expanded out types, DP, TP |
| `baseRunning.test.js` | 22 | SB, CS, PK, WP, PB, IP |
| `battingVariants.test.js` | 12 | Sac bunt, bunt hit, D3K, IBB |
| `walkForceAdvance.test.js` | 10 | AB-004 regression: all 8 base-state combos |
