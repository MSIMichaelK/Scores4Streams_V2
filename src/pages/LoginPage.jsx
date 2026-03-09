import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const { user, tenantId, claimsReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (claimsReady && tenantId && tenantId !== "defaultTeam") {
      navigate("/console");
    }
  }, [claimsReady, tenantId, navigate]);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/login");
  };

  if (claimsReady && user) {
    return (
      <div className="auth-page">
        <h2>Scores4Streams</h2>
        {tenantId === "defaultTeam" ? (
          <div className="auth-form">
            <p style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
              Your account is not associated with a team yet. Contact an admin to get added.
            </p>
            <button className="btn-danger" onClick={handleSignOut} style={{ width: "100%" }}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <p style={{ marginBottom: 12 }}>Signed in with team: <strong>{tenantId}</strong></p>
            <div className="auth-buttons">
              <button className="btn-primary" onClick={() => navigate("/console")}>
                Go to Dashboard
              </button>
              <button className="btn-danger" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h2>Scores4Streams</h2>
      <AuthForm />
    </div>
  );
};

export default LoginPage;
