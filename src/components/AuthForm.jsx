import { callSetCustomClaims } from "../utils/authUtils";
import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirebase } from "../contexts/FirebaseContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("scorer");
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, "users", userId), {
        email,
        memberships: {
          [teamId]: { role },
        },
        activeTenant: teamId,
      });

      console.log("User signed up and assigned to team:", teamId);
    } catch (error) {
      console.error("Error signing up:", error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", email);
      await callSetCustomClaims(); // Assign custom claims
      navigate("/");
    } catch (error) {
      console.error("Error signing in:", error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user, prompt for team and role
        // For simplicity, assigning default teamId and role
        const defaultTeamId = "defaultTeam";
        const defaultRole = "viewer";

        await setDoc(userRef, {
          email: user.email,
          memberships: {
            [defaultTeamId]: { role: defaultRole },
          },
          activeTenant: defaultTeamId,
        });

        console.log("New Google user assigned to team:", defaultTeamId);
      } else {
        console.log("Existing Google user signed in:", user.email);
      }
      await callSetCustomClaims(); // Assign custom claims
      navigate("/");
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <h2>Welcome, {user.email}</h2>
          <p>Active Team: {user.activeTenant || "None"}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </>
      ) : (
        <>
          <h2>Sign Up / Sign In</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="Enter Team ID" value={teamId} onChange={(e) => setTeamId(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="scorer">Scorer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
          <button onClick={handleGoogleSignIn}>Sign In with Google</button>
        </>
      )}
    </div>
  );
};

export default AuthForm;