import { useState } from "react";
import { collection, addDoc, Timestamp, getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GameCreationForm = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [homeTeamLogo, setHomeTeamLogo] = useState(null);
  const [awayTeamLogo, setAwayTeamLogo] = useState(null);
  const [leagueLogo, setLeagueLogo] = useState(null);
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

    const gameId = crypto.randomUUID(); // Generate temporary ID for naming paths

    const uploadLogo = async (file, teamType) => {
      if (!file) return "";

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Logo = reader.result.split(",")[1];
            const idToken = await user.getIdToken();

            const response = await fetch("https://us-central1-scores4streams-v2.cloudfunctions.net/uploadGameLogo", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
              },
              body: JSON.stringify({ base64Logo, gameId, teamType }),
            });

            if (!response.ok) {
              console.error(`❌ Upload failed: ${response.statusText}`);
              return resolve("");
            }

            const data = await response.json();
            resolve(data.url || "");
          } catch (err) {
            console.error(`❌ Upload error for ${teamType}:`, err);
            reject("");
          }
        };
        reader.onerror = (err) => {
          console.error("❌ FileReader error:", err);
          reject("");
        };
        reader.readAsDataURL(file);
      });
    };

    // const homeTeamLogoUrl = await uploadLogo(homeTeamLogo, "home");
    // const awayTeamLogoUrl = await uploadLogo(awayTeamLogo, "away");
    // const leagueLogoUrl = await uploadLogo(leagueLogo, "league");
    const homeTeamLogoUrl = "";
    const awayTeamLogoUrl = "";
    const leagueLogoUrl = "";

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
      leagueName,
      gameClock: "",
      pitchCount: 0,
      pitcherName: "",
      batterName: "",
      homeTeamLogoUrl,
      awayTeamLogoUrl,
      leagueLogoUrl,
    };

    try {
      const docRef = await addDoc(collection(db, "games"), { ...gameData, id: gameId });
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
      <label>
        League Name:
        <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} required />
      </label>
      {/*
      <label>
        Home Team Logo:
        <input type="file" accept="image/*" onChange={(e) => setHomeTeamLogo(e.target.files[0])} />
      </label>
      <label>
        Away Team Logo:
        <input type="file" accept="image/*" onChange={(e) => setAwayTeamLogo(e.target.files[0])} />
      </label>
      <label>
        League Logo:
        <input type="file" accept="image/*" onChange={(e) => setLeagueLogo(e.target.files[0])} />
      </label>
      */}
      <button type="submit">Create Game</button>
    </form>
  );
};

export default GameCreationForm;