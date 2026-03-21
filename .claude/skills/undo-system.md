---
name: undo-system
description: "Use when modifying undo/redo behavior, soft-delete event flags, undone event filtering, pitch count adjustment on undo, undo/redo stacks in useGameState, or event trail preservation"
---

# Undo System Navigator

Undo uses soft-delete (`undone: true` flag) to preserve the full audit trail. Both `useGameState` (game state undo/redo) and `useGameEvents` (event undo/redo) must stay in sync.

## Key Files

| File | Role |
|------|------|
| `src/hooks/useGameEvents.js` | Event-level undo/redo: soft-delete flag, pitch count adjustment |
| `src/hooks/useGameState.js` | State-level undo/redo: action stacks, state snapshots |
| `src/components/ManualScoreController.jsx` | Undo/redo button handlers, coordinates both hooks |
| `src/components/EventLog.jsx` | Displays undone events with strikethrough styling |

## As-Built Decisions

- **AB-011 (soft-delete):** Undone events get `undone: true` flag. Events remain in Firestore and local array. Never hard-delete events.
- Pitch count adjusts: decrements on undo, increments on redo.
- EventLog shows undone events with strikethrough — the trail is visible.

## How Undo Works

1. User taps Undo
2. `useGameState` pops the last action from its undo stack, restores previous state snapshot, pushes to redo stack
3. `useGameEvents` marks the last event(s) as `undone: true`, adjusts pitch count
4. Firestore sync writes updated aggregate state + updated event flags
5. Redo reverses: clears `undone` flag, restores state, adjusts pitch count back

## Open Assumptions

- None directly.

## Related Closed Issues

- **#27** Runner move UX (undo/redo of runner_move tested in E2E)
- **#45** E2E testing framework (includes undo/redo E2E tests)

## Regression Risks

1. **Soft-delete only** — never hard-delete events from Firestore. The audit trail is a feature.
2. **Pitch count sync** — undo must decrement pitch count for `isPitch: true` events, redo must increment. If these drift, pitch count becomes wrong.
3. **State/event undo mismatch** — `useGameState` and `useGameEvents` must undo the same action. If one undoes but the other doesn't, state diverges from event stream.
4. **Stats filtering** — `computeGameStats` filters `undone: true` events. If you add a new stats consumer, it must also filter undone events.
5. **Multi-event actions** — some actions (like DP modeled as 2x out in legacy encoding) produce multiple events. Undo must handle all events from one logical action.
