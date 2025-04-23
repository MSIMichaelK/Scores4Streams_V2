import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const ManualScoreController = ({ gameId }) => {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runners, setRunners] = useState({
    first: false,
    second: false,
    third: false,
  });

  const toggleRunner = (base) => {
    setRunners((prev) => ({ ...prev, [base]: !prev[base] }));
  };

  const { user, tenantId } = useAuth();

  useEffect(() => {
    const saveToFirestore = async () => {
      if (!user || !tenantId || !gameId) return;

      const db = getFirestore();
      const gameRef = doc(db, "games", gameId);

      await setDoc(
        gameRef,
        {
          homeScore,
          awayScore,
          balls,
          strikes,
          outs,
          runners,
          scorerTeamId: tenantId,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    };

    saveToFirestore();
  }, [homeScore, awayScore, balls, strikes, outs, runners]);

  return (
    <div>
      <h2>Manual Score Controller</h2>

      <div>
        <h3>Score</h3>
        <div>
          <p>Home: {homeScore}</p>
          <button onClick={() => setHomeScore(homeScore + 1)}>+</button>
          <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))}>-</button>
        </div>
        <div>
          <p>Away: {awayScore}</p>
          <button onClick={() => setAwayScore(awayScore + 1)}>+</button>
          <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))}>-</button>
        </div>
      </div>

      <div>
        <h3>Balls / Strikes / Outs</h3>
        <p>Balls: {balls}</p>
        <button onClick={() => setBalls((balls + 1) % 4)}>Next</button>
        <p>Strikes: {strikes}</p>
        <button onClick={() => setStrikes((strikes + 1) % 3)}>Next</button>
        <p>Outs: {outs}</p>
        <button onClick={() => setOuts((outs + 1) % 3)}>Next</button>
      </div>

      <div>
        <h3>Base Runners</h3>
        <button onClick={() => toggleRunner("first")}>1B {runners.first ? "🧍" : "⬜"}</button>
        <button onClick={() => toggleRunner("second")}>2B {runners.second ? "🧍" : "⬜"}</button>
        <button onClick={() => toggleRunner("third")}>3B {runners.third ? "🧍" : "⬜"}</button>
      </div>
    </div>
  );
};

export default ManualScoreController;