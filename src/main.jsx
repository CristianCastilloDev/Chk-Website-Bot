import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { injectSpeedInsights } from '@vercel/speed-insights';
import './index.css';
import App from './App.jsx';
import './utils/generateAnalyticsData'; // Load analytics data generator functions

// Initialize Vercel Speed Insights on client-side only
injectSpeedInsights();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </StrictMode>,
);
