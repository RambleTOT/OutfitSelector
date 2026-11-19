import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// Одноразовые коды по времени (RFC 6238): SHA-1, 6 цифр, шаг 30 секунд, как у Google Authenticator, 1Password, Яндекс Ключа
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32(buf) {
  let bits = 0, value = 0, out = ''
  for (const b of buf) {
    value = (value << 8) | b; bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}
export function unbase32(str) {
  let bits = 0, value = 0
  const out = []
  for (const ch of String(str).replace(/=+$/, '').toUpperCase()) {
    const i = ALPHABET.indexOf(ch)
    if (i < 0) continue
    value = (value << 5) | i; bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(out)
}

export const newSecret = () => base32(randomBytes(20))
export const stepOf = (t = Date.now()) => Math.floor(t / 30000)

export function hotp(secret, counter) {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', unbase32(secret)).update(msg).digest()
  const o = h[h.length - 1] & 15
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}
export const totp = (secret, t = Date.now()) => hotp(secret, stepOf(t))

/**
 * Проверка кода с допуском на ±1 шаг (часы телефона). Возвращает номер шага или null.
 * lastStep: уже использованный шаг, один и тот же код второй раз не принимается (защита от подсмотренного кода)
 */
export function verifyTotp(secret, code, { t = Date.now(), lastStep = 0 } = {}) {
  const c = String(code ?? '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(c)) return null
  const now = stepOf(t)
  for (const s of [now, now - 1, now + 1]) {
    if (s <= lastStep) continue
    const good = Buffer.from(hotp(secret, s))
    if (timingSafeEqual(good, Buffer.from(c))) return s
  }
  return null
}

export const otpauthUrl = (email, secret, issuer = 'Atelier') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
