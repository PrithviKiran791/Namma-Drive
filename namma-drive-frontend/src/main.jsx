import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

console.log('[main.jsx] Clerk Key:', PUBLISHABLE_KEY ? 'Present' : 'MISSING');
console.log('[main.jsx] Starting app...');

if (!PUBLISHABLE_KEY) {
  console.error("❌ Clerk Publishable Key is missing! Check your .env file.");
  console.error("Expected: VITE_CLERK_PUBLISHABLE_KEY");
}

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
  console.log('[main.jsx] App rendered successfully');
} catch (error) {
  console.error('[main.jsx] Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">App Failed to Load</h1>
      <p>Error: ${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}
