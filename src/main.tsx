import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './ui'
import App from './App'
import { useApp } from './store/app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// service worker только в собранной версии, чтобы не мешать разработке
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}))
}

// доступ к состоянию для записи демо-ролика (tools/record-video.mjs)
;(window as unknown as { __atelier: unknown }).__atelier = { app: useApp }
