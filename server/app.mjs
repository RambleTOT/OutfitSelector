import http from 'node:http'
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { config } from './config.mjs'
import { Store } from './store.mjs'
import { CONSENT_RE, checkCode, emailOk, issueCode, normEmail, signToken, verifyToken } from './auth.mjs'
import { sendCode } from './mail.mjs'
import { chat, aiEnabled } from './ai/providers.mjs'
import { SYSTEM, buildUserPrompt, parseOutfit, repairOutfit, outfitProblems } from './ai/prompt.mjs'
import { buildIntent, cancelSubscription, handleNotification, parseBody, payEnabled as cpEnabled, publicSub, verifySignature } from './pay.mjs'
import { spend, spendPhoto, usageSnapshot } from './plans.mjs'
import { createWeather } from './weather.mjs'
import { buildRobokassaUrl, handleRobokassaResult, returnPage, robokassaEnabled } from './robokassa.mjs'
import { addMessage, notifyTeam, view as supportView } from './support.mjs'
import { adminRecord, adminsList, checkAdminCode, checkSecondFactor, clearCookie, COOKIE, createSession, destroyAllSessions, destroySession, isAdminEmail, issueAdminCode, nextStep, parseCookies, reset2fa, readTicket, sessionCookie, sessionEmail } from './admin-auth.mjs'
import { notifyOps } from './notify.mjs'
import { listUsers, logDelete, overview, paymentsList, recentLog, subAction, userDetail } from './admin.mjs'

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
  const getWeather = createWeather(fetchImpl)
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
  const payEnabled = () => cpEnabled() || robokassaEnabled()
  const me = (u) => ({ id: u.id, email: u.email, sub: publicSub(u), usage: usageSnapshot(store, u) })

  async function api(req, res, url) {
    const path = url.pathname
    const m = req.method

    if (m === 'GET' && path === '/api/health') return send(res, 200, { ok: true, ai: aiOn(), pay: payEnabled() })
    // что включено на сервере: клиент по этому решает, показывать ли настоящую оплату и AI
    if (m === 'GET' && path === '/api/config') return send(res, 200, { ai: aiOn(), analyze: !!config.ai.visionUrl, pay: payEnabled() })

    // погода по координатам (и гостю, и вошедшему): точку округляем, ответ кэшируется, наружу ходит только сервер
    if (m === 'GET' && path === '/api/weather') {
      limit(`wx:${ip(req)}`, 90, 3600000)
      const lat = Number(url.searchParams.get('lat'))
      const lon = Number(url.searchParams.get('lon'))
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new HttpError(400, 'bad_coords')
      try { return send(res, 200, await getWeather(lat, lon)) } catch { throw new HttpError(502, 'weather_unavailable') }
    }

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
      // согласие на обработку данных: без него даже код не отправляем (почта уже персональные данные)
      const known = store.userByEmail(email)
      const signedIn = (() => { try { return authUser(req).email === email } catch { return false } })()
      const has = typeof b.consent === 'string' && CONSENT_RE.test(b.consent)
      if (!has && !(known?.consent || signedIn)) throw new HttpError(400, 'consent_required')
      const r = issueCode(store, email, has ? b.consent : undefined)
      if (r.error) throw new HttpError(429, r.error, { wait: r.wait })
      await mailer(email, r.code)
      return send(res, 200, { ok: true })
    }
    if (m === 'POST' && path === '/api/auth/verify') {
      limit(`av:${ip(req)}`, 30, 3600000)
      const b = await json(req)
      if (!emailOk(b.email)) throw new HttpError(400, 'bad_email')
      const email = normEmail(b.email)
      const consent = store.db.codes[email]?.consent
      const r = checkCode(store, email, b.code)
      if (r !== 'ok') throw new HttpError(r === 'wrong' ? 401 : 410, `code_${r}`)
      const existing = store.userByEmail(email)
      const u = existing ?? store.createUser(email)
      // доказательство согласия: какая редакция и когда (последнее по времени остаётся в карточке)
      if (consent) { u.consent = { version: consent, at: Date.now(), ip: ip(req) }; store.save() }
      store.event({ event: existing ? 'login' : 'signup', uid: u.id, t: Date.now() })
      return send(res, 200, { token: signToken(u.id), user: me(u), isNew: !existing, state: u.state, stateAt: u.stateAt })
    }

    // ===== Robokassa: уведомление об оплате (подпись проверяется паролем #2) и страницы возврата
    if (path === '/api/pay/robokassa/result' && (m === 'POST' || m === 'GET')) {
      if (!robokassaEnabled()) throw new HttpError(503, 'pay_off')
      limit(`rkr:${ip(req)}`, 300, 3600000)
      const raw = m === 'POST' ? (await readBody(req, 20_000)).toString('utf8') : url.search.slice(1)
      const params = Object.fromEntries(new URLSearchParams(raw))
      try {
        const answer = handleRobokassaResult(store, params)
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end(answer)
      } catch (e) {
        if (e.status) { console.error('[pay] robokassa:', e.message); throw new HttpError(e.status, e.message) }
        throw e
      }
    }
    if (m === 'GET' && (path === '/api/pay/robokassa/success' || path === '/api/pay/robokassa/fail')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      return res.end(returnPage(path.endsWith('success')))
    }

    // ===== админка: вход по коду из письма + приложение-аутентификатор, сессия в HttpOnly-cookie (server/admin-auth.mjs)
    if (path.startsWith('/api/admin/')) {
      const secure = config.dev ? false : String(req.headers['x-forwarded-proto'] ?? '') === 'https'
      const setCookie = (v) => ({ 'Set-Cookie': v })
      const sid = parseCookies(req.headers.cookie)[COOKIE]
      const ua = String(req.headers['user-agent'] ?? '')
      // защита от CSRF поверх SameSite=Strict: изменяющие запросы только со своей страницы и с особым заголовком
      if (m !== 'GET' && m !== 'HEAD') {
        const origin = req.headers.origin
        const host = String(req.headers.host ?? '')
        if (req.headers['x-requested-with'] !== 'atelier-admin' || (origin && !origin.endsWith('//' + host) && origin !== config.siteUrl)) throw new HttpError(403, 'forbidden')
      }

      if (path.startsWith('/api/admin/auth/')) {
        const step = path.slice('/api/admin/auth/'.length)
        if (m === 'GET' && step === 'me') {
          const email = sessionEmail(store, sid)
          if (!email) throw new HttpError(401, 'unauthorized')
          return send(res, 200, { email })
        }
        if (m === 'POST' && step === 'request') {
          limit(`aa-req:${ip(req)}`, 10, 3600000)
          const b = await json(req, 1000)
          const email = normEmail(b.email ?? '')
          // всегда один и тот же ответ, чтобы нельзя было выяснить, какие почты админские
          if (emailOk(email) && isAdminEmail(email)) {
            limit(`aa-reqm:${email}`, 6, 3600000)
            const r = issueAdminCode(store, email)
            if (!r.error) await mailer(email, r.code, 'admin').catch((e) => console.error('[admin] письмо не ушло:', e.message))
          } else console.warn(`[admin] запрос кода для чужой почты с ${ip(req)}`)
          return send(res, 200, { ok: true })
        }
        if (m === 'POST' && step === 'verify') {
          limit(`aa-ver:${ip(req)}`, 20, 3600000)
          const b = await json(req, 1000)
          const email = normEmail(b.email ?? '')
          const r = emailOk(email) && isAdminEmail(email) ? checkAdminCode(store, email, b.code) : 'wrong'
          if (r !== 'ok') { console.warn(`[admin] неверный код для ${email} с ${ip(req)}`); throw new HttpError(401, 'code_wrong') }
          if (adminRecord(store, email).lockedUntil > Date.now()) throw new HttpError(429, 'locked')
          return send(res, 200, nextStep(store, email))
        }
        if (m === 'POST' && step === 'totp') {
          limit(`aa-tp:${ip(req)}`, 30, 3600000)
          const b = await json(req, 1000)
          const t = readTicket(b.ticket)
          if (!t || !isAdminEmail(t.email)) throw new HttpError(401, 'ticket_invalid')
          const r = checkSecondFactor(store, t.email, t.stage, b.code)
          if (r.error) {
            if (r.justLocked) void notifyOps(`🚫 Админка: ${t.email} заблокирован на 15 минут, 5 неверных кодов подряд (${ip(req)})`)
            throw new HttpError(r.error === 'locked' ? 429 : 401, r.error === 'locked' ? 'locked' : 'code_wrong')
          }
          const id = createSession(store, t.email, { ip: ip(req), ua })
          void notifyOps(`🔐 Вход в админку: ${t.email}\nIP ${ip(req)}${t.stage === 'setup' ? '\nНастроен аутентификатор' : ''}${r.recoveryLeft !== undefined ? `\nИспользован резервный код, осталось ${r.recoveryLeft}` : ''}`)
          return send(res, 200, { ok: true, email: t.email, recovery: r.recovery }, setCookie(sessionCookie(id, secure)))
        }
        if (m === 'POST' && step === 'logout') { destroySession(store, sid); return send(res, 200, { ok: true }, setCookie(clearCookie(secure))) }
        throw new HttpError(404, 'not_found')
      }

      // CLI на самом сервере (support-cli.mjs): токен из .env, только с этой же машины и только для поддержки
      const tok = String(req.headers['x-admin-token'] ?? '')
      const localCli = (path.startsWith('/api/admin/support') || path === '/api/admin/reset-2fa' || path === '/api/admin/admins') && !req.headers['x-forwarded-for'] && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) &&
        config.supportAdminToken.length >= 16 && tok.length === config.supportAdminToken.length && timingSafeEqual(Buffer.from(tok), Buffer.from(config.supportAdminToken))
      const adminEmail = localCli ? 'cli' : sessionEmail(store, sid)
      if (!adminEmail) { limit(`admfail:${ip(req)}`, 60, 3600000); throw new HttpError(401, 'unauthorized') }
      if (m !== 'GET') console.log(`[admin] ${adminEmail} ${m} ${path} с ${ip(req)}`)
      limit(`adm:${ip(req)}`, 600, 3600000)

      if (m === 'GET' && path === '/api/admin/admins') return send(res, 200, { admins: adminsList(store), me: adminEmail })
      // потерян телефон: сбросить второй фактор может только команда на самом сервере (server/admin-cli.mjs), не из админки
      if (m === 'POST' && path === '/api/admin/reset-2fa') {
        if (!localCli) throw new HttpError(403, 'forbidden')
        const b = await json(req, 500)
        const email = normEmail(b.email ?? '')
        if (!isAdminEmail(email)) throw new HttpError(404, 'no_admin')
        reset2fa(store, email)
        void notifyOps(`♻️ Админка: сброшен аутентификатор для ${email}, при следующем входе он настроит новый`)
        return send(res, 200, { ok: true })
      }
      if (m === 'POST' && path === '/api/admin/logout-all') { destroyAllSessions(store, adminEmail); return send(res, 200, { ok: true }, setCookie(clearCookie(secure))) }
      if (m === 'GET' && path === '/api/admin/overview') return send(res, 200, { ...overview(store), log: recentLog(store) })
      if (m === 'GET' && path === '/api/admin/users') {
        const q = url.searchParams
        return send(res, 200, listUsers(store, { q: q.get('q') ?? '', plan: q.get('plan') ?? '', sort: q.get('sort') ?? 'new' }))
      }
      if (m === 'GET' && path === '/api/admin/payments') return send(res, 200, { payments: paymentsList(store) })
      const au = path.match(/^\/api\/admin\/users\/([a-f0-9]{24})(\/sub)?$/)
      if (au) {
        const target = store.user(au[1])
        if (!target) throw new HttpError(404, 'no_user')
        if (m === 'GET' && !au[2]) return send(res, 200, userDetail(store, target.id))
        if (m === 'POST' && au[2]) {
          const b = await json(req, 2000)
          // снятие и отключение автопродления доходят и до платёжной системы, иначе деньги продолжат списываться
          if ((b.action === 'cancel' || b.action === 'revoke') && target.sub?.subscriptionId && cpEnabled()) {
            try { await cancelSubscription(store, target, fetchImpl) } catch (e) { console.error('[admin] отмена в CloudPayments:', e.message); throw new HttpError(502, 'cancel_failed') }
          }
          const r = subAction(store, target, b, Date.now(), adminEmail)
          if (r.error) throw new HttpError(400, r.error)
          return send(res, 200, userDetail(store, target.id))
        }
        if (m === 'DELETE' && !au[2]) {
          if (target.sub?.subscriptionId && cpEnabled()) await cancelSubscription(store, target, fetchImpl).catch(() => {})
          logDelete(store, target, Date.now(), adminEmail)
          store.deleteUser(target.id)
          return send(res, 200, { ok: true })
        }
      }
    }
    if (path.startsWith('/api/admin/support')) {
      if (m === 'GET') {
        const email = normEmail(url.searchParams.get('email') ?? '')
        if (email) {
          const u = store.userByEmail(email)
          if (!u) throw new HttpError(404, 'no_user')
          return send(res, 200, supportView(store, u.id))
        }
        const threads = Object.entries(store.db.support ?? {}).filter(([id, t]) => store.user(id) && t.messages.length).map(([id, t]) => {
          const u = store.user(id); const last = t.messages[t.messages.length - 1]
          return { email: u.email, plan: u.sub?.plan ?? 'free', last, waiting: last.from === 'user' }
        }).sort((a, b) => b.last.at - a.last.at)
        return send(res, 200, { threads })
      }
      if (m === 'DELETE') {
        const u = store.userByEmail(normEmail(url.searchParams.get('email') ?? ''))
        if (!u) throw new HttpError(404, 'no_user')
        if (store.db.support) delete store.db.support[u.id]
        store.save()
        return send(res, 200, { ok: true })
      }
      if (m === 'POST') {
        const b = await json(req, 10_000)
        const u = store.userByEmail(normEmail(String(b.email ?? '')))
        const text = String(b.text ?? '').trim()
        if (!u) throw new HttpError(404, 'no_user')
        if (!text) throw new HttpError(400, 'empty')
        addMessage(store, u.id, 'team', text)
        return send(res, 200, { ok: true })
      }
    }

    // ===== всё ниже только для вошедших
    if (path.startsWith('/api/me') || path.startsWith('/api/support') || path.startsWith('/api/state') || path.startsWith('/api/ai') || path.startsWith('/api/pay/') && !path.startsWith('/api/pay/notify') || path.startsWith('/api/photos') && m !== 'GET') {
      const u = authUser(req)

      if (m === 'GET' && path === '/api/me') return send(res, 200, me(u))
      if (m === 'DELETE' && path === '/api/me') {
        // автопродление отключаем до удаления, иначе деньги продолжат списываться
        if (u.sub.subscriptionId && payEnabled()) await cancelSubscription(store, u, fetchImpl).catch(() => {})
        store.deleteUser(u.id)
        return send(res, 200, { ok: true })
      }

      // поддержка: переписка человека с командой
      if (m === 'GET' && path === '/api/support') return send(res, 200, supportView(store, u.id, url.searchParams.get('peek') !== '1'))
      if (m === 'POST' && path === '/api/support') {
        limit(`sp:${u.id}`, 10, 3600000)
        const b = await json(req, 10_000)
        const text = String(b.text ?? '').trim()
        if (text.length < 2) throw new HttpError(400, 'empty')
        if (text.length > 1500) throw new HttpError(400, 'too_long')
        addMessage(store, u.id, 'user', text)
        void notifyTeam({ email: u.email, plan: u.sub?.plan ?? 'free', text }, process.env, fetchImpl)
        return send(res, 200, supportView(store, u.id))
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
        const avoid = Array.isArray(b.avoid) ? b.avoid.filter((x) => typeof x === 'string').slice(0, 8) : []
        const ctx = { weather: b.weather, occasion: b.occasion, nogo: Array.isArray(b.nogo) ? b.nogo.filter((x) => typeof x === 'string').slice(0, 20) : [] }
        const prompt = buildUserPrompt({ items, occasion: b.occasion, wish: b.wish, weather: b.weather, nogo: b.nogo, avoid })
        // до двух запросов: второй, если ответ не разобрался или в образе осталась вещь, которая не подходит к погоде или поводу
        let outfit, lastErr, bestBad = Infinity
        for (let attempt = 0; attempt < 2 && bestBad > 0; attempt++) {
          try {
            const cand = repairOutfit(parseOutfit(await aiChat(SYSTEM, prompt), items), items, ctx)
            const bad = outfitProblems(cand, items, ctx).length
            if (bad < bestBad) { outfit = cand; bestBad = bad }
          } catch (e) { lastErr = e }
        }
        // лимит списываем только за удачный образ: ошибка модели не должна стоить человеку попытки
        if (!outfit) { console.error('[ai] не удалось:', lastErr?.message); throw new HttpError(502, 'ai_failed') }
        sp.commit()
        store.event({ event: 'outfit_ok', uid: u.id, t: Date.now() })
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
          if (Array.isArray(out.items) && out.items.length) { sp.commit(); store.event({ event: 'photo_ok', uid: u.id, t: Date.now() }) }
          return send(res, 200, out)
        } finally { inflight-- }
      }

      if (m === 'POST' && path === '/api/pay/intent') {
        if (!payEnabled()) throw new HttpError(503, 'pay_off')
        limit(`pi:${u.id}`, 20, 3600000)
        const b = await json(req, 1000)
        if (!['sub', 'plus'].includes(b.plan)) throw new HttpError(400, 'bad_plan')
        if (robokassaEnabled()) return send(res, 200, { provider: 'robokassa', url: buildRobokassaUrl(store, u, b.plan) })
        return send(res, 200, buildIntent(u, b.plan))
      }
      if (m === 'POST' && path === '/api/pay/cancel') {
        if (!payEnabled()) throw new HttpError(503, 'pay_off')
        if (!u.sub.subscriptionId) { u.sub.cancelled = true; store.save(); return send(res, 200, me(u)) } // разовая оплата без автопродления
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
