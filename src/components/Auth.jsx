import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirebase } from "../contexts/FirebaseContext";
import { doc, setDoc, getFirestore } from "firebase/firestore";

const Auth = () => {
  const { auth, db } = useFirebase(); // Get Firebase instances
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState(""); // User selects/join a team
  const [role, setRole] = useState("scorer"); // Default role

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // Sign Up & Store User Role in Firestore
  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      console.log("User created:", userCredential.user);

      // Store user and team membership in Firestore
      await setDoc(doc(db, "users", userId), {
        email,
        memberships: {
          [teamId]: { role }, // Assign role for this team
        }
      });

      console.log("User signed up and assigned to team:", teamId);
    } catch (error) {
      console.error("Error signing up:", error.message);
    }
  };

  // Sign In
  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", email);
    } catch (error) {
      console.error("Error signing in:", error.message);
    }
  };

const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    console.log("User signed in with Google");
  } catch (error) {
    console.error("Error signing in with Google:", error.message);
  }
};

  // Sign Out
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
          <button onClick={handleSignOut}>Sign Out</button>
        </>
      ) : (
        <>
          <h2>Sign Up</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {/* Team Selection */}
          <input type="text" placeholder="Enter Team ID" value={teamId} onChange={(e) => setTeamId(e.target.value)} />

          {/* Role Selection */}
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

export default Auth;