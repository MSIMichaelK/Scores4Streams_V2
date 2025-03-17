// src/contexts/FirebaseContext.jsx

// This file is used to initialize the Firebase app and provide the auth and db contexts to the app
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { createContext, useContext } from "react";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYT9zHNqOXvMIK4wXzpfjSrvdtQl9vpdQ",
  authDomain: "scores4streams-v2.firebaseapp.com",
  projectId: "scores4streams-v2",
  storageBucket: "scores4streams-v2.appspot.com",
  messagingSenderId: "3532448022",
  appId: "1:3532448022:web:a470707e9c397381bc7037",
  measurementId: "G-11CREPRXW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Context
const FirebaseContext = createContext({ auth, db });

// Provider component
export const FirebaseProvider = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook for easy Firebase access 
export const useFirebase = () => useContext(FirebaseContext);