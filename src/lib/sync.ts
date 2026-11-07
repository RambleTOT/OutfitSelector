import { api, getToken, hasSession, ApiError, type ServerMe, setToken } from './api'
import { API_URL } from './config'
import { useApp } from '../store/app'

/**
 * Синхронизация гардероба с сервером. Сервер хранит снимок состояния и фото; тариф приходит только с сервера.
 * Правило конфликтов простое: побеждает более поздняя запись (updatedAt), старый телефон свежие данные не затрёт.
 */
const SYNC_AT = 'atelier-sync-at'
const SYNCED = ['name', 'avatar', 'height', 'size', 'quiz', 'quizDone', 'onboarded', 'firstItemsSkipped', 'items', 'saved', 'notif', 'seen'] as const
type Snapshot = Record<string, unknown>

const readAt = () => { try { return Number(localStorage.getItem(SYNC_AT) ?? 0) } catch { return 0 } }
const writeAt = (n: number) => { try { localStorage.setItem(SYNC_AT, String(n)) } catch { /* нет доступа */ } }

const snapshot = (): Snapshot => { const s = useApp.getState() as unknown as Snapshot; return Object.fromEntries(SYNCED.map((k) => [k, s[k]])) }

export function applyServerState(state: Snapshot | null, at: number) {
  if (state) useApp.setState({ ...state, signedIn: true })
  writeAt(at)
}

/** Тариф и срок: источник правды — сервер */
export function applySub(me: ServerMe) {
  const s = me.sub
  useApp.setState({
    plan: s.plan, subEnded: s.ended, subCancelled: s.cancelled, subEndsAt: s.endsAt,
    subEndedAt: s.ended ? s.endsAt : null,
    email: me.email, via: 'email',
  })
}

export async function refreshMe(): Promise<ServerMe | null> {
  if (!hasSession()) return null
  try { const me = await api<ServerMe>('GET', '/api/me'); applySub(me); return me } catch (e) {
    if (e instanceof ApiError && e.status === 401) { setToken(''); useApp.setState({ signedIn: false }) } // токен отозван
    return null
  }
}

const dataUrlToBlob = async (u: string) => (await fetch(u)).blob()

/** Фото с вырезанным фоном уходят на сервер, в состоянии остаётся ссылка: так состояние лёгкое и не упирается в лимит localStorage */
async function uploadPhotos() {
  const items = useApp.getState().items
  for (const it of items) {
    if (!it.photo?.startsWith('data:image/')) continue
    try {
      const blob = await dataUrlToBlob(it.photo)
      const r = await fetch(API_URL + '/api/photos', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': blob.type }, body: blob })
      if (!r.ok) continue
      const { url } = await r.json() as { url: string }
      const cur = useApp.getState().items.find((x) => x.id === it.id)
      if (cur && cur.photo === it.photo) useApp.getState().updateItem({ ...cur, photo: API_URL + url })
    } catch { /* повторим при следующей синхронизации */ }
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
let last = ''
let busy = false

export async function pushNow() {
  if (!hasSession() || busy) return
  busy = true
  try {
    await uploadPhotos()
    const snap = snapshot()
    const json = JSON.stringify(snap)
    if (json === last) return
    const at = Date.now()
    try {
      await api('PUT', '/api/state', { state: snap, updatedAt: at }, { timeout: 30000 })
      last = json; writeAt(at)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) applyServerState(e.extra.state as Snapshot, Number(e.extra.stateAt)) // на сервере свежее
    }
  } finally { busy = false }
}

const schedule = () => { clearTimeout(timer); timer = setTimeout(pushNow, 2500) }

/** Запуск при старте приложения и после входа */
export async function startSync() {
  if (!hasSession()) return
  const me = await refreshMe()
  if (!me) return
  try {
    const r = await api<{ state: Snapshot | null; stateAt: number }>('GET', '/api/state')
    if (r.state && r.stateAt > readAt()) applyServerState(r.state, r.stateAt)
    else schedule()
  } catch { /* офлайн: догоним позже */ }
  useApp.subscribe(schedule)
  window.addEventListener('online', schedule)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { void refreshMe() } else void pushNow() })
}
