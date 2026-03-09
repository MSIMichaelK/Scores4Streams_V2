import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import useGameEvents from "../hooks/useGameEvents";
import EventLog from "./EventLog";

const ManualScoreController = ({ gameId }) => {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runners, setRunners] = useState({ first: false, second: false, third: false });
  const [inning, setInning] = useState(1);
  const [isTop, setIsTop] = useState(true);
  const [homeTeamName, setHomeTeamName] = useState("Home");
  const [awayTeamName, setAwayTeamName] = useState("Away");
  const [scoringMode, setScoringMode] = useState("simple");

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [changeHighlight, setChangeHighlight] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  /** Snapshot of current game state (called before changes for event recording) */
  const getGameState = () => ({
    homeScore,
    awayScore,
    balls,
    strikes,
    outs,
    runners: { ...runners },
    inning,
    isTop,
  });

  // Load initial game state and events from Firestore
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;
      try {
        const db = getFirestore();
        const gameSnap = await getDoc(doc(db, "games", gameId));
        if (gameSnap.exists()) {
          const data = gameSnap.data();
          setHomeScore(data.homeScore ?? 0);
          setAwayScore(data.awayScore ?? 0);
          setBalls(data.balls ?? 0);
          setStrikes(data.strikes ?? 0);
          setOuts(data.outs ?? 0);
          setRunners(data.runners ?? { first: false, second: false, third: false });
          setInning(data.inning ?? 1);
          setIsTop(data.isTop ?? true);
          setHomeTeamName(data.homeTeamName || "Home");
          setAwayTeamName(data.awayTeamName || "Away");
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

  const flashHighlight = (message) => {
    setChangeHighlight(message);
    setTimeout(() => setChangeHighlight(""), 1500);
  };

  const saveSnapshot = () => {
    const snapshot = { homeScore, awayScore, balls, strikes, outs, runners, inning, isTop };
    setUndoStack(prev => [snapshot, ...prev].slice(0, 10));
    setRedoStack([]);
  };

  const addRun = () => {
    if (isTop) {
      setAwayScore(prev => prev + 1);
    } else {
      setHomeScore(prev => prev + 1);
    }
  };

  const changeSides = () => {
    setOuts(0);
    setBalls(0);
    setStrikes(0);
    setRunners({ first: false, second: false, third: false });
    if (isTop) {
      setIsTop(false);
    } else {
      setIsTop(true);
      setInning(prev => prev + 1);
    }
    flashHighlight("Side retired");
  };

  const recordOut = () => {
    const newOuts = outs + 1;
    if (newOuts >= 3) {
      changeSides();
    } else {
      setOuts(newOuts);
    }
    setBalls(0);
    setStrikes(0);
  };

  const toggleRunner = (base) => {
    saveSnapshot();
    const wasOn = runners[base];
    const baseLabel = base === "first" ? "1B" : base === "second" ? "2B" : "3B";
    recordEvent(
      {
        type: "runner_toggle",
        subType: base,
        isPitch: false,
        resultedInOut: false,
        runsScored: 0,
        description: `Runner ${wasOn ? "off" : "on"} ${baseLabel}`,
      },
      getGameState()
    );
    setRunners((prev) => ({ ...prev, [base]: !prev[base] }));
  };

  // Save aggregate state to Firestore + commit pending events
  useEffect(() => {
    if (loading) return;
    const saveToFirestore = async () => {
      if (!user || !tenantId || !gameId) return;
      try {
        const db = getFirestore();
        await setDoc(
          doc(db, "games", gameId),
          {
            homeScore, awayScore, balls, strikes, outs, runners,
            inning, isTop, pitchCount,
            scorerTeamId: tenantId,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
        await commitEvents({
          homeScore, awayScore, balls, strikes, outs,
          runners, inning, isTop,
        });
      } catch (err) {
        setError("Failed to save - check your connection");
      }
    };
    saveToFirestore();
  }, [homeScore, awayScore, balls, strikes, outs, runners, inning, isTop, pitchCount]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[0];
    setUndoStack(prev => prev.slice(1));
    setRedoStack(prev => [{ homeScore, awayScore, balls, strikes, outs, runners, inning, isTop }, ...prev].slice(0, 10));
    setHomeScore(previous.homeScore);
    setAwayScore(previous.awayScore);
    setBalls(previous.balls);
    setStrikes(previous.strikes);
    setOuts(previous.outs);
    setRunners(previous.runners);
    setInning(previous.inning);
    setIsTop(previous.isTop);
    undoLastEvent();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [{ homeScore, awayScore, balls, strikes, outs, runners, inning, isTop }, ...prev].slice(0, 10));
    setHomeScore(next.homeScore);
    setAwayScore(next.awayScore);
    setBalls(next.balls);
    setStrikes(next.strikes);
    setOuts(next.outs);
    setRunners(next.runners);
    setInning(next.inning);
    setIsTop(next.isTop);
    redoLastEvent();
  };

  // --- Action Handlers ---

  const handleBall = () => {
    saveSnapshot();
    const newBalls = balls + 1;
    if (newBalls >= 4) {
      // Force-advance: only runners in continuous chain from 1st (same as HBP, AB-004)
      const was = { ...runners };
      let runsScored = 0;
      if (was.first) {
        if (was.second) {
          if (was.third) {
            addRun();
            runsScored++;
          }
        }
      }
      const updated = { ...runners };
      if (was.first) {
        if (was.second) {
          updated.third = true;
        }
        updated.second = true;
      }
      updated.first = true;
      recordEvent(
        {
          type: "walk",
          isPitch: true,
          resultedInOut: false,
          runsScored,
          description: runsScored > 0 ? `Walk - ${runsScored} run scored` : "Walk",
        },
        getGameState()
      );
      flashHighlight("Walk");
      setRunners(updated);
      setBalls(0);
      setStrikes(0);
    } else {
      recordEvent(
        {
          type: "ball",
          isPitch: true,
          resultedInOut: false,
          runsScored: 0,
          description: `Ball (${newBalls}-${strikes})`,
        },
        getGameState()
      );
      setBalls(newBalls);
    }
  };

  const handleStrike = () => {
    saveSnapshot();
    const newStrikes = strikes + 1;
    if (newStrikes >= 3) {
      recordEvent(
        {
          type: "strikeout",
          isPitch: true,
          resultedInOut: true,
          runsScored: 0,
          description: "Strikeout",
        },
        getGameState()
      );
      flashHighlight("Strikeout");
      recordOut();
    } else {
      recordEvent(
        {
          type: "strike",
          isPitch: true,
          resultedInOut: false,
          runsScored: 0,
          description: `Strike (${balls}-${newStrikes})`,
        },
        getGameState()
      );
      setStrikes(newStrikes);
    }
  };

  const handleFoul = () => {
    saveSnapshot();
    if (strikes < 2) {
      recordEvent(
        {
          type: "foul",
          isPitch: true,
          resultedInOut: false,
          runsScored: 0,
          description: `Foul (${balls}-${strikes + 1})`,
        },
        getGameState()
      );
      setStrikes(strikes + 1);
    } else {
      // With 2 strikes, foul doesn't change the count
      recordEvent(
        {
          type: "foul",
          isPitch: true,
          resultedInOut: false,
          runsScored: 0,
          description: `Foul (${balls}-2)`,
        },
        getGameState()
      );
    }
  };

  const handleOut = () => {
    saveSnapshot();
    recordEvent(
      {
        type: "out",
        isPitch: true,
        resultedInOut: true,
        runsScored: 0,
        description: "Out",
      },
      getGameState()
    );
    recordOut();
  };

  const handleHit = (type) => {
    saveSnapshot();
    flashHighlight(`${type}!`);
    const updated = { ...runners };
    let runsScored = 0;

    if (type === "Single") {
      if (runners.third) { addRun(); runsScored++; }
      updated.third = runners.second;
      updated.second = runners.first;
      updated.first = true;
    } else if (type === "Double") {
      if (runners.third) { addRun(); runsScored++; }
      if (runners.second) { addRun(); runsScored++; }
      updated.third = runners.first;
      updated.second = true;
      updated.first = false;
    } else if (type === "Triple") {
      if (runners.third) { addRun(); runsScored++; }
      if (runners.second) { addRun(); runsScored++; }
      if (runners.first) { addRun(); runsScored++; }
      updated.third = true;
      updated.second = false;
      updated.first = false;
    } else if (type === "Home Run") {
      runsScored = 1;
      if (runners.first) runsScored++;
      if (runners.second) runsScored++;
      if (runners.third) runsScored++;
      for (let i = 0; i < runsScored; i++) addRun();
      updated.first = false;
      updated.second = false;
      updated.third = false;
    }

    recordEvent(
      {
        type: "hit",
        subType: type,
        isPitch: true,
        resultedInOut: false,
        runsScored,
        description:
          runsScored > 0
            ? `${type} - ${runsScored} run${runsScored > 1 ? "s" : ""} scored`
            : type,
      },
      getGameState()
    );

    setRunners(updated);
    setBalls(0);
    setStrikes(0);
  };

  // Score adjust handlers (manual +/- buttons)
  const handleScoreAdjust = (team, delta) => {
    saveSnapshot();
    const teamName = team === "away" ? awayTeamName : homeTeamName;
    recordEvent(
      {
        type: "score_adjust",
        subType: `${delta > 0 ? "+" : ""}${delta}`,
        isPitch: false,
        resultedInOut: false,
        runsScored: delta,
        description: `${teamName} ${delta > 0 ? "+" : ""}${delta}`,
      },
      getGameState()
    );
    if (team === "away") {
      setAwayScore((prev) => Math.max(0, prev + delta));
    } else {
      setHomeScore((prev) => Math.max(0, prev + delta));
    }
  };

  // --- New Play Actions ---

  const handleError = () => {
    saveSnapshot();
    flashHighlight("Error!");
    const updated = { ...runners };
    let runsScored = 0;
    if (runners.third) { addRun(); runsScored++; }
    updated.third = runners.second;
    updated.second = runners.first;
    updated.first = true;
    recordEvent(
      {
        type: "error",
        isPitch: true,
        resultedInOut: false,
        runsScored,
        description: runsScored > 0 ? `Error - ${runsScored} run scored` : "Error",
      },
      getGameState()
    );
    setRunners(updated);
    setBalls(0);
    setStrikes(0);
  };

  const handleHBP = () => {
    saveSnapshot();
    flashHighlight("HBP");
    const was = { ...runners };
    let runsScored = 0;
    // Force-advance: only runners in continuous chain from 1st
    if (was.first) {
      if (was.second) {
        if (was.third) {
          addRun();
          runsScored++;
        }
      }
    }
    const updated = { ...runners };
    if (was.first) {
      if (was.second) {
        updated.third = true;
      }
      updated.second = true;
    }
    updated.first = true;
    recordEvent(
      {
        type: "hbp",
        isPitch: true,
        resultedInOut: false,
        runsScored,
        description: runsScored > 0 ? `HBP - ${runsScored} run scored` : "HBP",
      },
      getGameState()
    );
    setRunners(updated);
    setBalls(0);
    setStrikes(0);
  };

  const handleFieldersChoice = () => {
    saveSnapshot();
    flashHighlight("FC");
    recordEvent(
      {
        type: "fc",
        isPitch: true,
        resultedInOut: true,
        runsScored: 0,
        description: "Fielder's Choice",
      },
      getGameState()
    );
    const newOuts = outs + 1;
    if (newOuts >= 3) {
      changeSides();
    } else {
      setOuts(newOuts);
      setRunners((prev) => ({ ...prev, first: true }));
    }
    setBalls(0);
    setStrikes(0);
  };

  const handleSacFly = () => {
    saveSnapshot();
    flashHighlight("Sac Fly");
    let runsScored = 0;
    if (runners.third) {
      addRun();
      runsScored++;
    }
    recordEvent(
      {
        type: "sac_fly",
        isPitch: true,
        resultedInOut: true,
        runsScored,
        description: runsScored > 0 ? `Sac Fly - ${runsScored} run scored` : "Sac Fly",
      },
      getGameState()
    );
    const newOuts = outs + 1;
    if (newOuts >= 3) {
      changeSides();
    } else {
      setOuts(newOuts);
      setRunners((prev) => ({ ...prev, third: false }));
    }
    setBalls(0);
    setStrikes(0);
  };

  if (loading) {
    return <div className="loading-page">Loading game...</div>;
  }

  // Determine which team is batting
  const battingTeam = isTop ? "away" : "home";

  return (
    <div className="scorer">
      {/* Mode badge */}
      <div className="scoring-mode-badge">
        <span className={`mode-tag ${scoringMode}`}>
          {scoringMode === "simple" ? "Simple" : "Advanced"}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className={`scoreboard-team ${battingTeam === "away" ? "batting" : ""}`}>
          <div className="team-label">Away</div>
          <div className="team-name">{awayTeamName}</div>
          <div className="team-score">{awayScore}</div>
        </div>
        <div className="scoreboard-divider">
          <div className="inning-display">
            <div className="inning-half">{isTop ? "\u25B2" : "\u25BC"}</div>
            <div className="inning-number">{inning}</div>
          </div>
        </div>
        <div className={`scoreboard-team ${battingTeam === "home" ? "batting" : ""}`}>
          <div className="team-label">Home</div>
          <div className="team-name">{homeTeamName}</div>
          <div className="team-score">{homeScore}</div>
        </div>
      </div>

      {/* Score adjust buttons */}
      <div className="score-adjust">
        <div className="score-adjust-group">
          <span>{awayTeamName}</span>
          <button onClick={() => handleScoreAdjust("away", -1)}>-</button>
          <button onClick={() => handleScoreAdjust("away", 1)}>+</button>
        </div>
        <div className="score-adjust-group">
          <span>{homeTeamName}</span>
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
              <div key={i} className={`bso-dot ball ${i < balls ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group">
          <div className="bso-label">Strikes</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot strike ${i < strikes ? "active" : ""}`} />
            ))}
          </div>
        </div>
        <div className="bso-group">
          <div className="bso-label">Outs</div>
          <div className="bso-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`bso-dot out ${i < outs ? "active" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Base Diamond */}
      <div className="diamond-container">
        <div className="diamond">
          <div
            className={`base base-second ${runners.second ? "occupied" : ""}`}
            onClick={() => toggleRunner("second")}
          />
          <div
            className={`base base-third ${runners.third ? "occupied" : ""}`}
            onClick={() => toggleRunner("third")}
          />
          <div
            className={`base base-first ${runners.first ? "occupied" : ""}`}
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
          <button className="action-btn out" onClick={handleOut}>Out</button>
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

      {/* Other Plays (Advanced mode only) */}
      {scoringMode === "advanced" && (
        <div className="action-section">
          <h3>Plays</h3>
          <div className="action-grid action-grid-4">
            <button className="action-btn error" onClick={handleError}>E</button>
            <button className="action-btn hbp" onClick={handleHBP}>HBP</button>
            <button className="action-btn fc" onClick={handleFieldersChoice}>FC</button>
            <button className="action-btn sacfly" onClick={handleSacFly}>SAC</button>
          </div>
        </div>
      )}

      {/* Event Log */}
      <div className="action-section">
        <EventLog events={events} />
      </div>

      {/* Undo / Redo */}
      <div className="undo-redo-bar">
        <button onClick={handleUndo} disabled={undoStack.length === 0}>
          Undo ({undoStack.length})
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo ({redoStack.length})
        </button>
      </div>
    </div>
  );
};

export default ManualScoreController;
