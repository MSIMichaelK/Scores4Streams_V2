import { useState } from "react";
import { collection, addDoc, Timestamp, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GameCreationForm = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const { user, tenantId, role, roles } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  console.log("🔍 Role access check:", { user, tenantId, roles });
  console.log("🧩 user:", user);
  console.log("🧩 tenantId:", tenantId);
  console.log("🧩 roles:", roles);

  if (!user || !tenantId || !roles?.some(r => r === "admin" || r === "scorer")) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Submitting new game:", { homeTeam, awayTeam, startTime });
    if (!user || !tenantId) return;

    const gameData = {
      homeTeamId: "team123",
      homeTeamName: homeTeam,
      awayTeamId: "team456",
      awayTeamName: awayTeam,
      status: "scheduled",
      createdBy: user.uid,
      tenantId,
      scheduledStart: Timestamp.fromDate(new Date(startTime)),
      homeScore: 0,
      awayScore: 0,
      inning: 1,
      balls: 0,
      strikes: 0,
      outs: 0,
      leagueName: "",
      gameClock: "",
      pitchCount: 0,
      pitcherName: "",
      batterName: "",
    };

    try {
      const docRef = await addDoc(collection(db, "games"), gameData);
      console.log("✅ Game created with ID:", docRef.id);
      navigate(`/manual/${docRef.id}`);
    } catch (error) {
      console.error("❌ Error creating game:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create a New Game</h3>
      <label>
        Home Team:
        <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} required />
      </label>
      <label>
        Away Team:
        <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} required />
      </label>
      <label>
        Start Time:
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
      </label>
      <button type="submit">Create Game</button>
    </form>
  );
};

export default GameCreationForm;