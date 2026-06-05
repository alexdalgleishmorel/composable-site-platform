import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Production wiring (HTTP API + Cognito token) is injected once auth lands in #14; for now the App
// falls back to the in-memory mock so the admin runs standalone for local dev.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
