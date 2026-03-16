import { useReducer, useRef, useState, useCallback } from "react";
import { createGameState, applyAction } from "../utils/scoringEngine";
import { getCurrentBatter, updateRunnerIdentity } from "../utils/rosterHelpers";

/**
 * Reducer powered by the scoring engine.
 * All game logic lives in applyAction — this just wraps it in React state.
 * Special action types for roster management bypass the engine.
 */
function gameReducer(state, action) {
  if (action.type === "__RESTORE__") return action.payload;
  if (action.type === "__INIT__") return action.payload;

  // Set lineup (metadata, not a game action)
  if (action.type === "__SET_LINEUP__") {
    const newState = structuredClone(state);
    if (action.team === "home") {
      newState.homeRoster = action.roster;
      if (action.pitcherId) newState.currentHomePitcher = action.pitcherId;
    } else {
      newState.awayRoster = action.roster;
      if (action.pitcherId) newState.currentAwayPitcher = action.pitcherId;
    }
    return newState;
  }

  // Manual batter selection (pinch hitter)
  if (action.type === "__SET_BATTER_INDEX__") {
    const newState = structuredClone(state);
    if (action.team === "home") {
      newState.homeBatterIndex = action.index;
    } else {
      newState.awayBatterIndex = action.index;
    }
    return newState;
  }

  // Normal game action — run through engine + update runner identity
  const newState = structuredClone(state);
  const runnersBefore = { ...newState.runners };
  const identityBefore = { ...newState.runnerIdentity };
  const batterBefore = getCurrentBatter(newState);

  applyAction(newState, action);

  // Update runner identity
  const act = typeof action === "string" ? { type: action } : action;
  if (act.type === "runner_move" && (newState.homeRoster || newState.awayRoster)) {
    // Direct identity transfer — skip heuristic diff
    const movedId = identityBefore[act.from];
    newState.runnerIdentity = { ...identityBefore };
    newState.runnerIdentity[act.from] = null;
    if (act.to !== "home") {
      newState.runnerIdentity[act.to] = movedId;
    }
  } else if (newState.homeRoster || newState.awayRoster) {
    newState.runnerIdentity = updateRunnerIdentity(
      identityBefore,
      runnersBefore,
      newState.runners,
      batterBefore?.id || null
    );
  }

  return newState;
}

/**
 * React hook that makes the scoring engine the single source of truth.
 *
 * Usage:
 *   const { state, dispatch, undo, redo, canUndo, canRedo } = useGameState("Home", "Away");
 *   dispatch("ball");
 *   dispatch({ type: "ground_out", positions: [6, 3] });
 *   undo();
 */
export default function useGameState(homeTeam = "Home", awayTeam = "Away") {
  const [state, dispatch] = useReducer(
    gameReducer,
    { homeTeam, awayTeam },
    ({ homeTeam: h, awayTeam: a }) => createGameState(h, a)
  );

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Ref tracks current state for closures (avoids stale state in callbacks)
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Dispatch a scoring action with undo support.
   * Accepts strings ("ball") or objects ({ type: "ground_out", positions: [6,3] }).
   */
  const dispatchAction = useCallback((action) => {
    setUndoStack((prev) => [stateRef.current, ...prev].slice(0, 20));
    setRedoStack([]);
    dispatch(action);
  }, []);

  /** Restore previous state (undo). */
  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      setRedoStack((r) => [stateRef.current, ...r].slice(0, 20));
      dispatch({ type: "__RESTORE__", payload: prev[0] });
      return prev.slice(1);
    });
  }, []);

  /** Restore next state (redo). */
  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      setUndoStack((u) => [stateRef.current, ...u].slice(0, 20));
      dispatch({ type: "__RESTORE__", payload: prev[0] });
      return prev.slice(1);
    });
  }, []);

  /**
   * Initialize state from Firestore data (on game load).
   * Clears undo/redo stacks.
   */
  const initFromFirestore = useCallback((firestoreData) => {
    const restored = createGameState(
      firestoreData.homeTeamName || homeTeam,
      firestoreData.awayTeamName || awayTeam
    );
    restored.homeScore = firestoreData.homeScore ?? 0;
    restored.awayScore = firestoreData.awayScore ?? 0;
    restored.balls = firestoreData.balls ?? 0;
    restored.strikes = firestoreData.strikes ?? 0;
    restored.outs = firestoreData.outs ?? 0;
    restored.runners = firestoreData.runners ?? { first: false, second: false, third: false };
    restored.inning = firestoreData.inning ?? 1;
    restored.isTop = firestoreData.isTop ?? true;
    restored.pitchCount = firestoreData.pitchCount ?? 0;
    // Phase 3: Roster fields
    restored.homeRoster = firestoreData.homeRoster ?? null;
    restored.awayRoster = firestoreData.awayRoster ?? null;
    restored.homeBatterIndex = firestoreData.homeBatterIndex ?? 0;
    restored.awayBatterIndex = firestoreData.awayBatterIndex ?? 0;
    restored.currentHomePitcher = firestoreData.currentHomePitcher ?? null;
    restored.currentAwayPitcher = firestoreData.currentAwayPitcher ?? null;
    restored.runnerIdentity = firestoreData.runnerIdentity ?? { first: null, second: null, third: null };
    dispatch({ type: "__INIT__", payload: restored });
    setUndoStack([]);
    setRedoStack([]);
  }, [homeTeam, awayTeam]);

  /** Set a team's lineup (roster + starting pitcher). */
  const setLineup = useCallback((team, roster, pitcherId = null) => {
    setUndoStack((prev) => [stateRef.current, ...prev].slice(0, 20));
    setRedoStack([]);
    dispatch({ type: "__SET_LINEUP__", team, roster, pitcherId });
  }, []);

  /** Manually set the current batter index (for pinch hitters). */
  const setBatterIndex = useCallback((team, index) => {
    setUndoStack((prev) => [stateRef.current, ...prev].slice(0, 20));
    setRedoStack([]);
    dispatch({ type: "__SET_BATTER_INDEX__", team, index });
  }, []);

  return {
    state,
    dispatch: dispatchAction,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    initFromFirestore,
    setLineup,
    setBatterIndex,
  };
}
