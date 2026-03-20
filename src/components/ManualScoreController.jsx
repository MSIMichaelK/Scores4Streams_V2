import { useState, useEffect, useCallback } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import useGameEvents from "../hooks/useGameEvents";
import useGameState from "../hooks/useGameState";
import { applyAction } from "../utils/scoringEngine";
import { getCurrentBatter, getCurrentPitcher, getPlayerById } from "../utils/rosterHelpers";
import EventLog from "./EventLog";
import GameStats from "./GameStats";
import FielderPickerModal from "./FielderPickerModal";
import RunnerPickerModal from "./RunnerPickerModal";
import LineupEditor from "./LineupEditor";
import BaseballField from "./BaseballField";
import ScoreStrip from "./ScoreStrip";
import ActionBar from "./ActionBar";
import OutcomePanel from "./OutcomePanel";

const ManualScoreController = ({ gameId, onBack }) => {
  // ─── Game state (scoring engine is single source of truth) ───
  const {
    state,
    dispatch,
    undo: engineUndo,
    redo: engineRedo,
    canUndo,
    canRedo,
    initFromFirestore,
    setLineup,
    setBatterIndex,
  } = useGameState();

  // ─── Metadata (not part of game state) ─────────────────────
  const [scoringMode, setScoringMode] = useState("simple");
  const [changeHighlight, setChangeHighlight] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Modal / expand state ──────────────────────────────────
  const [fielderPicker, setFielderPicker] = useState(null); // { actionType, title }
  const [runnerPicker, setRunnerPicker] = useState(null); // { actionType, title, multi }
  const [inPlayOpen, setInPlayOpen] = useState(false); // In Play outcome panel
  const [lineupEditor, setLineupEditor] = useState(null); // "home" | "away" | null
  const [selectedRunner, setSelectedRunner] = useState(null); // "first"|"second"|"third"|null
  const [lineupsSkipped, setLineupsSkipped] = useState(false); // Skip lineup entry flow
  const [eventLogOpen, setEventLogOpen] = useState(false); // Event log drawer

  // ─── Event persistence (Firestore) ─────────────────────────
  const { user, tenantId } = useAuth();
  const {
    events,
    pitchCount,
    recordEvent,
    commitEvents,
    loadEvents,
    undoLastEvent,
    redoLastEvent,
  } = useGameEvents(gameId);

  // ─── Firestore load ────────────────────────────────────────
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;
      try {
        const db = getFirestore();
        const gameSnap = await getDoc(doc(db, "games", gameId));
        if (gameSnap.exists()) {
          const data = gameSnap.data();
          initFromFirestore(data);
          setScoringMode(data.scoringMode || "simple");
        }
        await loadEvents();
      } catch (err) {
        setError("Failed to load game data");
      } finally {
        setLoading(false);
      }
    };
    loadGame();
  }, [gameId]);

  // ─── Firestore sync (aggregate state + events) ─────────────
  useEffect(() => {
    if (loading) return;
    const saveToFirestore = async () => {
      if (!user || !tenantId || !gameId) return;
      try {
        const db = getFirestore();
        // Compute batter/pitcher names for overlay (reads these existing fields)
        const batter = getCurrentBatter(state);
        const pitcher = getCurrentPitcher(state);
        await setDoc(
          doc(db, "games", gameId),
          {
            homeScore: state.homeScore,
            awayScore: state.awayScore,
            balls: state.balls,
            strikes: state.strikes,
            outs: state.outs,
            runners: state.runners,
            inning: state.inning,
            isTop: state.isTop,
            pitchCount: state.pitchCount,
            // Roster fields
            homeRoster: state.homeRoster,
            awayRoster: state.awayRoster,
            homeBatterIndex: state.homeBatterIndex,
            awayBatterIndex: state.awayBatterIndex,
            currentHomePitcher: state.currentHomePitcher,
            currentAwayPitcher: state.currentAwayPitcher,
            runnerIdentity: state.runnerIdentity,
            // Overlay reads these for display
            batterName: batter ? `#${batter.number} ${batter.name}` : "",
            pitcherName: pitcher ? `#${pitcher.number} ${pitcher.name}` : "",
            teamId: tenantId,
            scorerTeamId: tenantId, // backward compat
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
        await commitEvents({
          homeScore: state.homeScore,
          awayScore: state.awayScore,
          balls: state.balls,
          strikes: state.strikes,
          outs: state.outs,
          runners: state.runners,
          inning: state.inning,
          isTop: state.isTop,
        });
      } catch (err) {
        setError("Failed to save - check your connection");
      }
    };
    saveToFirestore();
  }, [
    state.homeScore, state.awayScore, state.balls, state.strikes,
    state.outs, state.runners, state.inning, state.isTop, state.pitchCount,
    state.homeRoster, state.awayRoster, state.homeBatterIndex, state.awayBatterIndex,
    state.currentHomePitcher, state.currentAwayPitcher, state.runnerIdentity,
  ]);

  // ─── Helpers ───────────────────────────────────────────────

  const flashHighlight = (message) => {
    setChangeHighlight(message);
    setTimeout(() => setChangeHighlight(""), 1500);
  };

  const getGameState = useCallback(() => ({
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    balls: state.balls,
    strikes: state.strikes,
    outs: state.outs,
    runners: { ...state.runners },
    inning: state.inning,
    isTop: state.isTop,
  }), [state]);

  const FLASH = {
    walk: "Walk", strikeout: "Strikeout", error: "Error!",
    hbp: "HBP", fc: "FC", sac_fly: "Sac Fly",
    stolen_base: "SB!", caught_stealing: "CS!",
    wild_pitch: "WP", passed_ball: "PB",
    sacrifice_bunt: "Sac Bunt", intentional_walk: "IBB",
    bunt_hit: "Bunt Hit!", slap_hit: "Slap Hit!",
    dropped_third_strike: "D3K", obstruction: "OBS",
    interference: "INT", illegal_pitch: "IP",
  };

  /**
   * Generic action handler: preview → record event → dispatch.
   * Stamps current batter/pitcher IDs on events when rosters are loaded.
   */
  const handleAction = useCallback((action) => {
    setSelectedRunner(null);
    const gameState = getGameState();
    const batter = getCurrentBatter(state);
    const pitcher = getCurrentPitcher(state);
    const preview = structuredClone(state);
    const prevLen = preview.events.length;
    applyAction(preview, action);
    const newEvents = preview.events.slice(prevLen);

    for (const evt of newEvents) {
      recordEvent(evt, gameState, batter?.id || null, pitcher?.id || null);
    }
    dispatch(action);

    if (newEvents.length > 0) {
      const msg = FLASH[newEvents[0].type];
      if (msg) flashHighlight(msg);
    }
  }, [state, getGameState, recordEvent, dispatch]);

  // ─── Simple mode handlers ─────────────────────────────────

  const handleBall = () => handleAction("ball");
  const handleStrike = () => handleAction("strike");
  const handleFoul = () => handleAction("foul");
  const handleOut = () => handleAction("out");

  const handleHit = (type) => {
    const actionMap = {
      "Single": "single", "Double": "double",
      "Triple": "triple", "Home Run": "homerun",
    };
    flashHighlight(`${type}!`);
    handleAction(actionMap[type]);
  };

  const handleBaseTap = (base) => {
    if (selectedRunner) {
      if (base === selectedRunner) {
        // Tap same base = deselect
        setSelectedRunner(null);
      } else if (base === "home") {
        // Tap home = score the runner
        handleAction({ type: "runner_move", from: selectedRunner, to: "home" });
        setSelectedRunner(null);
      } else if (state.runners[base]) {
        // Target occupied = switch selection
        setSelectedRunner(base);
      } else {
        // Target empty = move runner
        handleAction({ type: "runner_move", from: selectedRunner, to: base });
        setSelectedRunner(null);
      }
    } else {
      if (base === "home") {
        // Tap home with no runner selected = no-op
        return;
      }
      if (state.runners[base]) {
        // Tap occupied base = select runner
        setSelectedRunner(base);
      } else {
        // Tap empty base = toggle runner on (existing behaviour)
        handleAction({ type: "runner_toggle", base });
      }
    }
  };

  const handleScoreAdjust = (team, delta) => {
    handleAction({ type: "score_adjust", team, delta });
  };

  // ─── Advanced mode: out types with fielder picker ─────────

  const openFielderPicker = (actionType, title) => {
    setFielderPicker({ actionType, title });
  };

  const handleFielderConfirm = (positions) => {
    const { actionType } = fielderPicker;
    setFielderPicker(null);
    const action = positions
      ? { type: actionType, positions }
      : { type: actionType };
    handleAction(action);
  };

  // ─── Advanced mode: base running with runner picker ───────

  const openRunnerPicker = (actionType, title, multi = false) => {
    setRunnerPicker({ actionType, title, multi });
  };

  const handleRunnerSelect = (runner) => {
    const { actionType } = runnerPicker;
    setRunnerPicker(null);
    handleAction({ type: actionType, runner });
  };

  const handleRunnerMultiSelect = (runners) => {
    const { actionType } = runnerPicker;
    setRunnerPicker(null);
    handleAction({ type: actionType, runners });
  };

  // ─── Undo / Redo ──────────────────────────────────────────

  const handleUndo = () => {
    engineUndo();
    undoLastEvent();
  };

  const handleRedo = () => {
    engineRedo();
    redoLastEvent();
  };

  // ─── Render ────────────────────────────────────────────────

  // ─── Lineup editor save handler ──────────────────────────
  const handleLineupSave = useCallback((roster, pitcherId) => {
    const team = lineupEditor;
    setLineup(team, roster, pitcherId);
    setLineupEditor(null);
  }, [lineupEditor, setLineup]);

  if (loading) {
    return <div className="loading-page">Loading game...</div>;
  }

  // Show lineup editor as full-screen overlay
  if (lineupEditor) {
    const teamName = lineupEditor === "home" ? state.homeTeamName : state.awayTeamName;
    const existingRoster = lineupEditor === "home" ? state.homeRoster : state.awayRoster;
    return (
      <LineupEditor
        teamName={teamName}
        teamId={tenantId}
        roster={existingRoster}
        onSave={handleLineupSave}
        onCancel={() => setLineupEditor(null)}
      />
    );
  }

  // Pre-game lineup flow (Advanced mode, no rosters yet, no events recorded)
  const needsLineup = scoringMode === "advanced"
    && !lineupsSkipped
    && (state.homeRoster === null || state.awayRoster === null)
    && events.length === 0;

  if (needsLineup) {
    return (
      <div className="scorer">
        <div className="scoring-mode-badge">
          <span className="mode-tag advanced">Advanced</span>
        </div>
        <div className="lineup-setup">
          <h2>Set Lineups</h2>
          <p>Enter batting lineups before starting the game.</p>
          <div className="lineup-setup-buttons">
            <button
              className={`lineup-team-btn ${state.awayRoster ? "done" : ""}`}
              onClick={() => setLineupEditor("away")}
            >
              {state.awayRoster ? "\u2713 " : ""}{state.awayTeamName}
            </button>
            <button
              className={`lineup-team-btn ${state.homeRoster ? "done" : ""}`}
              onClick={() => setLineupEditor("home")}
            >
              {state.homeRoster ? "\u2713 " : ""}{state.homeTeamName}
            </button>
          </div>
          {state.homeRoster && state.awayRoster && (
            <button className="lineup-start-btn" onClick={() => {}}>
              Start Game
            </button>
          )}
          <button
            className="lineup-skip-btn"
            onClick={() => {
              // Skip lineup entry — proceed without rosters
              setLineupsSkipped(true);
            }}
          >
            Skip Lineups
          </button>
        </div>
      </div>
    );
  }

  const battingTeam = state.isTop ? "away" : "home";
  const hasRunners = state.runners.first || state.runners.second || state.runners.third;
  const currentBatter = getCurrentBatter(state);
  const currentPitcher = getCurrentPitcher(state);

  return (
    <div className="scorer scorer-fieldcentric">
      {/* Fielder Picker Modal */}
      {fielderPicker && (
        <FielderPickerModal
          title={fielderPicker.title}
          onConfirm={handleFielderConfirm}
          onCancel={() => setFielderPicker(null)}
        />
      )}

      {/* Runner Picker Modal */}
      {runnerPicker && (
        <RunnerPickerModal
          title={runnerPicker.title}
          runners={state.runners}
          onSelect={handleRunnerSelect}
          onCancel={() => setRunnerPicker(null)}
          multiSelect={runnerPicker.multi}
          onMultiSelect={handleRunnerMultiSelect}
        />
      )}

      {/* Flash message — fixed toast overlay */}
      {changeHighlight && (
        <div className="flash-message">{changeHighlight}</div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* ── Score Strip — compact scoreboard + BSO (fixed top) ── */}
      <ScoreStrip
        state={state}
        scoringMode={scoringMode}
        pitchCount={pitchCount}
        battingTeam={battingTeam}
        onScoreAdjust={handleScoreAdjust}
        onEditLineups={() => setLineupEditor(battingTeam === "away" ? "away" : "home")}
        onBack={onBack}
        currentBatter={currentBatter}
        currentPitcher={currentPitcher}
      />

      {/* ── Diamond viewport — fills remaining vertical space ── */}
      <div className="diamond-viewport">
        <BaseballField
          state={state}
          selectedRunner={selectedRunner}
          onBaseTap={handleBaseTap}
          onDeselect={() => setSelectedRunner(null)}
        />

        {/* Floating undo/redo */}
        <button
          className="undo-float"
          onClick={handleUndo}
          disabled={!canUndo}
          data-testid="btn-undo"
        >
          ↩
        </button>
        <button
          className="redo-float"
          onClick={handleRedo}
          disabled={!canRedo}
          data-testid="btn-redo"
        >
          ↪
        </button>

        {/* Event log toggle */}
        <button
          className="log-float"
          onClick={() => setEventLogOpen(p => !p)}
          title="Event log"
        >
          📋
        </button>

        {/* In Play outcome panel — slides up over diamond */}
        {inPlayOpen && (
          <OutcomePanel
            scoringMode={scoringMode}
            hasRunners={hasRunners}
            onHit={handleHit}
            onOut={handleOut}
            onAction={handleAction}
            onOpenFielderPicker={openFielderPicker}
            onOpenRunnerPicker={openRunnerPicker}
            onClose={() => setInPlayOpen(false)}
          />
        )}
      </div>

      {/* ── Action Bar — fixed bottom (6 pitch buttons) ── */}
      <ActionBar
        scoringMode={scoringMode}
        onBall={handleBall}
        onStrike={handleStrike}
        onFoul={handleFoul}
        onOut={handleOut}
        onHBP={() => handleAction("hbp")}
        onInPlay={() => setInPlayOpen(p => !p)}
        inPlayOpen={inPlayOpen}
      />

      {/* Event log drawer */}
      {eventLogOpen && (
        <div className="event-log-drawer">
          <div className="drawer-header">
            <span>Event Log</span>
            <button onClick={() => setEventLogOpen(false)}>✕</button>
          </div>
          <EventLog events={events} />
        </div>
      )}
    </div>
  );
};

export default ManualScoreController;
