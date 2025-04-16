import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

import { useAuth } from "./contexts/AuthContext"; // 👈 NEW
import Auth from "./components/Auth";

function App() {
  const { user, role, tenantId, loading } = useAuth(); // 👈 NEW

  return (
    <div>
      <h1>Scores 4 Streams</h1>
      <Auth />

      {loading ? (
        <p>Loading user info...</p>
      ) : user ? (
        <div>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {role}</p>
          <p><strong>Team:</strong> {tenantId}</p>
        </div>
      ) : (
        <p>Please sign in.</p>
      )}
    </div>
  );
}

export default App;