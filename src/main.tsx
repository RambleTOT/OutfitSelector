import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './ui'
import './lib/pwa'
import { initMetrika } from './lib/analytics'
import { loadCaps } from './lib/api'
import { startSync } from './lib/sync'
import { initNative } from './lib/native'
import { isNative } from './lib/config'
import App from './App'
import { useApp } from './store/app'

initMetrika()
void initNative()
void loadCaps().then(() => startSync())

// только для разработки: ?skip пропускает онбординг (проверка в симуляторе iPhone без прохода анкеты)
if (import.meta.env.DEV && new URLSearchParams(location.search).has('skip')) {
  useApp.getState().skipOnboarding()
  if (!location.hash.startsWith('#/outfit')) location.hash = '#/outfit'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// service worker только в собранной версии, чтобы не мешать разработке
if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {}))
}

// доступ к состоянию для записи демо-ролика (tools/record-video.mjs)
;(window as unknown as { __atelier: unknown }).__atelier = { app: useApp }
