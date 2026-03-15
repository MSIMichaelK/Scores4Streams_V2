import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GameList = () => {
  const [games, setGames] = useState([]);
  const { user, tenantId, roles } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    if (!user || !tenantId) return;

    // Query by teamId (new field) — falls back to tenantId for old games via composite index
    const q = query(collection(db, "games"), where("teamId", "==", tenantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesData);
    });

    return () => unsubscribe();
  }, [user, tenantId]);

  const canScore = roles?.some(r => r === "admin" || r === "scorer");

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "TBD";
    }
  };

  return (
    <div>
      <h3>Games</h3>
      {games.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No games yet. Create one above.</p>
      ) : (
        <ul className="game-list">
          {games.map(game => (
            <li key={game.id}>
              <div className="game-info">
                <div className="game-teams">
                  {game.homeTeamName} vs {game.awayTeamName}
                  <span className={`mode-tag ${game.scoringMode || "simple"}`}>
                    {(game.scoringMode || "simple") === "simple" ? "Simple" : "Advanced"}
                  </span>
                </div>
                <div className="game-time">{formatDate(game.scheduledStart)}</div>
              </div>
              {canScore && (
                <button
                  className="btn-score"
                  onClick={() => navigate(`/manual/${game.id}`)}
                >
                  Score
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GameList;
