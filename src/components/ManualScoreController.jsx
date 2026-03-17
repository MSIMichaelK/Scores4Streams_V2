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
  const [selectedRunner, setSelectedRunner] = useState(null); // "first"|"second"|"third"|null
  const [lineupsSkipped, setLineupsSkipped] = useState(false); // Skip lineup entry flow

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

      {/* Flash message — fixed toast overlay */}
      {changeHighlight && (
        <div className="flash-message">{changeHighlight}</div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* ── Compact header: mode + pitch count + lineups ── */}
      <div className="scorer-header">
        <span className={`mode-tag ${scoringMode}`}>
          {scoringMode === "simple" ? "Simple" : "Advanced"}
        </span>
        <span className="pitch-count-inline" data-testid="pitch-count">Pitches: {pitchCount}</span>
        {scoringMode === "advanced" && (
          <button
            className="lineup-edit-btn"
            onClick={() => setLineupEditor(battingTeam === "away" ? "away" : "home")}
            data-testid="btn-lineups"
          >
            Lineups
          </button>
        )}
      </div>

      {/* ── Scoreboard with inline score adjust ── */}
      <div className="scoreboard">
        <div className={`scoreboard-team ${battingTeam === "away" ? "batting" : ""}`}>
          <div className="team-label">Away</div>
          <div className="team-name">{state.awayTeamName}</div>
          <div className="team-score" data-testid="score-away">{state.awayScore}</div>
          <div className="score-adjust-inline">
            <button onClick={() => handleScoreAdjust("away", -1)} data-testid="score-away-minus">-</button>
            <button onClick={() => handleScoreAdjust("away", 1)} data-testid="score-away-plus">+</button>
          </div>
        </div>
        <div className="scoreboard-divider">
          <div className="inning-display" data-testid="inning-display">
            <div className="inning-half">{state.isTop ? "\u25B2" : "\u25BC"}</div>
            <div className="inning-number">{state.inning}</div>
          </div>
        </div>
        <div className={`scoreboard-team ${battingTeam === "home" ? "batting" : ""}`}>
          <div className="team-label">Home</div>
          <div className="team-name">{state.homeTeamName}</div>
          <div className="team-score" data-testid="score-home">{state.homeScore}</div>
          <div className="score-adjust-inline">
            <button onClick={() => handleScoreAdjust("home", -1)} data-testid="score-home-minus">-</button>
            <button onClick={() => handleScoreAdjust("home", 1)} data-testid="score-home-plus">+</button>
          </div>
        </div>
      </div>

      {/* ── Matchup (Advanced mode with rosters) ── */}
      {scoringMode === "advanced" && currentBatter && (
        <div className="matchup-display">
          <div className="matchup-batter" data-testid="matchup-batter">
            <span className="matchup-label">AB</span>
            <span className="matchup-name">
              #{currentBatter.number} {currentBatter.name}
            </span>
          </div>
          {currentPitcher && (
            <div className="matchup-pitcher" data-testid="matchup-pitcher">
              <span className="matchup-label">P</span>
              <span className="matchup-name">
                #{currentPitcher.number} {currentPitcher.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── BSO compact row under scoreboard ── */}
      <div className="bso-row" data-testid="bso-row">
        <div className="bso-group" data-testid="bso-balls" data-count={state.balls}>
          <div className="bso-label">B</div>
          <div className="bso-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`bso-dot ball ${i < state.balls ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group" data-testid="bso-strikes" data-count={state.strikes}>
          <div className="bso-label">S</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot strike ${i < state.strikes ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group" data-testid="bso-outs" data-count={state.outs}>
          <div className="bso-label">O</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot out ${i < state.outs ? "active" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Full field view with fielder positions ── */}
      <BaseballField
        state={state}
        selectedRunner={selectedRunner}
        onBaseTap={handleBaseTap}
        onDeselect={() => setSelectedRunner(null)}
      />

      {/* ── Scoring controls + sidebar wrapper ── */}
      <div className="scoring-main">
        <div className="scoring-controls">
          {/* Count + Hit Actions */}
          <div className="action-section">
            <h3 className="section-heading">Count</h3>
            <div className="action-grid action-grid-4 action-grid-count">
              <button className="action-btn ball" onClick={handleBall} data-testid="btn-ball">Ball</button>
              <button className="action-btn strike" onClick={handleStrike} data-testid="btn-strike">Strike</button>
              <button className="action-btn foul" onClick={handleFoul} data-testid="btn-foul">Foul</button>
              <button
                className={`action-btn out ${outExpanded ? "expanded" : ""}`}
                onClick={scoringMode === "advanced"
                  ? () => setOutExpanded((p) => !p)
                  : handleOut
                }
                data-testid={scoringMode === "advanced" ? "btn-expand-outs" : "btn-out"}
              >
                {scoringMode === "advanced" ? (outExpanded ? "Out \u25B2" : "Out \u25BC") : "Out"}
              </button>
            </div>
          </div>

          <div className="action-section">
            <h3 className="section-heading">Hits</h3>
            <div className="action-grid action-grid-4 action-grid-hits">
              <button className="action-btn hit" onClick={() => handleHit("Single")} data-testid="btn-1b">1B</button>
              <button className="action-btn hit" onClick={() => handleHit("Double")} data-testid="btn-2b">2B</button>
              <button className="action-btn hit" onClick={() => handleHit("Triple")} data-testid="btn-3b">3B</button>
              <button className="action-btn hr" onClick={() => handleHit("Home Run")} data-testid="btn-hr">HR</button>
            </div>
          </div>

          {/* Plays (Advanced mode only) */}
          {scoringMode === "advanced" && (
            <>
              <div className="action-section">
                <h3 className="section-heading">Plays</h3>
                <div className="action-grid action-grid-4">
                  <button className="action-btn error" onClick={() => openFielderPicker("error", "Error")} data-testid="btn-error">E</button>
                  <button className="action-btn hbp" onClick={() => handleAction("hbp")} data-testid="btn-hbp">HBP</button>
                  <button className="action-btn fc" onClick={() => openFielderPicker("fc", "Fielder's Choice")} data-testid="btn-fc">FC</button>
                  <button className="action-btn sacfly" onClick={() => handleAction("sac_fly")} data-testid="btn-sac">SAC-F</button>
                </div>
              </div>

              {outExpanded && (
                <div className="action-section expandable-section">
                  <div className="action-grid action-grid-4">
                    <button className="action-btn out" onClick={() => { openFielderPicker("ground_out", "Ground Out"); setOutExpanded(false); }} data-testid="btn-go">GO</button>
                    <button className="action-btn out" onClick={() => { openFielderPicker("fly_out", "Fly Out"); setOutExpanded(false); }} data-testid="btn-fo">FO</button>
                    <button className="action-btn out" onClick={() => { openFielderPicker("line_drive_out", "Line Drive Out"); setOutExpanded(false); }} data-testid="btn-lo">LO</button>
                    <button className="action-btn out" onClick={() => { openFielderPicker("popup_out", "Popup Out"); setOutExpanded(false); }} data-testid="btn-po">PO</button>
                  </div>
                  <div className="action-grid action-grid-4" style={{ marginTop: 8 }}>
                    <button className="action-btn out" onClick={() => { openFielderPicker("foul_fly_out", "Foul Fly Out"); setOutExpanded(false); }} data-testid="btn-ff">FF</button>
                    <button className="action-btn out" onClick={() => { openFielderPicker("infield_fly", "Infield Fly"); setOutExpanded(false); }} data-testid="btn-if">IF</button>
                    <button className="action-btn strike" onClick={() => { handleAction({ type: "strikeout_swinging" }); setOutExpanded(false); }} data-testid="btn-k">K</button>
                    <button className="action-btn strike" onClick={() => { handleAction({ type: "strikeout_looking" }); setOutExpanded(false); }} data-testid="btn-kc">KC</button>
                  </div>
                  <div className="action-grid action-grid-4" style={{ marginTop: 8 }}>
                    <button className="action-btn out" onClick={() => { openFielderPicker("double_play", "Double Play"); setOutExpanded(false); }} data-testid="btn-dp">DP</button>
                    <button className="action-btn out" onClick={() => { openFielderPicker("triple_play", "Triple Play"); setOutExpanded(false); }} data-testid="btn-tp">TP</button>
                    <button className="action-btn int" onClick={() => { handleAction({ type: "interference" }); setOutExpanded(false); }} data-testid="btn-int">INT</button>
                    <button className="action-btn" onClick={() => { handleOut(); setOutExpanded(false); }} data-testid="btn-out">Out</button>
                  </div>
                </div>
              )}

              <div className="action-section">
                <button
                  className="expand-toggle"
                  onClick={() => setMorePlays((p) => !p)}
                  data-testid="btn-more-plays"
                >
                  {morePlays ? "\u25BC" : "\u25B6"} More Plays
                </button>
              </div>

              {morePlays && (
                <>
                  <div className="action-section expandable-section">
                    <h3 className="section-heading">Batting</h3>
                    <div className="action-grid action-grid-4">
                      <button className="action-btn sacbunt" onClick={() => openFielderPicker("sacrifice_bunt", "Sac Bunt")} data-testid="btn-sac-b">SAC-B</button>
                      <button className="action-btn bunt" onClick={() => handleAction({ type: "bunt_hit" })} data-testid="btn-bh">BH</button>
                      <button className="action-btn bunt" onClick={() => handleAction({ type: "slap_hit" })} data-testid="btn-sl">SL</button>
                      <button className="action-btn d3k" onClick={() => handleAction({ type: "dropped_third_strike" })} data-testid="btn-d3k">D3K</button>
                    </div>
                    <div className="action-grid action-grid-3" style={{ marginTop: 8 }}>
                      <button className="action-btn ibb" onClick={() => handleAction({ type: "intentional_walk" })} data-testid="btn-ibb">IBB</button>
                      <button className="action-btn obs" onClick={() => handleAction({ type: "obstruction" })} data-testid="btn-obs">OBS</button>
                      <button className="action-btn obs" onClick={() => handleAction({ type: "illegal_pitch" })} data-testid="btn-ip">IP</button>
                    </div>
                  </div>

                  {hasRunners && (
                    <div className="action-section expandable-section">
                      <h3 className="section-heading">Base Running</h3>
                      <div className="action-grid action-grid-3">
                        <button className="action-btn sb" onClick={() => openRunnerPicker("stolen_base", "Stolen Base")} data-testid="btn-sb">SB</button>
                        <button className="action-btn strike" onClick={() => openRunnerPicker("caught_stealing", "Caught Stealing")} data-testid="btn-cs">CS</button>
                        <button className="action-btn strike" onClick={() => openRunnerPicker("pick_off", "Pick Off")} data-testid="btn-pk">PK</button>
                      </div>
                      <div className="action-grid action-grid-3" style={{ marginTop: 8 }}>
                        <button className="action-btn wp" onClick={() => openRunnerPicker("wild_pitch", "Wild Pitch", true)} data-testid="btn-wp">WP</button>
                        <button className="action-btn wp" onClick={() => openRunnerPicker("passed_ball", "Passed Ball", true)} data-testid="btn-pb">PB</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Game Stats (phone: in flow; tablet: sidebar) */}
          <div className="action-section scoring-secondary">
            <GameStats
              events={state.events}
              homeRoster={state.homeRoster}
              awayRoster={state.awayRoster}
              homeTeamName={state.homeTeamName}
              awayTeamName={state.awayTeamName}
            />
          </div>
        </div>

        {/* Sidebar — visible on tablet+, hidden on phone */}
        <div className="scoring-sidebar">
          <EventLog events={events} />
        </div>
      </div>

      {/* Event Log — phone only (below controls) */}
      <div className="action-section scoring-eventlog-phone">
        <EventLog events={events} />
      </div>

      {/* Undo / Redo */}
      <div className="undo-redo-bar">
        <button onClick={handleUndo} disabled={!canUndo} data-testid="btn-undo">
          Undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo} data-testid="btn-redo">
          Redo
        </button>
      </div>
    </div>
  );
};

export default ManualScoreController;
