
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Wrap the entire app with Router first to make react-router hooks available throughout the app
createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);
