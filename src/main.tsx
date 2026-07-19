import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './components/ui/ThemeToggle'

// Catch unhandled errors so the user never sees a blank white screen
window.addEventListener('error', (event) => {
  console.error('[MatkaNight] Global error:', event.error);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    root.innerHTML = `
      <div style="min-height:100vh;background:#0B0B14;color:#D1D1E0;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,sans-serif">
        <div style="max-width:600px;text-align:center">
          <h1 style="color:#E24B4A;font-size:1.5rem;margin-bottom:1rem">Something went wrong</h1>
          <p style="color:#A0A0B8;margin-bottom:1rem">The app failed to start. Check the browser console for details.</p>
          <pre style="background:#1C1C2E;border:1px solid #252540;border-radius:8px;padding:1rem;text-align:left;font-size:0.8rem;color:#A0A0B8;overflow:auto;max-height:200px">${event.error?.message || event.message || 'Unknown error'}</pre>
          <button onclick="location.reload()" style="margin-top:1.5rem;padding:0.5rem 1.5rem;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem">Reload</button>
        </div>
      </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MatkaNight] Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
