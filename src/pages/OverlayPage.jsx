import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import "../styles/OverlayPage.css";

const OverlayPage = () => {
  const { gameId } = useParams();
  const { app } = useFirebase();
  const db = getFirestore(app);

  const [gameData, setGameData] = useState(null);
  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      }
    });
    return () => unsub();
  }, [db, gameId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!gameData) {
    return <div className="loading">Loading...</div>;
  }

  const {
    homeScore,
    awayScore,
    homeTeamName,
    awayTeamName,
    balls,
    strikes,
    outs,
    isTop,
    inning,
    runners,
  } = gameData;

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="overlay-container">
      <div className="league-header">
        <img src="/league-logo.png" alt="League Logo" className="league-logo" />
        <div className="league-name">League Name</div>
      </div>

      <div className="teams-section">
        <div className="team home-team">
          <img src="/home-logo.png" alt="Home Logo" className="team-logo" />
          <div className="team-name">{homeTeamName || "Home"}</div>
          <div className="team-score">{homeScore ?? 0}</div>
        </div>

        <div className="team away-team">
          <img src="/away-logo.png" alt="Away Logo" className="team-logo" />
          <div className="team-name">{awayTeamName || "Away"}</div>
          <div className="team-score">{awayScore ?? 0}</div>
        </div>
      </div>

      <div className="diamond-and-counts">
        <div className="bases">
          <div className={`base second ${runners?.second ? "occupied" : ""}`}></div>
          <div className={`base first ${runners?.first ? "occupied" : ""}`}></div>
          <div className={`base third ${runners?.third ? "occupied" : ""}`}></div>
          <div className="base home"></div>
        </div>

        <div className="inning-indicator">
          {isTop ? "▲" : "▼"} Inning {inning}
        </div>

        <div className="counts">
          <div>Balls: {balls}</div>
          <div>Strikes: {strikes}</div>
          <div>Outs: {outs}</div>
        </div>
      </div>

      <div className="game-time">Game Time: {formatTime(gameTime)}</div>

      <div className="sponsor-banner">Sponsor Banner</div>
    </div>
  );
};

export default OverlayPage;
