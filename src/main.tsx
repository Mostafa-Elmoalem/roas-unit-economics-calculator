import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config'
import './index.css'
import { setupServiceWorker } from './pwa'
import App from './App.tsx'

// Service-worker registration is app-entry wiring like telemetry's start
// (AD-20): fire-and-forget, silently guarded, never blocks first paint.
void setupServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
