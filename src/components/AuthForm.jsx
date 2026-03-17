import { callSetCustomClaims } from "../utils/authUtils";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirebase } from "../contexts/FirebaseContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createTeam } from "../hooks/useTeams";
import { useAuth } from "../contexts/AuthContext";

const AuthForm = () => {
  const { auth, db } = useFirebase();
  const { refreshClaims } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [role, setRole] = useState("scorer");
  const [error, setError] = useState(null);
  const [signingUp, setSigningUp] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required for sign up");
      return;
    }
    setSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create real team document
      const teamId = await createTeam({
        name: teamName.trim(),
        createdBy: userId,
      });

      // Create user doc referencing real team ID
      await setDoc(doc(db, "users", userId), {
        email,
        memberships: {
          [teamId]: {
            roles: Array.isArray(role) ? role : [role],
            teamName: teamName.trim(),
          },
        },
        activeTenant: teamId,
      });

      // Set custom claims on server, then force AuthContext to re-read
      await callSetCustomClaims();
      await refreshClaims();
      navigate("/console");
    } catch (err) {
      setError(err.message);
      setSigningUp(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await callSetCustomClaims();
      await refreshClaims();
      navigate("/console");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create default team doc for Google sign-in users
        const teamId = await createTeam({
          name: "My Team",
          createdBy: user.uid,
        });

        await setDoc(userRef, {
          email: user.email,
          memberships: {
            [teamId]: {
              roles: ["scorer"],
              teamName: "My Team",
            },
          },
          activeTenant: teamId,
        });
      }

      await callSetCustomClaims();
      await refreshClaims();
      navigate("/console");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-form">
      {error && <div className="error-message" data-testid="auth-error">{error}</div>}
      {signingUp ? (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <p>Creating your team...</p>
        </div>
      ) : (
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="auth-input-email" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="auth-input-password" />
          <input type="text" placeholder="Team Name (for sign up)" value={teamName} onChange={(e) => setTeamName(e.target.value)} data-testid="auth-input-team-name" />
          <select value={role} onChange={(e) => setRole(e.target.value)} data-testid="auth-select-role">
            <option value="scorer">Scorer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <div className="auth-buttons">
            <button className="btn-primary" onClick={handleSignIn} data-testid="auth-btn-signin">Sign In</button>
            <button className="btn-secondary" onClick={handleSignUp} data-testid="auth-btn-signup">Sign Up</button>
            <button className="btn-google" onClick={handleGoogleSignIn} data-testid="auth-btn-google">Sign In with Google</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthForm;
