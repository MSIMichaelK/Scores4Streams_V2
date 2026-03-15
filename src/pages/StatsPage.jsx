import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const StatsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="loading-page">Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="stats-page">
      <div className="page-header">
        <h2>Statistics</h2>
      </div>
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <p style={{ fontSize: "2rem", marginBottom: 12 }}>📊</p>
        <h3>Coming Soon</h3>
        <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
          Player and team statistics across seasons and tournaments will be available here.
        </p>
      </div>
    </div>
  );
};

export default StatsPage;
