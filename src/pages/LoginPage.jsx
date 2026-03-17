import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const { user, tenantId, claimsReady, loading, refreshClaims } = useAuth();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const maxRetries = 5;

  // Auto-redirect when claims are ready
  useEffect(() => {
    if (claimsReady && tenantId && tenantId !== "defaultTeam") {
      navigate("/console");
    }
  }, [claimsReady, tenantId, navigate]);

  // Auto-retry claims resolution when user is signed in but claims aren't ready
  useEffect(() => {
    if (user && !loading && !claimsReady && !retrying && retryCount < maxRetries) {
      setRetrying(true);
      const timer = setTimeout(async () => {
        await refreshClaims();
        setRetryCount(c => c + 1);
        setRetrying(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, claimsReady, retrying, retryCount, refreshClaims]);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/login");
  };

  // Still loading auth state
  if (loading) {
    return (
      <div className="auth-page">
        <h2>Scores4Streams</h2>
        <div className="auth-form">
          <p style={{ textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // User is signed in but claims aren't ready yet — show loading with option to sign out
  if (user && !claimsReady) {
    const exhausted = retryCount >= maxRetries;
    return (
      <div className="auth-page">
        <h2>Scores4Streams</h2>
        <div className="auth-form">
          <p style={{ marginBottom: 12, textAlign: "center" }}>
            {exhausted
              ? "Account setup is taking longer than expected. Try signing out and back in."
              : "Setting up your account..."}
          </p>
          <div className="auth-buttons">
            <button className="btn-primary" onClick={() => navigate("/console")}>
              Go to Dashboard
            </button>
            {exhausted && (
              <button className="btn-secondary" onClick={async () => { setRetryCount(0); await refreshClaims(); }}>
                Retry
              </button>
            )}
            <button className="btn-danger" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Claims ready — show team status
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

  // Not signed in — show auth form
  return (
    <div className="auth-page">
      <h2>Scores4Streams</h2>
      <AuthForm />
    </div>
  );
};

export default LoginPage;
