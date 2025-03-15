// src/contexts/FirebaseContext.jsx

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { createContext, useContext } from "react";

// Your Firebase configuration
const firebaseConfig = {
  aapiKey: "AIzaSyDYT9zHNqOXvMIK4wXzpfjSrvdtQl9vpdQ",
  authDomain: "scores4streams-v2.firebaseapp.com",
  projectId: "scores4streams-v2",
  storageBucket: "scores4streams-v2.firebasestorage.app",
  messagingSenderId: "3532448022",
  appId: "1:3532448022:web:a470707e9c397381bc7037",
  measurementId: "G-11CREPRXW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optionally initialize analytics (only if you will use it explicitly)
const analytics = getAnalytics(app);

// Export initialized app
const authApp = getAnalytics(app);

// Context
const FirebaseContext = createContext();

// Provider component
export const FirebaseProvider = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ app }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook for easy context usage
export const useFirebase = () => useContext(FirebaseContext);

// Initialize Firebase app
const app = initializeApp(firebaseConfig);