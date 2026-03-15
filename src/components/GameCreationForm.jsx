import { useState } from "react";
import { collection, addDoc, Timestamp, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GameCreationForm = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [scoringMode, setScoringMode] = useState("simple");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, tenantId, roles } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  if (!user || !tenantId || !roles?.some(r => r === "admin" || r === "scorer")) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Both team names are required");
      return;
    }
    if (!startTime) {
      setError("Start time is required");
      return;
    }
    if (!leagueName.trim()) {
      setError("League name is required");
      return;
    }

    setSubmitting(true);

    const gameData = {
      homeTeamName: homeTeam.trim(),
      awayTeamName: awayTeam.trim(),
      status: "scheduled",
      createdBy: user.uid,
      teamId: tenantId,     // owning team (real team doc ID)
      tenantId,             // backward compat alias
      homeTeamId: null,     // TODO: team picker in future
      awayTeamId: null,     // TODO: team picker in future
      scheduledStart: Timestamp.fromDate(new Date(startTime)),
      homeScore: 0,
      awayScore: 0,
      inning: 1,
      isTop: true,
      balls: 0,
      strikes: 0,
      outs: 0,
      runners: { first: false, second: false, third: false },
      leagueName: leagueName.trim(),
      gameClock: "",
      pitchCount: 0,
      pitcherName: "",
      batterName: "",
      homeTeamLogoUrl: "",
      awayTeamLogoUrl: "",
      leagueLogoUrl: "",
      scoringMode,
    };

    try {
      const docRef = await addDoc(collection(db, "games"), gameData);
      navigate(`/manual/${docRef.id}`);
    } catch (err) {
      setError("Failed to create game. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-game-form">
      <h3>New Game</h3>
      {error && <div className="error-message">{error}</div>}
      <label>
        Home Team
        <input
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          placeholder="e.g. Thunder"
        />
      </label>
      <label>
        Away Team
        <input
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          placeholder="e.g. Lightning"
        />
      </label>
      <label>
        Start Time
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </label>
      <label>
        League
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="e.g. Metro Softball"
        />
      </label>
      <div className="scoring-mode-selector">
        <span className="scoring-mode-label">Scoring Mode</span>
        <div className="scoring-mode-options">
          <button
            type="button"
            className={`scoring-mode-btn ${scoringMode === "simple" ? "active" : ""}`}
            onClick={() => setScoringMode("simple")}
          >
            Simple
          </button>
          <button
            type="button"
            className={`scoring-mode-btn ${scoringMode === "advanced" ? "active" : ""}`}
            onClick={() => setScoringMode("advanced")}
          >
            Advanced
          </button>
        </div>
        <span className="scoring-mode-hint">
          {scoringMode === "simple"
            ? "Basic scoring — drives the overlay scoreboard"
            : "Detailed plays — for stats and scorebook"}
        </span>
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Game"}
      </button>
    </form>
  );
};

export default GameCreationForm;
