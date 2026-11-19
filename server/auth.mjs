import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { config } from './config.mjs'

const b64 = (b) => Buffer.from(b).toString('base64url')

/** Токен: payload.подпись. Живёт 90 дней, обновляется при каждом входе. Отозвать можно сменой TOKEN_SECRET (разлогинит всех) */
export function signToken(userId, ttlMs = 90 * 86400000) {
  const p = b64(JSON.stringify({ u: userId, exp: Date.now() + ttlMs }))
  return `${p}.${createHmac('sha256', config.tokenSecret).update(p).digest('base64url')}`
}

export function verifyToken(token) {
  if (typeof token !== 'string') return null
  const [p, sig] = token.split('.')
  if (!p || !sig) return null
  const good = createHmac('sha256', config.tokenSecret).update(p).digest('base64url')
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString())
    return d.exp > Date.now() ? d.u : null
  } catch { return null }
}

const CODE_TTL = 10 * 60 * 1000
const MAX_TRIES = 5

/** Код из 4 цифр, как в интерфейсе. Защита от перебора: 5 попыток на код, 10 минут жизни, не чаще раза в минуту на почту */
export const CONSENT_RE = /^\d{4}-\d{2}-\d{2}$/ // версия согласия = дата редакции документа

export function issueCode(store, email, consent) {
  const prev = store.db.codes[email]
  if (prev && Date.now() - prev.at < 60000) return { error: 'too_soon', wait: Math.ceil((60000 - (Date.now() - prev.at)) / 1000) }
  const code = String(randomInt(0, 10000)).padStart(4, '0')
  store.db.codes[email] = { code, at: Date.now(), exp: Date.now() + CODE_TTL, tries: 0, consent }
  store.save()
  return { code }
}

export function checkCode(store, email, code) {
  const c = store.db.codes[email]
  if (!c || c.exp < Date.now()) return 'expired'
  if (c.tries >= MAX_TRIES) return 'locked'
  c.tries++
  if (String(code) !== c.code) { store.save(); return 'wrong' }
  delete store.db.codes[email]
  store.save()
  return 'ok'
}

// символы, которым нечего делать в адресе, отсекаем сразу: так они не попадут ни в письмо, ни в админку
export const emailOk = (v) => typeof v === 'string' && v.length <= 120 && /^[^\s@<>"'`\\&;()]+@[^\s@<>"'`\\&;()]+\.[^\s@<>"'`\\&;()]+$/.test(v)
export const normEmail = (v) => String(v).trim().toLowerCase()
