# As-Built Decisions

> Design decisions made during development. Each entry records what was found, what was decided, and why it matters. Read this before changing any scoring logic or data model.

---

## AB-001: Dual-Write Pattern for Event Recording

**Date:** 2026-03-09 | **Affects:** ManualScoreController, useGameEvents, OverlayFromFigma

**Finding:** The overlay needs aggregate game state (score, outs, inning, runners) for real-time display. But computing stats later requires individual play events. Writing only events and computing aggregate state from them would add latency to the overlay and make the overlay logic complex.

**Decision:** Every scoring action writes BOTH:
1. Aggregate state to `games/{gameId}` (overlay reads this via `onSnapshot`)
2. A structured event to `games/{gameId}/events` subcollection (for stats later)

**Why it matters:** If you change the aggregate write, the overlay breaks. If you change the event schema, future stats computation breaks. They are intentionally decoupled — don't merge them.

---

## AB-002: Pending Event Queue (recordEvent → commitEvents)

**Date:** 2026-03-09 | **Affects:** useGameEvents.js, ManualScoreController.jsx

**Finding:** Action handlers need to record events with `countBefore` (state at time of action) but stamp `stateAfter` (state after all changes). React state updates are asynchronous, so you can't read the new state immediately after setting it.

**Decision:** Two-phase commit:
1. `recordEvent(eventData, gameState)` — called by handler BEFORE state changes. Captures `countBefore` from current state. Queues the event in `pendingEventsRef`.
2. `commitEvents(currentState)` — called from the Firestore sync `useEffect` AFTER state has updated. Stamps `stateAfter` on all pending events and writes them to Firestore.

**Why it matters:** If you call `recordEvent` after state changes, `countBefore` will be wrong. If you call `commitEvents` before the React state settles, `stateAfter` will be wrong. The two-phase pattern handles rapid taps correctly (multiple events can queue before a single commit).

---

## AB-003: isPitch Changed from false to true for Outs and Hits

**Date:** 2026-03-09 | **Affects:** scoringEngine.js, ManualScoreController.jsx

**Finding:** Pitch count was undercounting because only `ball`, `strike`, and `foul` had `isPitch: true`. When a batter put the ball in play (hit, out, error), no pitch was counted. Real games showed the pitch count was ~30% too low.

**Decision:** All "ball in play" events now have `isPitch: true`:
- `out`, `single`, `double`, `triple`, `homerun`, `error`, `hbp`, `fc`, `sac_fly`

Only non-pitch events: `toggle_first/second/third`, `score_home`, `score_away`, `runner_toggle`, `score_adjust`

**Why it matters:** If you add a new action type, you must decide whether it counts as a pitch. The test games verify total pitch counts against real GameChanger data.

---

## AB-004: HBP Force-Advance Uses Chain Logic, Walk Does Not (Known Bug)

**Date:** 2026-03-09 | **Affects:** scoringEngine.js (hbp action), ManualScoreController.jsx (handleHBP, handleBall)

**Finding:** Initial HBP implementation used simplified runner logic: `state.runners.third = state.runners.second || (state.runners.third && !runsScored)`. This incorrectly cleared non-forced runners. Example: runner on 2nd with empty 1st — the HBP should put batter on 1st and leave 2nd alone, but the simplified logic would clear 2nd.

**Decision:** HBP handler was rewritten with proper force-chain logic:
```javascript
// Only advance runners in continuous chain from 1st
if (was.first) {
  if (was.second) {
    if (was.third) { addRun(); runsScored++; }
    state.runners.third = true;
  }
  state.runners.second = true;
}
state.runners.first = true;
```

**Known bug:** The walk handler in `handleBall` (ManualScoreController) still uses the OLD simplified logic. It has the same bug but none of our test data triggers it. Fix it when we next touch `handleBall`.

**Why it matters:** Force-advance logic is subtle. A walk/HBP with bases loaded scores a run, but a walk/HBP with runners on 1st and 3rd only (no 2nd) should NOT move the runner from 3rd. The chain only pushes runners who are forced.

---

## AB-005: Error Action Advances Runners Like a Single

**Date:** 2026-03-09 | **Affects:** scoringEngine.js (error action)

**Finding:** Errors in real games have wildly variable runner advancement. A dropped fly ball might not advance anyone; a throwing error might advance everyone two bases.

**Decision:** Error action uses single-equivalent advancement: runner on 3rd scores, 2nd→3rd, 1st→2nd, batter to 1st. Scorer uses manual `toggle_*` and `score_home`/`score_away` actions to adjust for extra advancement.

**Why it matters:** Don't try to make the error action smarter — different error types have completely different runner outcomes. The simple-plus-manual-adjust approach matches how real scorers think: "error, then fix up the bases."

---

## AB-006: Double Plays Modeled as 2x Out

**Date:** 2026-03-09 | **Affects:** scoringEngine.js, test data

**Finding:** There's no dedicated "double play" action. Test game encoding (Drillers vs Chiefs) models DPs as two consecutive `out` actions.

**Limitation:** This overcounts pitches by 1 per DP (each `out` has `isPitch: true`, but a DP is one pitch resulting in two outs).

**Decision:** Accept the pitch count overcount for now. A proper DP action would need:
- 2 outs from 1 pitch
- Runner removal logic (which runners were put out)
- This belongs in the Advanced Scorer's future play types

**Why it matters:** Test pitch counts include this overcount. If you add a DP action, update the test expectations.

---

## AB-007: Fielder's Choice Always Records an Out

**Date:** 2026-03-09 | **Affects:** scoringEngine.js (fc action)

**Finding:** In real baseball, a fielder's choice can result in no out (e.g., fielder throws to a base but runner is safe). Our FC action always records an out + puts batter on 1st.

**Limitation:** FC-without-out cannot be modeled. Scorer must use `toggle_*` and manual adjustments instead.

**Decision:** Accept this limitation. The common case (FC with an out) is correctly modeled. The uncommon case (FC, everyone safe) is better handled by the scorer using manual toggles than by adding a complex "FC result" sub-workflow.

---

## AB-008: Simple vs Advanced Scoring Mode Split

**Date:** 2026-03-09 | **Affects:** GameCreationForm.jsx, ManualScoreController.jsx, GameList.jsx

**Finding:** The ManualScoreController was growing complex with E/HBP/FC/SAC buttons. A parent or volunteer just keeping the scoreboard right for a livestream doesn't need these — they just need Ball/Strike/Foul/Out/Hits and manual toggles.

**Decision:** `scoringMode` field on the game document (`"simple"` default, `"advanced"` opt-in):
- **Simple:** Ball/Strike/Foul/Out + Hits (1B/2B/3B/HR) + runner toggles + score +/- + undo/redo
- **Advanced:** All of Simple plus E/HBP/FC/SAC buttons (and future: player tracking, pitch types, scorebook)

The mode is set at game creation but can be switched mid-game (no data loss — events are preserved regardless of mode). Both modes write to the same Firestore doc and overlay.

**Why it matters:** All new Advanced-mode-only features should be gated behind `scoringMode === "advanced"`. Don't add complexity to Simple mode — its value is being lean.

---

## AB-009: Sac Fly Only Scores Runner from 3rd

**Date:** 2026-03-09 | **Affects:** scoringEngine.js (sac_fly action)

**Finding:** In real baseball, a sac fly can potentially advance other runners (tag-up from 2nd, etc.). Our implementation only scores the runner from 3rd and records an out.

**Decision:** Keep it simple. If a runner tags from 2nd on a sac fly, the scorer manually toggles the runner. The sac_fly action handles the most common case (runner on 3rd scores on a fly out).

**Why it matters:** Same philosophy as AB-005 (errors) and AB-007 (FC) — handle the common case in the action, use manual adjustments for edge cases.

---

## AB-010: score_home / score_away for Manual Score Adjustment

**Date:** 2026-03-09 | **Affects:** scoringEngine.js

**Finding:** Auto-advancement logic doesn't cover all cases. Example: runner on 2nd scores on a single (our engine only advances 2nd→3rd). The scorer needs a way to add the missing run.

**Decision:** `score_home` and `score_away` actions simply increment the score by 1. Used alongside runner toggles to fix up any state the auto-advance missed.

**Why it matters:** These are escape hatches. They don't record events with full play detail — they're intentionally simple. If you see a lot of `score_home`/`score_away` in a game's events, it means the auto-advance logic has gaps the scorer had to compensate for.

---

## AB-011: Soft-Delete Undo Preserves Full Audit Trail

**Date:** 2026-03-09 | **Affects:** useGameEvents.js

**Finding:** Undo could either delete events from Firestore or mark them as undone.

**Decision:** Soft-delete: undone events get `undone: true` flag. The event remains in Firestore and in the local events array. Pitch count adjusts (decrements on undo, increments on redo).

**Why it matters:** The full event trail is preserved for debugging and future audit features. EventLog shows undone events with strikethrough styling. If you build stats computation, filter out `undone: true` events.
