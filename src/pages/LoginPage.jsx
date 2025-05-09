import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";

const LoginPage = () => {
  const { user, activeTeam, logout, claimsReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (claimsReady && activeTeam !== "defaultteam") {
      console.log("✅ Redirecting to /console");
      navigate("/console");
    }
  }, [claimsReady, activeTeam, navigate]);

  if (claimsReady && user) {
    return (
      <div>
        <h2>Welcome to Scores4Streams</h2>
        {activeTeam === "defaultteam" ? (
          <>
            <p>Your account is active but not associated with a valid team.</p>
            <p>Please contact an admin or sign out and try again.</p>
          </>
        ) : (
          <>
            <p>You are logged in with team: {activeTeam}</p>
            <button onClick={() => navigate("/console")}>Go to Console</button>
          </>
        )}
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Login to Scores4Streams</h2>
      <AuthForm />
    </div>
  );
};

export default LoginPage;