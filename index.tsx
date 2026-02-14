
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('streekhook: Application initializing...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('streekhook: Root element not found!');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('streekhook: React render sequence started.');
  } catch (err) {
    console.error('streekhook: Fatal error during React mount:', err);
    rootElement.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; padding:2rem; font-family:sans-serif;">
        <h1 style="color:#ef4444;">Initialization Failed</h1>
        <p style="color:#64748b;">Something went wrong while starting the app.</p>
        <pre style="background:#f1f5f9; padding:1rem; border-radius:0.5rem; max-width:100%; overflow:auto;">${err instanceof Error ? err.message : String(err)}</pre>
        <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; background:#6366f1; color:white; border:none; border-radius:0.25rem; cursor:pointer;">Retry</button>
      </div>
    `;
  }
}
