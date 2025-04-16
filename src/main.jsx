import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { AuthProvider } from "./contexts/AuthContext"; //wraps the app in global provider of context

ReactDOM.createRoot(document.getElementById("root")).render(
  <FirebaseProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </FirebaseProvider>
);