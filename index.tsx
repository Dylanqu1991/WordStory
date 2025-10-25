
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeLeanCloud } from './services/leanCloudService';

// Explicitly initialize the LeanCloud SDK at the app's entry point.
initializeLeanCloud();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);