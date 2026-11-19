import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { config } from './config.mjs'
import { signToken, verifyToken } from './auth.mjs'
import { newSecret, otpauthUrl, verifyTotp } from './totp.mjs'

// Вход в админку: 1) код из письма (почта должна быть в ADMIN_EMAILS), 2) код из приложения-аутентификатора.
// Первый вход принудительно настраивает аутентификатор и выдаёт резервные коды. Сессия: случайный ключ в HttpOnly-cookie,
// в базе только его хэш, простой 30 минут, жизнь не дольше 8 часов.
export const CODE_TTL = 5 * 60 * 1000
export const CODE_TRIES = 5
export const TICKET_TTL = 5 * 60 * 1000
export const SESSION_IDLE = 30 * 60 * 1000
export const SESSION_MAX = 8 * 3600 * 1000
export const LOCK_MS = 15 * 60 * 1000
export const MAX_FAILS = 5
export const COOKIE = 'atelier_admin'

const sha = (s) => createHash('sha256').update(String(s)).digest('hex')
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y) }

export const isAdminEmail = (email) => config.adminEmails.includes(String(email).trim().toLowerCase())

const records = (store) => (store.db.admins ??= {})
export const adminRecord = (store, email) => (records(store)[email] ??= { totpEnabled: false, secret: null, pending: null, lastStep: 0, recovery: [], fails: 0, lockedUntil: 0, lastLoginAt: 0, lastIp: '' })

// ---------- код из письма
export function issueAdminCode(store, email) {
  store.db.admCodes ??= {}
  const prev = store.db.admCodes[email]
  if (prev && Date.now() - prev.at < 60000) return { error: 'too_soon' }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  store.db.admCodes[email] = { hash: sha(`${email}:${code}`), at: Date.now(), exp: Date.now() + CODE_TTL, tries: 0 }
  store.save()
  return { code }
}

/** 'ok' | 'wrong' | 'expired' | 'locked' */
export function checkAdminCode(store, email, code) {
  const c = store.db.admCodes?.[email]
  if (!c || c.exp < Date.now()) return 'expired'
  if (c.tries >= CODE_TRIES) return 'locked'
  c.tries++
  if (!same(sha(`${email}:${String(code).trim()}`), c.hash)) { store.save(); return 'wrong' }
  delete store.db.admCodes[email]
  store.save()
  return 'ok'
}

// ---------- билет между шагами (подписанный, 5 минут): 'totp' или 'setup'
export const makeTicket = (email, stage) => signToken(`adm|${stage}|${email}`, TICKET_TTL)
export function readTicket(ticket) {
  const u = verifyToken(ticket)
  const m = typeof u === 'string' && u.match(/^adm\|(totp|setup)\|(.+)$/)
  return m ? { stage: m[1], email: m[2] } : null
}

/** Что отдать после верного кода из письма: ввод кода аутентификатора или его настройка */
export function nextStep(store, email) {
  const a = adminRecord(store, email)
  if (a.totpEnabled) return { step: 'totp', ticket: makeTicket(email, 'totp') }
  a.pending = newSecret()
  store.save()
  return { step: 'setup', ticket: makeTicket(email, 'setup'), secret: a.pending, otpauth: otpauthUrl(email, a.pending) }
}

const newRecoveryCodes = () => Array.from({ length: 10 }, () => `${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}`)

/**
 * Проверка второго фактора. Возвращает { ok, recovery? } или { error: 'locked' | 'wrong' }.
 * В 'setup' первый верный код включает аутентификатор и выдаёт резервные коды (показываются один раз).
 * 5 ошибок подряд блокируют вход этой почте на 15 минут
 */
export function checkSecondFactor(store, email, stage, code, now = Date.now()) {
  const a = adminRecord(store, email)
  if (a.lockedUntil > now) return { error: 'locked' }
  const fail = () => {
    a.fails++
    let locked = false
    if (a.fails >= MAX_FAILS) { a.lockedUntil = now + LOCK_MS; a.fails = 0; locked = true }
    store.save()
    return { error: locked ? 'locked' : 'wrong', justLocked: locked }
  }
  const raw = String(code ?? '').trim()
  if (stage === 'setup') {
    if (!a.pending) return { error: 'wrong' }
    const step = verifyTotp(a.pending, raw, { t: now })
    if (step === null) return fail()
    const recovery = newRecoveryCodes()
    Object.assign(a, { secret: a.pending, pending: null, totpEnabled: true, lastStep: step, recovery: recovery.map(sha), fails: 0 })
    store.save()
    return { ok: true, recovery }
  }
  // резервный код: формат xxxx-xxxx, одноразовый
  if (/^[0-9a-f]{4}-[0-9a-f]{4}$/i.test(raw)) {
    const h = sha(raw.toLowerCase())
    const i = a.recovery.findIndex((x) => same(x, h))
    if (i < 0) return fail()
    a.recovery.splice(i, 1)
    a.fails = 0
    store.save()
    return { ok: true, recoveryLeft: a.recovery.length }
  }
  const step = a.secret ? verifyTotp(a.secret, raw, { t: now, lastStep: a.lastStep }) : null
  if (step === null) return fail()
  a.lastStep = step
  a.fails = 0
  store.save()
  return { ok: true }
}

// ---------- сессии
export function createSession(store, email, { ip = '', ua = '' } = {}, now = Date.now()) {
  const sid = randomBytes(32).toString('base64url')
  const sessions = (store.db.admSessions ??= {})
  for (const [k, s] of Object.entries(sessions)) if (now - s.at > SESSION_MAX || now - s.seen > SESSION_IDLE) delete sessions[k]
  sessions[sha(sid)] = { email, at: now, seen: now, ip, ua: String(ua).slice(0, 160) }
  const a = adminRecord(store, email)
  a.lastLoginAt = now; a.lastIp = ip
  store.save()
  return sid
}

/** Сессия по ключу из cookie: проверяет простой и общий срок, продлевает простой. Админ, убранный из ADMIN_EMAILS, теряет доступ сразу */
export function sessionEmail(store, sid, now = Date.now()) {
  if (!sid) return null
  const key = sha(sid)
  const s = store.db.admSessions?.[key]
  if (!s) return null
  if (now - s.at > SESSION_MAX || now - s.seen > SESSION_IDLE || !isAdminEmail(s.email)) { delete store.db.admSessions[key]; store.save(); return null }
  if (now - s.seen > 60000) { s.seen = now; store.save() }
  return s.email
}

export function destroySession(store, sid) {
  if (sid && store.db.admSessions?.[sha(sid)]) { delete store.db.admSessions[sha(sid)]; store.save() }
}
export function destroyAllSessions(store, email) {
  for (const [k, s] of Object.entries(store.db.admSessions ?? {})) if (s.email === email) delete store.db.admSessions[k]
  store.save()
}

export function parseCookies(header) {
  const out = {}
  for (const p of String(header ?? '').split(';')) { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()) }
  return out
}
export const sessionCookie = (sid, secure) => `${COOKIE}=${sid}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${SESSION_MAX / 1000}${secure ? '; Secure' : ''}`
export const clearCookie = (secure) => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure ? '; Secure' : ''}`

/** Список админов для страницы «Админы»: без секретов */
export function adminsList(store, now = Date.now()) {
  return config.adminEmails.map((email) => {
    const a = store.db.admins?.[email]
    const sessions = Object.values(store.db.admSessions ?? {}).filter((s) => s.email === email && now - s.seen <= SESSION_IDLE && now - s.at <= SESSION_MAX).length
    return { email, totp: !!a?.totpEnabled, recoveryLeft: a?.recovery?.length ?? 0, lastLoginAt: a?.lastLoginAt || null, lastIp: a?.lastIp || '', sessions, locked: !!a && a.lockedUntil > now }
  })
}

/** Сбросить второй фактор (потерян телефон): на сервере командой server/admin-cli.mjs reset-2fa */
export function reset2fa(store, email) {
  const a = adminRecord(store, email)
  Object.assign(a, { totpEnabled: false, secret: null, pending: null, lastStep: 0, recovery: [], fails: 0, lockedUntil: 0 })
  destroyAllSessions(store, email)
}
