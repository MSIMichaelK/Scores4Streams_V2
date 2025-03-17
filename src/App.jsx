import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Auth from "./components/Auth";

function App() {
  return (
    <div>
      <h1>Scores 4 Streams</h1>
      <Auth />  {/* Add Authentication UI here */}
    </div>
  );
}

export default App;
