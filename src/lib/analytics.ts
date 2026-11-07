import { HAS_API, API_URL, METRIKA_ID } from './config'

/**
 * События продукта (спецификация, раздел 13): своя воронка + Яндекс.Метрика.
 * Без настроенного API и счётчика события только копятся в консоли разработчика и не уходят никуда.
 * Персональных данных (почта, имя, тексты) в события не кладём.
 */
type Params = Record<string, string | number | boolean | null | undefined>

declare global { interface Window { ym?: (id: number, method: string, ...args: unknown[]) => void } }

const SID_KEY = 'atelier-sid'
function sessionId(): string {
  try {
    let v = localStorage.getItem(SID_KEY)
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(SID_KEY, v) }
    return v
  } catch { return 'anon' }
}

let metrikaReady = false
export function initMetrika() {
  if (!METRIKA_ID || metrikaReady || typeof document === 'undefined') return
  metrikaReady = true
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://mc.yandex.ru/metrika/tag.js'
  s.onload = () => window.ym?.(Number(METRIKA_ID), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false })
  document.head.appendChild(s)
}

export function track(event: string, params: Params = {}) {
  try {
    if (METRIKA_ID && window.ym) window.ym(Number(METRIKA_ID), 'reachGoal', event, params)
    if (HAS_API) {
      const body = JSON.stringify({ event, params, sid: sessionId(), t: Date.now(), path: location.pathname + location.hash })
      if (!navigator.sendBeacon?.(`${API_URL}/api/events`, new Blob([body], { type: 'application/json' }))) {
        fetch(`${API_URL}/api/events`, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
      }
    }
  } catch { /* аналитика не должна ломать приложение */ }
}
