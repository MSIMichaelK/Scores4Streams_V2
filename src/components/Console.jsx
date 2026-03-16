import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GameCreationForm from "./GameCreationForm";
import GameList from "./GameList";

const Console = () => {
  const { user, loading, claimsReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      user.getIdToken(true).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading || (!loading && !user)) return <div className="loading-page">Loading...</div>;

  return (
    <div className="console-page">
      <div className="page-header">
        <h2>Scores4Streams</h2>
      </div>

      <div className="card">
        <GameCreationForm />
      </div>

      <div className="card">
        <GameList />
      </div>
    </div>
  );
};

export default Console;
