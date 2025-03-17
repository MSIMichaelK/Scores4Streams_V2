import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirebase } from "../contexts/FirebaseContext"; // Import Firebase context

const Auth = () => {
  const { auth } = useFirebase(); // Get Firebase Auth from context
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // Sign up with Email & Password
  const handleSignUp = async () => {
    console.log("Sign Up Clicked!");  // Log when button is clicked
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User signed up:", userCredential.user);
    } catch (error) {
      console.error("Error signing up:", error.message);
    }
  };
  
  const handleSignIn = async () => {
    console.log("Sign In Clicked!");  // Log when button is clicked
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
    } catch (error) {
      console.error("Error signing in:", error.message);
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("User signed in with Google");
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  // Sign out
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
          <h2>Sign In</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSignUp} disabled={!email || !password}>
            Sign Up
          </button>
          <button onClick={handleSignIn} disabled={!email || !password}>
            Sign In
          </button>
          <button onClick={handleGoogleSignIn}>Sign In with Google</button>
        </>
      )}
    </div>
  );
};

export default Auth;