---
name: stats-engine
description: "Use when modifying statistics computation, batting/pitching/fielding stats, ERA/WHIP/OPS calculations, inherited runner attribution, computeGameStats, per-player stat breakdowns, or the GameStats UI component"
---

# Stats Engine Navigator

Statistics are computed from the event stream on every render — no incremental tracking. The engine handles undo automatically by filtering `undone: true` events.

## Key Files

| File | Role |
|------|------|
| `src/utils/statsEngine.js` | Pure functions: `computeGameStats(events, homeRoster, awayRoster)` |
| `src/components/GameStats.jsx` | Collapsible stats panel: batting/pitching tabs, team summary, player tables |
| `src/__tests__/statsEngine.test.js` | 41 tests: team-level, per-player, edge cases, fielding, inherited runners |

## As-Built Decisions

- **AB-014 (compute from events):** Recompute all stats from full event array every time. No incremental tracking. Undo/redo automatically handled via `undone: true` filtering.
- **AB-016 (inherited runners):** Optional `inheritedRunnerPitcherIds` array on events. Redistributes runs to the pitcher who put the runner on base. Backward compatible — events without it use old behavior.

## Stats Computed

**Batting:** PA, AB, H, 1B, 2B, 3B, HR, RBI, BB, IBB, HBP, K, SF, SH, SB, CS, GDP, R, TB, XBH, BA, OBP, SLG, OPS
**Pitching:** BF, IP, H, R, ER, BB, HBP, K, WP, pitches, ERA, WHIP, K/9, BB/9, K/BB
**Fielding:** PO, A, E, DP, TC, FPCT (Advanced mode only — requires position arrays)

## Key Formulas

- **ERA** = (ER x 7) / IP — softball 7-inning formula, not baseball 9-inning
- **WHIP** = (BB - IBB + H) / IP
- **Ball/strike/foul events pass through** batting accumulators harmlessly (not in PA_TYPES) but carry `isPitch: true` for pitch counts

## Open Assumptions

- None directly, but earned/unearned run classification is deferred (all runs treated as earned).

## Related Closed Issues

- **#15** Full-scoring-engine (stats are part of the full engine vision)

## Known Limitations

- All runs treated as earned — earned/unearned deferred
- Inherited runner attribution supported in statsEngine but requires hooks layer wiring (AB-016)
- Fielding stats only available in Advanced mode (requires fielder chains on events)

## Regression Risks

1. **Undone event filtering** — `computeGameStats` must filter `undone: true` before accumulating. Any new consumer of events must do the same.
2. **isPitch dependency** — pitch counts come from events with `isPitch: true`. If gameplay-engine changes isPitch flags, stats break.
3. **Inherited runner wiring** — statsEngine supports `inheritedRunnerPitcherIds` but the hooks layer doesn't populate it yet. When wiring this up, test with the 5 attribution tests in `statsEngine.test.js`.
4. **Softball ERA formula** — uses 7 innings, not 9. Don't change to baseball formula without a config option.
5. **WHIP excludes IBB** — `(BB - IBB + H) / IP`. Don't include IBB in walks for WHIP.
