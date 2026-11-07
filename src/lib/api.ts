import { API_URL, HAS_API } from './config'

/** Тонкий клиент сервера. Без VITE_API_URL всё это не вызывается и приложение работает на моках */
const TOKEN_KEY = 'atelier-token'

export const getToken = (): string => { try { return localStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' } }
export const setToken = (t: string) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* нет доступа к хранилищу */ } }
export const hasSession = () => HAS_API && !!getToken()

export class ApiError extends Error {
  status: number
  code: string
  extra: Record<string, unknown>
  constructor(status: number, code: string, extra: Record<string, unknown> = {}) { super(code); this.status = status; this.code = code; this.extra = extra }
}

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: { timeout?: number; token?: string } = {}): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeout ?? 15000)
  try {
    const token = opts.token ?? getToken()
    const r = await fetch(API_URL + path, {
      method, signal: ctrl.signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await r.text()
    const data = text ? JSON.parse(text) : {}
    if (!r.ok) throw new ApiError(r.status, data.error ?? 'error', data)
    return data as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, 'network')
  } finally { clearTimeout(timer) }
}

export interface ServerSub { plan: 'free' | 'sub' | 'plus'; effective: string; endsAt: number | null; cancelled: boolean; ended: boolean }
export interface ServerMe { id: string; email: string; sub: ServerSub }
export interface ServerCaps { ai: boolean; vision: boolean; cutout: boolean; pay: boolean }

export const requestCode = (email: string) => api('POST', '/api/auth/request', { email })
export const verifyCode = (email: string, code: string) =>
  api<{ token: string; user: ServerMe; isNew: boolean; state: Record<string, unknown> | null; stateAt: number }>('POST', '/api/auth/verify', { email, code })

/** Что включено на сервере; запрашивается один раз при запуске */
let caps: ServerCaps = { ai: false, vision: false, cutout: false, pay: false }
export const getCaps = () => caps
export async function loadCaps() {
  if (!HAS_API) return caps
  try { caps = await api<ServerCaps>('GET', '/api/config', undefined, { timeout: 6000 }) } catch { /* сервер недоступен: остаёмся на моках */ }
  return caps
}

/** Текст ошибки входа для человека */
export function authErrorText(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Что-то пошло не так, попробуй ещё раз'
  switch (e.code) {
    case 'network': return 'Нет связи с сервером, проверь интернет'
    case 'bad_email': return 'Проверь адрес почты'
    case 'too_soon': return `Код уже отправлен, новый можно через ${e.extra.wait ?? 60} с`
    case 'rate_limited': return 'Слишком много попыток, попробуй позже'
    case 'code_wrong': return 'Неверный код, попробуй ещё раз'
    case 'code_locked': return 'Слишком много попыток, запроси новый код'
    case 'code_expired': return 'Код устарел, запроси новый'
    default: return 'Не получилось, попробуй ещё раз'
  }
}
