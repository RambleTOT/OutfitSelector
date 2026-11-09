import http from 'node:http'
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { randomBytes } from 'node:crypto'
import { config } from './config.mjs'
import { Store } from './store.mjs'
import { checkCode, emailOk, issueCode, normEmail, signToken, verifyToken } from './auth.mjs'
import { sendCode } from './mail.mjs'
import { chat, aiEnabled } from './ai/providers.mjs'
import { SYSTEM, buildUserPrompt, parseOutfit } from './ai/prompt.mjs'
import { buildIntent, cancelSubscription, handleNotification, parseBody, payEnabled, publicSub, verifySignature } from './pay.mjs'
import { spend, spendPhoto } from './plans.mjs'

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon' }
const PHOTO_ID = /^[a-f0-9]{32}$/
const USER_ID = /^[a-f0-9]{24}$/

class HttpError extends Error { constructor(status, code, extra = {}) { super(code); this.status = status; this.code = code; this.extra = extra } }

/** Ограничение частоты: окно в памяти по ключу (IP + маршрут). Для одного процесса этого достаточно, за nginx берём IP из X-Forwarded-For */
function limiter() {
  const hits = new Map()
  return (key, max, windowMs) => {
    const now = Date.now()
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (arr.length >= max) throw new HttpError(429, 'rate_limited')
    arr.push(now)
    hits.set(key, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
}

function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let n = 0
    req.on('data', (c) => { n += c.length; if (n > max) { reject(new HttpError(413, 'too_large')); req.destroy() } else chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export function createApp({ store = new Store(config.dataDir), mailer = sendCode, aiChat = chat, aiOn = aiEnabled, fetchImpl = fetch } = {}) {
  const limit = limiter()
  let inflight = 0
  const ip = (req) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim()
  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
    res.end(JSON.stringify(body))
  }
  const authUser = (req) => {
    const h = req.headers.authorization ?? ''
    const id = verifyToken(h.startsWith('Bearer ') ? h.slice(7) : '')
    const u = id && store.user(id)
    if (!u) throw new HttpError(401, 'unauthorized')
    return u
  }
  const json = async (req, max = 100_000) => {
    const raw = await readBody(req, max)
    try { return raw.length ? JSON.parse(raw.toString()) : {} } catch { throw new HttpError(400, 'bad_json') }
  }
  const me = (u) => ({ id: u.id, email: u.email, sub: publicSub(u) })

  async function api(req, res, url) {
    const path = url.pathname
    const m = req.method

    if (m === 'GET' && path === '/api/health') return send(res, 200, { ok: true, ai: aiOn(), pay: payEnabled() })
    // что включено на сервере: клиент по этому решает, показывать ли настоящую оплату и AI
    if (m === 'GET' && path === '/api/config') return send(res, 200, { ai: aiOn(), analyze: !!config.ai.visionUrl, pay: payEnabled() })

    if (m === 'POST' && path === '/api/events') {
      limit(`ev:${ip(req)}`, 120, 60000)
      const b = await json(req, 4000)
      if (typeof b.event === 'string' && b.event.length < 60) store.event({ event: b.event, params: b.params ?? {}, sid: String(b.sid ?? '').slice(0, 40), t: Date.now(), path: String(b.path ?? '').slice(0, 100) })
      res.writeHead(204); return res.end()
    }

    // ===== вход по коду из почты
    if (m === 'POST' && path === '/api/auth/request') {
      limit(`ar:${ip(req)}`, 10, 3600000)
      const b = await json(req)
      if (!emailOk(b.email)) throw new HttpError(400, 'bad_email')
      const email = normEmail(b.email)
      const r = issueCode(store, email)
      if (r.error) throw new HttpError(429, r.error, { wait: r.wait })
      await mailer(email, r.code)
      return send(res, 200, { ok: true })
    }
    if (m === 'POST' && path === '/api/auth/verify') {
      limit(`av:${ip(req)}`, 30, 3600000)
      const b = await json(req)
      if (!emailOk(b.email)) throw new HttpError(400, 'bad_email')
      const email = normEmail(b.email)
      const r = checkCode(store, email, b.code)
      if (r !== 'ok') throw new HttpError(r === 'wrong' ? 401 : 410, `code_${r}`)
      const existing = store.userByEmail(email)
      const u = existing ?? store.createUser(email)
      return send(res, 200, { token: signToken(u.id), user: me(u), isNew: !existing, state: u.state, stateAt: u.stateAt })
    }

    // ===== всё ниже только для вошедших
    if (path.startsWith('/api/me') || path.startsWith('/api/state') || path.startsWith('/api/ai') || path.startsWith('/api/pay/') && !path.startsWith('/api/pay/notify') || path.startsWith('/api/photos') && m !== 'GET') {
      const u = authUser(req)

      if (m === 'GET' && path === '/api/me') return send(res, 200, me(u))
      if (m === 'DELETE' && path === '/api/me') {
        // автопродление отключаем до удаления, иначе деньги продолжат списываться
        if (u.sub.subscriptionId && payEnabled()) await cancelSubscription(store, u, fetchImpl).catch(() => {})
        store.deleteUser(u.id)
        return send(res, 200, { ok: true })
      }

      if (m === 'GET' && path === '/api/state') return send(res, 200, { state: u.state, stateAt: u.stateAt })
      if (m === 'PUT' && path === '/api/state') {
        const b = await json(req, 3_000_000)
        if (typeof b.state !== 'object' || b.state === null) throw new HttpError(400, 'bad_state')
        // последняя запись побеждает; клиент присылает свой updatedAt, чтобы старый телефон не затёр свежие данные
        const at = Number(b.updatedAt) || Date.now()
        if (at < u.stateAt) return send(res, 409, { error: 'stale', state: u.state, stateAt: u.stateAt })
        u.state = b.state; u.stateAt = at
        store.save()
        return send(res, 200, { ok: true, stateAt: at })
      }

      if (m === 'POST' && path === '/api/photos') {
        limit(`ph:${u.id}`, 60, 3600000)
        const raw = await readBody(req, 4_000_000)
        const ct = String(req.headers['content-type'] ?? '')
        const ext = ct.includes('webp') ? 'webp' : ct.includes('png') ? 'png' : null
        if (!ext || raw.length < 100) throw new HttpError(400, 'bad_image')
        const dir = join(store.dir, 'photos', u.id)
        mkdirSync(dir, { recursive: true })
        const id = randomBytes(16).toString('hex')
        writeFileSync(join(dir, `${id}.${ext}`), raw)
        return send(res, 200, { url: `/api/photos/${u.id}/${id}.${ext}` })
      }

      if (m === 'POST' && path === '/api/ai/outfit') {
        if (!aiOn()) throw new HttpError(503, 'ai_off')
        limit(`ai:${u.id}`, 30, 3600000)
        const b = await json(req, 30_000)
        const items = (Array.isArray(b.items) ? b.items : []).slice(0, 25).filter((i) => i && typeof i.id === 'string' && typeof i.category === 'string')
        if (items.length < 2) throw new HttpError(400, 'few_items')
        const sp = spend(store, u)
        if (!sp.ok) throw new HttpError(429, sp.reason)
        let outfit, lastErr
        for (let attempt = 0; attempt < 2 && !outfit; attempt++) {
          try { outfit = parseOutfit(await aiChat(SYSTEM, buildUserPrompt({ items, occasion: b.occasion, wish: b.wish, weather: b.weather, nogo: b.nogo, avoid: Array.isArray(b.avoid) ? b.avoid.filter((x) => typeof x === 'string').slice(0, 8) : [] })), items) } catch (e) { lastErr = e }
        }
        // лимит списываем только за удачный образ: ошибка модели не должна стоить человеку попытки
        if (!outfit) { console.error('[ai] не удалось:', lastErr?.message); throw new HttpError(502, 'ai_failed') }
        sp.commit()
        return send(res, 200, outfit)
      }

      // распознавание вещей и вырезание фона: фото уходит во внутренний сервис vision (docs/VISION.md), нигде не сохраняется
      if (m === 'POST' && path === '/api/ai/analyze') {
        if (!config.ai.visionUrl) throw new HttpError(503, 'analyze_off')
        limit(`an:${u.id}`, 40, 3600000)
        const ct = String(req.headers['content-type'] ?? '')
        if (!/^image\/(jpeg|png|webp)/.test(ct)) throw new HttpError(400, 'bad_image')
        const raw = await readBody(req, 6_000_000)
        const sp = spendPhoto(store, u)
        if (!sp.ok) throw new HttpError(429, sp.reason)
        if (inflight >= 2) throw new HttpError(503, 'busy')
        inflight++
        try {
          const form = new FormData()
          form.append('file', new Blob([raw], { type: ct }), 'photo')
          const r = await fetchImpl(`${config.ai.visionUrl}/analyze`, { method: 'POST', body: form, signal: AbortSignal.timeout(90_000) }).catch(() => null)
          if (!r) throw new HttpError(502, 'analyze_failed')
          if (r.status === 503) throw new HttpError(503, 'busy')
          if (!r.ok) throw new HttpError(r.status >= 500 ? 502 : 422, 'analyze_failed')
          const out = await r.json()
          // фото тратится только если что-то нашли: «не одежда» и ошибки лимит не уменьшают
          if (Array.isArray(out.items) && out.items.length) sp.commit()
          return send(res, 200, out)
        } finally { inflight-- }
      }

      if (m === 'POST' && path === '/api/pay/intent') {
        if (!payEnabled()) throw new HttpError(503, 'pay_off')
        limit(`pi:${u.id}`, 20, 3600000)
        const b = await json(req, 1000)
        if (!['sub', 'plus'].includes(b.plan)) throw new HttpError(400, 'bad_plan')
        return send(res, 200, buildIntent(u, b.plan))
      }
      if (m === 'POST' && path === '/api/pay/cancel') {
        if (!payEnabled()) throw new HttpError(503, 'pay_off')
        try { await cancelSubscription(store, u, fetchImpl) } catch (e) { console.error('[pay]', e.message); throw new HttpError(502, 'cancel_failed') }
        return send(res, 200, me(u))
      }
    }

    // фото отдаём по неугадываемой ссылке: тег <img> не умеет слать токен
    const ph = path.match(/^\/api\/photos\/([a-f0-9]{24})\/([a-f0-9]{32})\.(webp|png)$/)
    if (m === 'GET' && ph && USER_ID.test(ph[1]) && PHOTO_ID.test(ph[2])) {
      const f = join(store.dir, 'photos', ph[1], `${ph[2]}.${ph[3]}`)
      if (!existsSync(f)) throw new HttpError(404, 'not_found')
      res.writeHead(200, { 'Content-Type': MIME['.' + ph[3]], 'Cache-Control': 'public, max-age=31536000, immutable' })
      return createReadStream(f).pipe(res)
    }

    // ===== уведомления CloudPayments (подпись проверяется по сырому телу)
    const n = path.match(/^\/api\/pay\/notify\/(check|pay|fail|confirm|refund|cancel|recurrent)$/)
    if (m === 'POST' && n) {
      const raw = (await readBody(req, 100_000)).toString()
      if (!verifySignature(raw, req.headers)) { console.warn('[pay] неверная подпись', n[1]); return send(res, 401, { code: 13 }) }
      let body
      try { body = parseBody(raw, String(req.headers['content-type'] ?? '')) } catch { return send(res, 400, { code: 13 }) }
      return send(res, 200, handleNotification(store, n[1], body))
    }

    throw new HttpError(404, 'not_found')
  }

  function serveStatic(req, res, url) {
    const root = config.staticDir
    if (!root) { res.writeHead(404); return res.end() }
    let p = decodeURIComponent(url.pathname)
    if (p.endsWith('/')) p += 'index.html'
    let file = normalize(join(root, p))
    if (!file.startsWith(normalize(root))) { res.writeHead(403); return res.end() }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file)) { res.writeHead(404); return res.end('404') }
    const hashed = /\/assets\//.test(file)
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache' })
    createReadStream(file).pipe(res)
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    if (config.corsOrigin && url.pathname.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', config.corsOrigin)
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
    }
    res.setHeader('X-Content-Type-Options', 'nosniff')
    try {
      if (url.pathname.startsWith('/api/')) await api(req, res, url)
      else serveStatic(req, res, url)
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code, ...e.extra })
      console.error('[server]', e)
      send(res, 500, { error: 'server_error' })
    }
  })
  return { server, store }
}
