import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GameCreationForm from "./GameCreationForm";
import GameList from "./GameList";

const Console = () => {
  const { user, loading, claimsReady, refreshClaims } = useAuth();
  const navigate = useNavigate();

  // If user is signed in but claims aren't ready, trigger a refresh
  useEffect(() => {
    if (user && !loading && !claimsReady) {
      refreshClaims();
    }
  }, [user, loading, claimsReady, refreshClaims]);

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
