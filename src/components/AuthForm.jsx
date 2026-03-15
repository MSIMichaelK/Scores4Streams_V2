import { callSetCustomClaims } from "../utils/authUtils";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirebase } from "../contexts/FirebaseContext";
import { doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createTeam } from "../hooks/useTeams";

const AuthForm = () => {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [role, setRole] = useState("scorer");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ uid: currentUser.uid, ...userSnap.data() });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  const handleSignUp = async () => {
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required for sign up");
      return;
    }
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

      await callSetCustomClaims();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await callSetCustomClaims();
      navigate("/");
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
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="auth-form">
        <p style={{ marginBottom: 12 }}>Signed in as <strong>{user.email}</strong></p>
        <button className="btn-danger" onClick={handleSignOut} style={{ width: "100%" }}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      {error && <div className="error-message">{error}</div>}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="text" placeholder="Team Name (for sign up)" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="scorer">Scorer</option>
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </select>
      <div className="auth-buttons">
        <button className="btn-primary" onClick={handleSignIn}>Sign In</button>
        <button className="btn-secondary" onClick={handleSignUp}>Sign Up</button>
        <button className="btn-google" onClick={handleGoogleSignIn}>Sign In with Google</button>
      </div>
    </div>
  );
};

export default AuthForm;
