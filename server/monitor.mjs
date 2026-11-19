// Мониторинг: запускается systemd-таймером раз в минуту (deploy/atelier-monitor.timer), без зависимостей.
// Проверяет сайт снаружи, API и сервис распознавания на сервере, место на диске, запись в каталог данных и срок TLS-сертификата.
// Тревога после двух неудач подряд одной проверки: одно сообщение «упало», одно «восстановилось» с длительностью простоя,
// пока лежит, напоминание раз в 6 часов. Состояние в data/monitor-state.json (отдельный файл, не db.json).
// Telegram-бот задаёт deploy/set-ops.sh; без него сообщения только в журнал (journalctl -u atelier-monitor).
import { existsSync, readFileSync, renameSync, statfsSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { connect } from 'node:tls'
import { pathToFileURL } from 'node:url'
import { notifyOps, opsEnabled } from './notify.mjs'

const MIN = 60000
const HOUR = 60 * MIN
export const FAILS_TO_ALERT = 2
export const REMIND_MS = 6 * HOUR
const DAY = 24 * HOUR
const GB = 1024 ** 3

/** Названия проверок и текст тревоги. remind: как часто напоминать, пока не починено */
export const CHECKS = {
  public: { title: 'Сайт не отвечает снаружи', ok: 'Сайт снова отвечает', remind: REMIND_MS },
  local: { title: 'API на сервере не отвечает', ok: 'API на сервере снова отвечает', remind: REMIND_MS },
  vision: { title: 'Сервис распознавания фото не отвечает', ok: 'Распознавание фото снова работает', remind: REMIND_MS },
  disk: { title: 'Мало места на диске', ok: 'Места на диске снова достаточно', remind: DAY },
  write: { title: 'Не получается писать в каталог данных', ok: 'Запись в каталог данных снова работает', remind: REMIND_MS },
  tls: { title: 'Сертификат сайта скоро закончится', ok: 'Сертификат сайта обновлён', remind: DAY },
}

export function formatDuration(ms) {
  const m = Math.max(1, Math.round(ms / MIN))
  if (m < 60) return `${m} мин`
  const h = Math.floor(m / 60)
  if (h < 48) return m % 60 ? `${h} ч ${m % 60} мин` : `${h} ч`
  return `${Math.floor(h / 24)} дн ${h % 24} ч`
}

const fresh = () => ({ checks: {}, tlsAt: 0 })

/**
 * Чистая функция: по прошлому состоянию и результатам проверок считает новое состояние и сообщения.
 * results: [{ name, ok: true|false|null, detail }], ok === null значит «не проверяли в этот раз», состояние не меняется.
 * messages: [{ name, kind: 'down'|'remind'|'up', text }]
 */
export function evaluate(prev, results, now) {
  const state = { ...fresh(), ...(prev ?? {}), checks: { ...(prev?.checks ?? {}) } }
  const messages = []
  for (const r of results) {
    if (r.ok === null || r.ok === undefined) continue
    const meta = CHECKS[r.name] ?? { title: r.name, ok: `${r.name}: порядок`, remind: REMIND_MS }
    const c = (state.checks[r.name] = { fails: 0, since: null, down: false, lastAlert: 0, ...(state.checks[r.name] ?? {}) })
    if (r.ok) {
      if (c.down) messages.push({ name: r.name, kind: 'up', text: `✅ ${meta.ok}\nПростой: ${formatDuration(now - c.since)}` })
      c.fails = 0; c.since = null; c.down = false; c.lastAlert = 0
      continue
    }
    if (!c.fails) c.since = now
    c.fails++
    const detail = r.detail ? `\n${r.detail}` : ''
    if (!c.down && c.fails >= FAILS_TO_ALERT) {
      c.down = true; c.lastAlert = now
      messages.push({ name: r.name, kind: 'down', text: `⚠️ ${meta.title}${detail}` })
    } else if (c.down && now - c.lastAlert >= meta.remind) {
      c.lastAlert = now
      messages.push({ name: r.name, kind: 'remind', text: `⚠️ Всё ещё: ${meta.title.toLowerCase()}\nУже ${formatDuration(now - c.since)}${detail}` })
    }
  }
  return { state, messages }
}

/** Проверка адреса: ждём JSON с ok: true */
async function checkHealth(name, url, fetchImpl) {
  try {
    const r = await fetchImpl(url, { signal: AbortSignal.timeout(8000), headers: { 'Cache-Control': 'no-cache' } })
    if (!r.ok) return { name, ok: false, detail: `${url}: HTTP ${r.status}` }
    const j = await r.json().catch(() => null)
    return j?.ok === true ? { name, ok: true } : { name, ok: false, detail: `${url}: ответ без ok` }
  } catch (e) {
    return { name, ok: false, detail: `${url}: ${e?.name === 'TimeoutError' ? 'не ответил за 8 секунд' : (e?.cause?.code ?? e?.message ?? 'ошибка')}` }
  }
}

/** Свободное место: тревога, если свободно меньше 15% или меньше 3 ГБ */
export function checkDisk(dir, statfs = statfsSync) {
  try {
    const s = statfs(dir)
    const free = Number(s.bavail) * Number(s.bsize)
    const total = Number(s.blocks) * Number(s.bsize)
    const pct = total ? free / total : 1
    const bad = pct < 0.15 || free < 3 * GB
    return { name: 'disk', ok: !bad, detail: bad ? `Свободно ${(free / GB).toFixed(1)} ГБ из ${(total / GB).toFixed(0)} ГБ (${Math.round(pct * 100)}%)` : undefined }
  } catch (e) { return { name: 'disk', ok: false, detail: `Не получилось узнать: ${e.message}` } }
}

/** Запись в каталог данных: создаём и удаляем маленький файл */
export function checkWrite(dir) {
  const f = join(dir, '.monitor-probe')
  try { writeFileSync(f, String(Date.now())); unlinkSync(f); return { name: 'write', ok: true } }
  catch (e) { return { name: 'write', ok: false, detail: `${dir}: ${e.code ?? e.message}` } }
}

/** Сколько дней осталось у сертификата сайта */
export function tlsDaysLeft(host, connectImpl = connect) {
  return new Promise((resolve, reject) => {
    const s = connectImpl({ host, port: 443, servername: host, timeout: 8000 }, () => {
      const cert = s.getPeerCertificate()
      s.end()
      if (!cert?.valid_to) return reject(new Error('нет сертификата'))
      resolve((new Date(cert.valid_to).getTime() - Date.now()) / DAY)
    })
    s.on('error', reject)
    s.on('timeout', () => { s.destroy(); reject(new Error('таймаут')) })
  })
}

export async function checkTls(host, tlsImpl = tlsDaysLeft) {
  try {
    const days = await tlsImpl(host)
    return { name: 'tls', ok: days >= 14, detail: days < 14 ? `${host}: осталось ${Math.max(0, Math.floor(days))} дн, продли сертификат (certbot renew)` : undefined }
  } catch (e) { return { name: 'tls', ok: false, detail: `${host}: ${e.message}` } }
}

export const readState = (file) => { try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fresh() } catch { return fresh() } }
export function writeState(file, state) {
  const tmp = file + '.tmp'
  writeFileSync(tmp, JSON.stringify(state))
  renameSync(tmp, file)
}

/** Все проверки за один проход. Сертификат проверяем не чаще раза в 6 часов */
export async function runChecks({ env = process.env, fetchImpl = fetch, now = Date.now(), tlsAt = 0, statfs = statfsSync, tlsImpl = tlsDaysLeft } = {}) {
  const site = (env.SITE_URL || 'https://atelierai.ru').replace(/\/$/, '')
  const port = env.PORT || 8787
  const dir = env.DATA_DIR || './data'
  const vision = (env.VISION_URL || 'http://127.0.0.1:7100').replace(/\/$/, '')
  const results = await Promise.all([
    checkHealth('public', `${site}/api/health`, fetchImpl),
    checkHealth('local', `http://127.0.0.1:${port}/api/health`, fetchImpl),
    checkHealth('vision', `${vision}/health`, fetchImpl),
  ])
  results.push(checkDisk(dir, statfs), checkWrite(dir))
  let checkedTls = false
  if (now - tlsAt >= 6 * HOUR && site.startsWith('https://')) {
    results.push(await checkTls(new URL(site).hostname, tlsImpl))
    checkedTls = true
  }
  return { results, checkedTls }
}

export async function main(env = process.env) {
  const dir = env.DATA_DIR || './data'
  const file = join(dir, 'monitor-state.json')
  const now = Date.now()
  const prev = readState(file)
  const { results, checkedTls } = await runChecks({ env, now, tlsAt: prev.tlsAt })
  const { state, messages } = evaluate(prev, results, now)
  if (checkedTls) state.tlsAt = now
  for (const m of messages) {
    console.log(`[monitor] ${m.text.replace(/\n/g, ' | ')}`)
    // не дошло до Telegram при настроенном боте: «упало» пометим несработавшим, чтобы повторить в следующую минуту
    if (opsEnabled(env) && !(await notifyOps(m.text, { env })) && m.kind === 'down') { state.checks[m.name].down = false }
  }
  try { writeState(file, state) } catch (e) { console.error('[monitor] не записал состояние:', e.message) }
  const bad = results.filter((r) => r.ok === false).map((r) => r.name)
  if (bad.length) console.log(`[monitor] неудачные проверки: ${bad.join(', ')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error('[monitor]', e); process.exit(1) })
