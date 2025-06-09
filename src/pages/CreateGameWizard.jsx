import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import { useAuth } from "../contexts/AuthContext";

const CreateGameWizard = () => {
  const { db } = useFirebase();
  const { user: currentUser, activeMembership, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [yourTeamId, setYourTeamId] = useState("");
  const [isHomeTeam, setIsHomeTeam] = useState(true);
  const [opponentTeamId, setOpponentTeamId] = useState("");
  const [opponentTeamName, setOpponentTeamName] = useState("");
  const [creatingNewOpponent, setCreatingNewOpponent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        const allTeams = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeams(allTeams);
        if (activeMembership?.tenant_type === "team") {
          setYourTeamId(activeMembership.tenant_id);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setError("Failed to load teams.");
      }
    };

    fetchTeams();
  }, [db, activeMembership]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authLoading) {
      console.log("Auth still loading...");
      return;
    }

    // Guard for authentication
    const uid = currentUser?.uid;
    if (!uid) {
      console.error("No authenticated user found.");
      alert("You must be logged in to create a game.");
      setLoading(false);
      return;
    }

    try {
      let finalOpponentId = opponentTeamId;

      if (creatingNewOpponent && opponentTeamName.trim() !== "") {
        const newOpponentRef = doc(collection(db, "teams"));
        await setDoc(newOpponentRef, {
          name: opponentTeamName,
          created_by: uid,
          created_at: new Date().toISOString(),
        });
        finalOpponentId = newOpponentRef.id;
      }

      // Resolve team names for home and away
      const yourTeam = teams.find((team) => team.id === yourTeamId);
      const opponentTeam = teams.find((team) => team.id === finalOpponentId);
      const homeTeamName = isHomeTeam ? yourTeam?.name : opponentTeam?.name;
      const awayTeamName = isHomeTeam ? opponentTeam?.name : yourTeam?.name;

      const gameRef = doc(collection(db, "games"));
      await setDoc(gameRef, {
        home_team_id: isHomeTeam ? yourTeamId : finalOpponentId,
        away_team_id: isHomeTeam ? finalOpponentId : yourTeamId,
        homeTeamName,
        awayTeamName,
        created_by: uid,
        created_at: new Date().toISOString(),
        status: "scheduled",
        inning: 0,
        score_home: 0,
        score_away: 0,
      });

      navigate(`/controller/${gameRef.id}`);
    } catch (err) {
      console.error("Game creation failed:", err);
      setError("Could not create game.");
    }

    setLoading(false);
  };

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="create-game-wizard">
      <h2>Create Game</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Your Team:
          <select
            value={yourTeamId}
            onChange={(e) => setYourTeamId(e.target.value)}
            required
          >
            <option value="" disabled>Select your team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Are you the Home Team?
          <input
            type="checkbox"
            checked={isHomeTeam}
            onChange={() => setIsHomeTeam((prev) => !prev)}
          />
        </label>

        {!creatingNewOpponent && (
          <>
            <label>
              Opponent Team:
              <select
                value={opponentTeamId}
                onChange={(e) => setOpponentTeamId(e.target.value)}
                required
              >
                <option value="" disabled>Select opponent</option>
                {teams
                  .filter((t) => t.id !== yourTeamId)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
            </label>
            <button type="button" onClick={() => setCreatingNewOpponent(true)}>
              Create New Opponent
            </button>
          </>
        )}

        {creatingNewOpponent && (
          <>
            <label>
              New Opponent Name:
              <input
                type="text"
                value={opponentTeamName}
                onChange={(e) => setOpponentTeamName(e.target.value)}
                required
              />
            </label>
            <button type="button" onClick={() => setCreatingNewOpponent(false)}>
              Select Existing Opponent
            </button>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Game"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CreateGameWizard;