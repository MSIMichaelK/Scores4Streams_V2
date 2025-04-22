import './App.css';
import { FirebaseProvider } from "./contexts/FirebaseContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./router";

function App() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </FirebaseProvider>
  );
}

export default App;