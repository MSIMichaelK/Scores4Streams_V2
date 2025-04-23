import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GameList = () => {
  const [games, setGames] = useState([]);
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    if (!user || !tenantId) return;

    const q = query(collection(db, "games"), where("tenantId", "==", tenantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesData);
    });

    return () => unsubscribe();
  }, [user, tenantId]);

  return (
    <div>
      <h3>Scheduled Games</h3>
      {games.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <ul>
          {games.map(game => (
            <li key={game.id}>
              {game.homeTeamName} vs {game.awayTeamName} — {new Date(game.scheduledStart.seconds * 1000).toLocaleString()}
              <button onClick={() => navigate(`/manual/${game.id}`)}>Score Game</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GameList;
