// Ежедневный бэкап (deploy/atelier-backup.timer, 04:00 по Москве): архив каталога данных (db.json, events.jsonl, photos/),
// шифруется ДО любой отправки, лежит локально в BACKUP_DIR (по умолчанию /opt/atelier/backups рядом с каталогом server, хранится 14 последних) и уходит в Telegram.
// Персональные данные (почты, переписка) покидают сервер только в зашифрованном виде: AES-256-GCM, ключ из scrypt от BACKUP_PASSPHRASE.
// Расшифровка: node backup-decrypt.mjs файл.enc выход.tar.gz (docs/OPS.md).
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { notifyOps, opsEnabled, sendOpsFile } from './notify.mjs'

export const MAGIC = Buffer.from('ATBK1')
export const KEEP = 14
export const TG_LIMIT = 45 * 1024 * 1024
const SALT = 16, IV = 12, TAG = 16
const NAME_RE = /^atelier-\d{8}-\d{4}\.tar\.gz\.enc$/

/** Формат файла: 'ATBK1' + salt(16) + iv(12) + tag(16) + шифртекст */
export function encrypt(plain, passphrase) {
  if (!passphrase) throw new Error('Не задан пароль шифрования')
  const salt = randomBytes(SALT), iv = randomBytes(IV)
  const key = scryptSync(passphrase, salt, 32)
  const c = createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([c.update(plain), c.final()])
  return Buffer.concat([MAGIC, salt, iv, c.getAuthTag(), body])
}

export function decrypt(file, passphrase) {
  if (file.length < MAGIC.length + SALT + IV + TAG || !file.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Это не бэкап Atelier (неверный заголовок файла)')
  let o = MAGIC.length
  const salt = file.subarray(o, (o += SALT)), iv = file.subarray(o, (o += IV)), tag = file.subarray(o, (o += TAG))
  const d = createDecipheriv('aes-256-gcm', scryptSync(passphrase, salt, 32), iv)
  d.setAuthTag(tag)
  try { return Buffer.concat([d.update(file.subarray(o)), d.final()]) }
  catch { throw new Error('Неверный пароль или файл повреждён') }
}

/** tar.gz каталога данных в памяти; берём только то, что есть */
export function makeArchive(dataDir) {
  const parts = ['db.json', 'events.jsonl', 'photos'].filter((p) => existsSync(join(dataDir, p)))
  if (!parts.length) throw new Error(`В ${dataDir} нечего сохранять`)
  return execFileSync('tar', ['-czf', '-', '-C', dataDir, ...parts], { maxBuffer: 2 * 1024 ** 3 })
}

/** Оставляем keep последних бэкапов, остальные удаляем. Возвращает удалённые имена */
export function rotate(dir, keep = KEEP) {
  const names = readdirSync(dir).filter((n) => NAME_RE.test(n)).sort().reverse()
  const old = names.slice(keep)
  for (const n of old) unlinkSync(join(dir, n))
  return old
}

const msk = (t) => new Date(t + 3 * 3600000)
export const stamp = (t) => { const d = msk(t).toISOString(); return `${d.slice(0, 10).replace(/-/g, '')}-${d.slice(11, 13)}${d.slice(14, 16)}` }
const human = (t) => { const d = msk(t).toISOString(); return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)} ${d.slice(11, 16)} МСК` }
const mb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`)

/** Цифры для подписи: сколько людей, новых за сутки, платежей за сутки */
export function stats(dataDir, now = Date.now()) {
  try {
    const db = JSON.parse(readFileSync(join(dataDir, 'db.json'), 'utf8'))
    const users = Object.values(db.users ?? {})
    const pays = Object.values(db.payments ?? {}).filter((p) => p.status === 'paid' && p.at >= now - 86400000)
    const real = pays.filter((p) => !p.test)
    return { users: users.length, fresh: users.filter((u) => u.createdAt >= now - 86400000).length, pays: real.length, sum: real.reduce((s, p) => s + (p.amount ?? 0), 0), testPays: pays.length - real.length }
  } catch { return null }
}

export function caption({ now, size, sha, st }) {
  const lines = ['🗄 Бэкап Atelier', human(now), `Размер: ${mb(size)}`]
  if (st) {
    lines.push(`Пользователей: ${st.users} (новых за сутки: ${st.fresh})`)
    lines.push(`Платежей за сутки: ${st.pays}${st.pays ? ` на ${st.sum} ₽` : ''}${st.testPays ? `, тестовых: ${st.testPays}` : ''}`)
  }
  lines.push(`sha256: ${sha.slice(0, 12)}`, 'Зашифрован, расшифровка: node backup-decrypt.mjs (docs/OPS.md)')
  return lines.join('\n')
}

/** Один бэкап. Возвращает { file, size, sent } или бросает ошибку */
export async function runBackup({ env = process.env, now = Date.now(), fetchImpl = fetch, archive = makeArchive } = {}) {
  const dataDir = resolve(env.DATA_DIR || './data')
  const outDir = resolve(env.BACKUP_DIR || join(dataDir, '..', '..', 'backups'))
  const pass = env.BACKUP_PASSPHRASE
  if (!pass) {
    await notifyOps('⚠️ Бэкап не сделан: не задан ключ шифрования BACKUP_PASSPHRASE.\nЗапусти на сервере: bash /opt/atelier/set-ops.sh', { env, fetchImpl })
    throw new Error('BACKUP_PASSPHRASE не задан')
  }
  mkdirSync(outDir, { recursive: true, mode: 0o700 })
  const enc = encrypt(archive(dataDir), pass)
  const name = `atelier-${stamp(now)}.tar.gz.enc`
  writeFileSync(join(outDir, name), enc, { mode: 0o600 })
  const removed = rotate(outDir)
  const sha = createHash('sha256').update(enc).digest('hex')
  const cap = caption({ now, size: enc.length, sha, st: stats(dataDir, now) })
  let sent = false
  if (!opsEnabled(env)) console.log('[backup] Telegram не настроен, копия только на сервере')
  else if (enc.length > TG_LIMIT) await notifyOps(`⚠️ Архив слишком большой для Telegram (${mb(enc.length)}), лежит на сервере: ${join(outDir, name)}`, { env, fetchImpl })
  else {
    sent = await sendOpsFile(enc, basename(name), cap, { env, fetchImpl })
    if (!sent) console.error('[backup] не удалось отправить в Telegram')
  }
  console.log(`[backup] ${name} ${mb(enc.length)}, sha256 ${sha.slice(0, 12)}, отправлено: ${sent ? 'да' : 'нет'}, удалено старых: ${removed.length}`)
  return { file: join(outDir, name), size: enc.length, sent, sha }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBackup().catch(async (e) => {
    console.error('[backup]', e.message)
    if (e.message !== 'BACKUP_PASSPHRASE не задан') await notifyOps(`⚠️ Бэкап не удался: ${e.message}`)
    process.exit(1)
  })
}
