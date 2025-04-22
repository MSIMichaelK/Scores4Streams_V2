import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

import { useAuth } from "./contexts/AuthContext"; // 👈 NEW
import Auth from "./components/Auth";
import Console from "./components/Console";

function App() {
  const { user, role, tenantId, loading } = useAuth(); // 👈 NEW
  console.log("🧪 App.jsx — loading:", loading);
  console.log("🧪 App.jsx — user:", user);

  return (
    <div>
      <h1>Scores 4 Streams</h1>
      <Auth />

      {loading ? (
        <p>Loading user info...</p>
      ) : user ? (
        <Console />
      ) : (
        <p>Please sign in.</p>
      )}
    </div>
  );
}

export default App;