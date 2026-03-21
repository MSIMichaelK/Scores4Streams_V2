import { useState } from "react";
import { collection, addDoc, Timestamp, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Format a Date as a datetime-local value string (YYYY-MM-DDTHH:MM) */
const toLocalDatetime = (date) => {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}`;
};

const GameCreationForm = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState(() => toLocalDatetime(new Date()));
  const [leagueName, setLeagueName] = useState("");
  const [scoringMode, setScoringMode] = useState("simple");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, tenantId, roles } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  // Still resolving claims — show loading
  if (!user || !tenantId) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Loading game creation...
      </div>
    );
  }

  // User has no create permissions
  if (!roles?.some(r => r === "admin" || r === "scorer")) {
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
    <form onSubmit={handleSubmit} className="create-game-form" data-testid="game-creation-form">
      <h3>New Game</h3>
      {error && <div className="error-message" data-testid="gcf-error">{error}</div>}
      <label>
        Home Team
        <input
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          placeholder="e.g. Thunder"
          data-testid="gcf-input-home-team"
        />
      </label>
      <label>
        Away Team
        <input
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          placeholder="e.g. Lightning"
          data-testid="gcf-input-away-team"
        />
      </label>
      <label>
        Start Time
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            data-testid="gcf-input-start-time"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn-small btn-secondary"
            onClick={() => setStartTime(toLocalDatetime(new Date()))}
            data-testid="gcf-btn-now"
            style={{ whiteSpace: "nowrap" }}
          >
            Now
          </button>
        </div>
      </label>
      <label>
        League
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="e.g. Metro Softball"
          data-testid="gcf-input-league"
        />
      </label>
      <div className="scoring-mode-selector">
        <span className="scoring-mode-label">Scoring Mode</span>
        <div className="scoring-mode-options">
          <button
            type="button"
            className={`scoring-mode-btn ${scoringMode === "simple" ? "active" : ""}`}
            onClick={() => setScoringMode("simple")}
            data-testid="gcf-mode-simple"
          >
            Simple
          </button>
          <button
            type="button"
            className={`scoring-mode-btn ${scoringMode === "advanced" ? "active" : ""}`}
            onClick={() => setScoringMode("advanced")}
            data-testid="gcf-mode-advanced"
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
      <button type="submit" disabled={submitting} data-testid="gcf-btn-create">
        {submitting ? "Creating..." : "Create Game"}
      </button>
    </form>
  );
};

export default GameCreationForm;
