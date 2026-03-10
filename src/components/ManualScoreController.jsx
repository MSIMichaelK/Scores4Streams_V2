import { useState, useEffect, useCallback } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import useGameEvents from "../hooks/useGameEvents";
import useGameState from "../hooks/useGameState";
import { applyAction } from "../utils/scoringEngine";
import { getCurrentBatter, getCurrentPitcher } from "../utils/rosterHelpers";
import EventLog from "./EventLog";
import FielderPickerModal from "./FielderPickerModal";
import RunnerPickerModal from "./RunnerPickerModal";
import LineupEditor from "./LineupEditor";

const ManualScoreController = ({ gameId }) => {
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
  const [outExpanded, setOutExpanded] = useState(false); // Out sub-menu
  const [morePlays, setMorePlays] = useState(false); // More Plays toggle
  const [lineupEditor, setLineupEditor] = useState(null); // "home" | "away" | null

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
            scorerTeamId: tenantId,
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

  const toggleRunner = (base) => {
    handleAction({ type: "runner_toggle", base });
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
        roster={existingRoster}
        onSave={handleLineupSave}
        onCancel={() => setLineupEditor(null)}
      />
    );
  }

  // Pre-game lineup flow (Advanced mode, no rosters yet, no events recorded)
  const needsLineup = scoringMode === "advanced"
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
              setScoringMode("advanced");
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
    <div className="scorer">
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

      {/* Mode badge + Lineups button */}
      <div className="scoring-mode-badge">
        <span className={`mode-tag ${scoringMode}`}>
          {scoringMode === "simple" ? "Simple" : "Advanced"}
        </span>
        {scoringMode === "advanced" && (
          <button
            className="lineup-edit-btn"
            onClick={() => setLineupEditor(battingTeam === "away" ? "away" : "home")}
          >
            Lineups
          </button>
        )}
      </div>

      {/* Current matchup (Advanced mode with rosters) */}
      {scoringMode === "advanced" && currentBatter && (
        <div className="matchup-display">
          <div className="matchup-batter">
            <span className="matchup-label">AB</span>
            <span className="matchup-name">
              #{currentBatter.number} {currentBatter.name}
            </span>
          </div>
          {currentPitcher && (
            <div className="matchup-pitcher">
              <span className="matchup-label">P</span>
              <span className="matchup-name">
                #{currentPitcher.number} {currentPitcher.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className={`scoreboard-team ${battingTeam === "away" ? "batting" : ""}`}>
          <div className="team-label">Away</div>
          <div className="team-name">{state.awayTeamName}</div>
          <div className="team-score">{state.awayScore}</div>
        </div>
        <div className="scoreboard-divider">
          <div className="inning-display">
            <div className="inning-half">{state.isTop ? "\u25B2" : "\u25BC"}</div>
            <div className="inning-number">{state.inning}</div>
          </div>
        </div>
        <div className={`scoreboard-team ${battingTeam === "home" ? "batting" : ""}`}>
          <div className="team-label">Home</div>
          <div className="team-name">{state.homeTeamName}</div>
          <div className="team-score">{state.homeScore}</div>
        </div>
      </div>

      {/* Score adjust buttons */}
      <div className="score-adjust">
        <div className="score-adjust-group">
          <span>{state.awayTeamName}</span>
          <button onClick={() => handleScoreAdjust("away", -1)}>-</button>
          <button onClick={() => handleScoreAdjust("away", 1)}>+</button>
        </div>
        <div className="score-adjust-group">
          <span>{state.homeTeamName}</span>
          <button onClick={() => handleScoreAdjust("home", -1)}>-</button>
          <button onClick={() => handleScoreAdjust("home", 1)}>+</button>
        </div>
      </div>

      {/* Pitch count */}
      <div className="pitch-count">
        Pitches: {pitchCount}
      </div>

      {/* Flash message */}
      {changeHighlight && (
        <div className="flash-message">{changeHighlight}</div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* BSO Indicators */}
      <div className="bso-section">
        <div className="bso-group">
          <div className="bso-label">Balls</div>
          <div className="bso-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`bso-dot ball ${i < state.balls ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group">
          <div className="bso-label">Strikes</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot strike ${i < state.strikes ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group">
          <div className="bso-label">Outs</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot out ${i < state.outs ? "active" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Base Diamond */}
      <div className="diamond-container">
        <div className="diamond">
          <div
            className={`base base-second ${state.runners.second ? "occupied" : ""}`}
            onClick={() => toggleRunner("second")}
          />
          <div
            className={`base base-third ${state.runners.third ? "occupied" : ""}`}
            onClick={() => toggleRunner("third")}
          />
          <div
            className={`base base-first ${state.runners.first ? "occupied" : ""}`}
            onClick={() => toggleRunner("first")}
          />
          <div className="base base-home" />
        </div>
      </div>

      {/* Count Actions */}
      <div className="action-section">
        <h3>Count</h3>
        <div className="action-grid action-grid-4">
          <button className="action-btn ball" onClick={handleBall}>Ball</button>
          <button className="action-btn strike" onClick={handleStrike}>Strike</button>
          <button className="action-btn foul" onClick={handleFoul}>Foul</button>
          <button
            className={`action-btn out ${outExpanded ? "expanded" : ""}`}
            onClick={scoringMode === "advanced"
              ? () => setOutExpanded((p) => !p)
              : handleOut
            }
          >
            {scoringMode === "advanced" ? (outExpanded ? "Out \u25B2" : "Out \u25BC") : "Out"}
          </button>
        </div>
      </div>

      {/* Hit Actions */}
      <div className="action-section">
        <h3>Hits</h3>
        <div className="action-grid action-grid-4">
          <button className="action-btn hit" onClick={() => handleHit("Single")}>1B</button>
          <button className="action-btn hit" onClick={() => handleHit("Double")}>2B</button>
          <button className="action-btn hit" onClick={() => handleHit("Triple")}>3B</button>
          <button className="action-btn hr" onClick={() => handleHit("Home Run")}>HR</button>
        </div>
      </div>

      {/* Plays (Advanced mode only) */}
      {scoringMode === "advanced" && (
        <>
          {/* Fielding Plays */}
          <div className="action-section">
            <h3>Plays</h3>
            <div className="action-grid action-grid-4">
              <button className="action-btn error" onClick={() => openFielderPicker("error", "Error")}>E</button>
              <button className="action-btn hbp" onClick={() => handleAction("hbp")}>HBP</button>
              <button className="action-btn fc" onClick={() => openFielderPicker("fc", "Fielder's Choice")}>FC</button>
              <button className="action-btn sacfly" onClick={() => handleAction("sac_fly")}>SAC-F</button>
            </div>
          </div>

          {/* Out sub-menu — expands inline from the Out button */}
          {outExpanded && (
            <div className="action-section expandable-section">
              <div className="action-grid action-grid-4">
                <button className="action-btn out" onClick={() => { openFielderPicker("ground_out", "Ground Out"); setOutExpanded(false); }}>GO</button>
                <button className="action-btn out" onClick={() => { openFielderPicker("fly_out", "Fly Out"); setOutExpanded(false); }}>FO</button>
                <button className="action-btn out" onClick={() => { openFielderPicker("line_drive_out", "Line Drive Out"); setOutExpanded(false); }}>LO</button>
                <button className="action-btn out" onClick={() => { openFielderPicker("popup_out", "Popup Out"); setOutExpanded(false); }}>PO</button>
              </div>
              <div className="action-grid action-grid-4" style={{ marginTop: 8 }}>
                <button className="action-btn out" onClick={() => { openFielderPicker("foul_fly_out", "Foul Fly Out"); setOutExpanded(false); }}>FF</button>
                <button className="action-btn out" onClick={() => { openFielderPicker("infield_fly", "Infield Fly"); setOutExpanded(false); }}>IF</button>
                <button className="action-btn strike" onClick={() => { handleAction({ type: "strikeout_swinging" }); setOutExpanded(false); }}>K</button>
                <button className="action-btn strike" onClick={() => { handleAction({ type: "strikeout_looking" }); setOutExpanded(false); }}>KC</button>
              </div>
              <div className="action-grid action-grid-4" style={{ marginTop: 8 }}>
                <button className="action-btn out" onClick={() => { openFielderPicker("double_play", "Double Play"); setOutExpanded(false); }}>DP</button>
                <button className="action-btn out" onClick={() => { openFielderPicker("triple_play", "Triple Play"); setOutExpanded(false); }}>TP</button>
                <button className="action-btn int" onClick={() => { handleAction({ type: "interference" }); setOutExpanded(false); }}>INT</button>
                <button className="action-btn" onClick={() => { handleOut(); setOutExpanded(false); }}>Out</button>
              </div>
            </div>
          )}

          {/* More Plays toggle — batting variants + base running */}
          <div className="action-section">
            <button
              className="expand-toggle"
              onClick={() => setMorePlays((p) => !p)}
            >
              {morePlays ? "\u25BC" : "\u25B6"} More Plays
            </button>
          </div>

          {morePlays && (
            <>
              {/* Batting Variants */}
              <div className="action-section expandable-section">
                <h3>Batting</h3>
                <div className="action-grid action-grid-4">
                  <button className="action-btn sacbunt" onClick={() => openFielderPicker("sacrifice_bunt", "Sac Bunt")}>SAC-B</button>
                  <button className="action-btn bunt" onClick={() => handleAction({ type: "bunt_hit" })}>BH</button>
                  <button className="action-btn bunt" onClick={() => handleAction({ type: "slap_hit" })}>SL</button>
                  <button className="action-btn d3k" onClick={() => handleAction({ type: "dropped_third_strike" })}>D3K</button>
                </div>
                <div className="action-grid action-grid-3" style={{ marginTop: 8 }}>
                  <button className="action-btn ibb" onClick={() => handleAction({ type: "intentional_walk" })}>IBB</button>
                  <button className="action-btn obs" onClick={() => handleAction({ type: "obstruction" })}>OBS</button>
                  <button className="action-btn obs" onClick={() => handleAction({ type: "illegal_pitch" })}>IP</button>
                </div>
              </div>

              {/* Base Running — only if runners on base */}
              {hasRunners && (
                <div className="action-section expandable-section">
                  <h3>Base Running</h3>
                  <div className="action-grid action-grid-3">
                    <button className="action-btn sb" onClick={() => openRunnerPicker("stolen_base", "Stolen Base")}>SB</button>
                    <button className="action-btn strike" onClick={() => openRunnerPicker("caught_stealing", "Caught Stealing")}>CS</button>
                    <button className="action-btn strike" onClick={() => openRunnerPicker("pick_off", "Pick Off")}>PK</button>
                  </div>
                  <div className="action-grid action-grid-3" style={{ marginTop: 8 }}>
                    <button className="action-btn wp" onClick={() => openRunnerPicker("wild_pitch", "Wild Pitch", true)}>WP</button>
                    <button className="action-btn wp" onClick={() => openRunnerPicker("passed_ball", "Passed Ball", true)}>PB</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Event Log */}
      <div className="action-section">
        <EventLog events={events} />
      </div>

      {/* Undo / Redo */}
      <div className="undo-redo-bar">
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </div>
  );
};

export default ManualScoreController;
