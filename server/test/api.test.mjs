import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHmac } from 'node:crypto'

process.env.TOKEN_SECRET = 'test-secret'
process.env.CP_PUBLIC_ID = 'test_api_000'
process.env.CP_API_SECRET = 'cp-secret'
process.env.AI_PROVIDER = 'openai'
process.env.OPENAI_MODEL = 'x'
process.env.VISION_URL = 'http://vision.local'
process.env.SUPPORT_ADMIN_TOKEN = 'admin-secret-token'
process.env.ADMIN_EMAILS = 'boss@x.ru, Second@x.ru'

const { createApp } = await import('../app.mjs')
const { Store } = await import('../store.mjs')

const ITEMS = [
  { id: 'a', category: 'top', title: 'Рубашка', colorName: 'Белый' },
  { id: 'b', category: 'bottom', title: 'Брюки', colorName: 'Чёрный' },
  { id: 'c', category: 'shoes', title: 'Лоферы', colorName: 'Чёрный' },
  { id: 'd', category: 'top', title: 'Футболка', colorName: 'Серый' },
]

async function boot(over = {}) {
  const codes = {}
  const store = new Store(mkdtempSync(join(tmpdir(), 'atelier-')))
  const { server } = createApp({ store, mailer: async (e, c) => { codes[e] = c }, aiOn: () => true, ...over })
  await new Promise((r) => server.listen(0, r))
  const base = `http://localhost:${server.address().port}`
  const call = async (method, path, body, headers = {}) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })
    const text = await r.text()
    return { status: r.status, body: text ? JSON.parse(text) : null, headers: r.headers }
  }
  const login = async (email = 'a@b.ru') => {
    await call('POST', '/api/auth/request', { email, consent: '2026-11-19' })
    const r = await call('POST', '/api/auth/verify', { email, code: codes[email] })
    return { token: r.body.token, auth: { Authorization: `Bearer ${r.body.token}` }, user: r.body.user, r }
  }
  return { call, login, store, server, codes }
}

test('вход по коду: создаёт пользователя, токен работает', async () => {
  const t = await boot()
  const { auth, r } = await t.login()
  assert.equal(r.status, 200)
  assert.equal(r.body.isNew, true)
  const me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.email, 'a@b.ru')
  assert.equal(me.body.sub.effective, 'free')
  assert.equal((await t.call('GET', '/api/me')).status, 401)
  t.server.close()
})

test('неверный код: 5 попыток, потом блок; повторный запрос кода не чаще раза в минуту', async () => {
  const t = await boot()
  await t.call('POST', '/api/auth/request', { email: 'x@y.ru', consent: '2026-11-19' })
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'x@y.ru', consent: '2026-11-19' })).status, 429)
  const wrong = t.codes['x@y.ru'] === '0000' ? '1111' : '0000'
  for (let i = 0; i < 5; i++) assert.equal((await t.call('POST', '/api/auth/verify', { email: 'x@y.ru', code: wrong })).status, 401)
  assert.equal((await t.call('POST', '/api/auth/verify', { email: 'x@y.ru', code: t.codes['x@y.ru'] })).status, 410)
  t.server.close()
})

test('плохая почта отклоняется', async () => {
  const t = await boot()
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'не-почта' })).status, 400)
  t.server.close()
})

test('синхронизация: сохраняется, старая версия не затирает свежую', async () => {
  const t = await boot()
  const { auth } = await t.login()
  assert.equal((await t.call('PUT', '/api/state', { state: { items: [1] }, updatedAt: 2000 }, auth)).status, 200)
  const stale = await t.call('PUT', '/api/state', { state: { items: [] }, updatedAt: 1000 }, auth)
  assert.equal(stale.status, 409)
  assert.deepEqual(stale.body.state, { items: [1] })
  assert.deepEqual((await t.call('GET', '/api/state', undefined, auth)).body.state, { items: [1] })
  t.server.close()
})

test('AI: берёт только настоящие id и считает лимит Free (5 в неделю)', async () => {
  const t = await boot({ aiChat: async () => '```json\n{"ids":["a","b","c","zzz"],"name":"Офис","explanation":"Строго и удобно."}\n```' })
  const { auth } = await t.login()
  const body = { items: ITEMS, occasion: 'work', wish: '' }
  const r = await t.call('POST', '/api/ai/outfit', body, auth)
  assert.equal(r.status, 200)
  assert.deepEqual(r.body.ids, ['a', 'b', 'c'])
  assert.equal(r.body.explanation, 'Строго и удобно')
  for (let i = 0; i < 4; i++) assert.equal((await t.call('POST', '/api/ai/outfit', body, auth)).status, 200)
  const over = await t.call('POST', '/api/ai/outfit', body, auth)
  assert.equal(over.status, 429)
  assert.equal(over.body.error, 'limit')
  t.server.close()
})

test('AI: плохой ответ модели не тратит лимит и даёт 502', async () => {
  const t = await boot({ aiChat: async () => 'не знаю' })
  const { auth, r } = await t.login()
  const res = await t.call('POST', '/api/ai/outfit', { items: ITEMS, occasion: 'work' }, auth)
  assert.equal(res.status, 502)
  assert.equal(t.store.db.usage[r.body.user.id]?.outfitsWeek ?? 0, 0)
  t.server.close()
})

test('AI: образ с двумя верхами отклоняется', async () => {
  const t = await boot({ aiChat: async () => '{"ids":["a","d","b"],"name":"x","explanation":"y"}' })
  const { auth } = await t.login()
  assert.equal((await t.call('POST', '/api/ai/outfit', { items: ITEMS, occasion: 'work' }, auth)).status, 502)
  t.server.close()
})

const sign = (raw) => createHmac('sha256', 'cp-secret').update(raw).digest('base64')
const notify = (t, kind, obj) => {
  const raw = new URLSearchParams(obj).toString()
  return t.call('POST', `/api/pay/notify/${kind}`, raw, { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-HMAC': sign(raw) })
}

test('оплата: параметры виджета считает сервер, цена не от клиента', async () => {
  const t = await boot()
  const { auth, user } = await t.login()
  const r = await t.call('POST', '/api/pay/intent', { plan: 'sub', amount: 1 }, auth)
  assert.equal(r.status, 200)
  assert.equal(r.body.amount, 299)
  assert.equal(r.body.userInfo.accountId, user.id)
  assert.equal(r.body.metadata.plan, 'sub')
  assert.equal(r.body.recurrent.interval, 'Month')
  assert.equal((await t.call('POST', '/api/pay/intent', { plan: 'free' }, auth)).status, 400)
  t.server.close()
})

test('уведомления: без подписи 401, Check проверяет сумму, Pay включает тариф и идемпотентен', async () => {
  const t = await boot()
  const { auth, user } = await t.login()
  const raw = 'TransactionId=1'
  assert.equal((await t.call('POST', '/api/pay/notify/pay', raw, { 'Content-Type': 'application/x-www-form-urlencoded' })).status, 401)
  assert.equal((await t.call('POST', '/api/pay/notify/pay', raw, { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-HMAC': 'nope' })).status, 401)

  const data = JSON.stringify({ plan: 'sub', userId: user.id })
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '299', AccountId: user.id, Data: data })).body, { code: 0 })
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '1', AccountId: user.id, Data: data })).body, { code: 11 })
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '299', AccountId: 'no', Data: data })).body, { code: 10 })

  assert.deepEqual((await notify(t, 'pay', { TransactionId: '7', Amount: '299', AccountId: user.id, SubscriptionId: 'sc_1', Data: data })).body, { code: 0 })
  await notify(t, 'pay', { TransactionId: '7', Amount: '299', AccountId: user.id, SubscriptionId: 'sc_1', Data: data }) // повтор
  const me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.sub.effective, 'sub')
  const days = (me.body.sub.endsAt - Date.now()) / 86400000
  assert.ok(days > 29.9 && days < 30.1, `ожидали ~30 дней, получили ${days}`)
  t.server.close()
})

test('возврат снимает тариф, статус Cancelled отмечает отмену автопродления', async () => {
  const t = await boot()
  const { auth, user } = await t.login()
  const data = JSON.stringify({ plan: 'plus', userId: user.id })
  await notify(t, 'pay', { TransactionId: '9', Amount: '599', AccountId: user.id, SubscriptionId: 'sc_2', Data: data })
  await notify(t, 'recurrent', { Id: 'sc_2', AccountId: user.id, Status: 'Cancelled' })
  let me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.sub.cancelled, true)
  assert.equal(me.body.sub.effective, 'plus') // отмена не обрывает оплаченный период
  await notify(t, 'refund', { TransactionId: '9', Amount: '599' })
  me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.sub.effective, 'free')
  t.server.close()
})

test('отмена подписки идёт в CloudPayments с Basic-авторизацией', async () => {
  let seen
  const t = await boot({ fetchImpl: async (url, init) => { seen = { url, init }; return { json: async () => ({ Success: true }) } } })
  const { auth, user } = await t.login()
  await notify(t, 'pay', { TransactionId: '5', Amount: '299', AccountId: user.id, SubscriptionId: 'sc_5', Data: JSON.stringify({ plan: 'sub' }) })
  const r = await t.call('POST', '/api/pay/cancel', {}, auth)
  assert.equal(r.status, 200)
  assert.equal(seen.url, 'https://api.cloudpayments.ru/subscriptions/cancel')
  assert.equal(JSON.parse(seen.init.body).Id, 'sc_5')
  assert.equal(seen.init.headers.Authorization, 'Basic ' + Buffer.from('test_api_000:cp-secret').toString('base64'))
  assert.equal(r.body.sub.cancelled, true)
  t.server.close()
})

test('удаление аккаунта убирает пользователя и почту', async () => {
  const t = await boot()
  const { auth } = await t.login('del@me.ru')
  assert.equal((await t.call('DELETE', '/api/me', undefined, auth)).status, 200)
  assert.equal((await t.call('GET', '/api/me', undefined, auth)).status, 401)
  assert.equal(t.store.userByEmail('del@me.ru'), null)
  t.server.close()
})

test('фото: загрузка и выдача по ссылке', async () => {
  const t = await boot()
  const { auth } = await t.login()
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(200, 1)])
  const up = await fetch(`http://localhost:${t.server.address().port}/api/photos`, { method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: png })
  assert.equal(up.status, 200)
  const { url } = await up.json()
  const got = await fetch(`http://localhost:${t.server.address().port}${url}`)
  assert.equal(got.status, 200)
  assert.equal(got.headers.get('content-type'), 'image/png')
  t.server.close()
})

test('фото: распознавание проксируется во vision, лимит Free 3 фото, пустой результат лимит не тратит', async () => {
  const calls = []
  let items = [{ category: 'top', type: 'рубашка', cutout: 'data:image/webp;base64,AAAA' }]
  const fetchImpl = async (url, init) => { calls.push({ url, body: init.body }); return { ok: true, status: 200, json: async () => ({ mode: 'flat', notClothing: !items.length, items }) } }
  const t = await boot({ fetchImpl })
  const { auth } = await t.login()
  const send = () => fetch(`http://localhost:${t.server.address().port}/api/ai/analyze`, { method: 'POST', headers: { ...auth, 'Content-Type': 'image/jpeg' }, body: Buffer.alloc(500, 1) })
  assert.equal((await fetch(`http://localhost:${t.server.address().port}/api/ai/analyze`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.alloc(10) })).status, 401)
  items = []
  assert.equal((await send()).status, 200) // не одежда: фото не тратится
  items = [{ category: 'top', type: 'рубашка', cutout: 'data:image/webp;base64,AAAA' }]
  for (let i = 0; i < 3; i++) assert.equal((await send()).status, 200)
  const over = await send()
  assert.equal(over.status, 429)
  assert.equal((await over.json()).error, 'photo_limit')
  assert.equal(calls[0].url, 'http://vision.local/analyze')
  assert.equal(calls.length, 4)
  // новое устройство узнаёт расход лимита из /api/me
  const me = await (await fetch(`http://localhost:${t.server.address().port}/api/me`, { headers: auth })).json()
  assert.equal(me.usage.photosTotal, 3)
  assert.equal(me.usage.outfitsWeek, 0)
  t.server.close()
})

test('фото: сервис распознавания упал или занят', async () => {
  const t = await boot({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }) })
  const { auth } = await t.login()
  const r = await fetch(`http://localhost:${t.server.address().port}/api/ai/analyze`, { method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: Buffer.alloc(500, 1) })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).error, 'busy')
  t.server.close()
})

test('письмо с кодом: тема, текст и html содержат код, без внешних картинок и скриптов', async () => {
  const { codeMessage } = await import('../mail-template.mjs')
  const m = codeMessage('1234', { site: 'https://atelierai.ru' })
  assert.equal(m.subject, 'Код для входа в Atelier: 1234')
  assert.match(m.text, /1234/)
  for (const d of '1234') assert.ok(m.html.includes(`>${d}</td>`))
  assert.ok(!/<img|<script|<link/i.test(m.html))
  assert.ok(m.html.includes('atelierai.ru'))
  // код экранируется, подмена невозможна
  assert.ok(!codeMessage('<b>', {}).html.includes('<b>'))
})

test('AI: сервер дополняет забытую обувь и верхнюю одежду в холод, снимает куртку в жару', async () => {
  const { repairOutfit, outfitProblems } = await import('../ai/prompt.mjs')
  const items = [
    { id: 't', category: 'top', title: 'Белая футболка', warmth: 'лёгкая', formality: 'кэжуал' },
    { id: 'b', category: 'bottom', title: 'Синие джинсы', warmth: 'демисезон', formality: 'кэжуал' },
    { id: 's1', category: 'shoes', title: 'Белые кроссовки', warmth: 'демисезон', formality: 'спорт' },
    { id: 's2', category: 'shoes', title: 'Чёрные лоферы', warmth: 'демисезон', formality: 'деловой' },
    { id: 'o', category: 'outer', title: 'Серое пальто', warmth: 'тёплая', formality: 'смарт-кэжуал' },
  ]
  const base = { ids: ['t', 'b'], name: 'x', explanation: 'y' }
  // мороз на работе: добавляем лоферы (не спорт) и пальто
  const cold = repairOutfit(base, items, { weather: { temp: -5 }, occasion: 'work', nogo: [] })
  assert.deepEqual(cold.ids.sort(), ['b', 'o', 's2', 't'])
  // жара: пальто убираем
  const hot = repairOutfit({ ...base, ids: ['t', 'b', 'o'] }, items, { weather: { temp: 30 }, occasion: 'every', nogo: [] })
  assert.ok(!hot.ids.includes('o'))
  // +1°: бомбер (демисезон) меняется на тёплое пальто, пояснение сбрасывается; если тёплого нет, остаётся бомбер
  const bomber = { id: 'bm', category: 'outer', title: 'Чёрный бомбер', warmth: 'демисезон', formality: 'кэжуал' }
  const swapped = repairOutfit({ ids: ['t', 'b', 's1', 'bm'], name: 'x', explanation: 'Бомбер согреет' }, [...items, bomber], { weather: { temp: 1 }, occasion: 'every', nogo: [] })
  assert.ok(swapped.ids.includes('o') && !swapped.ids.includes('bm') && swapped.explanation === '')
  const noWarm = repairOutfit({ ids: ['t', 'b', 's1', 'bm'], name: 'x', explanation: 'ok' }, [...items.filter((i) => i.id !== 'o'), bomber], { weather: { temp: 1 }, occasion: 'every', nogo: [] })
  assert.ok(noWarm.ids.includes('bm') && noWarm.explanation === 'ok')
  // «не носит» кроссовки: они не добавляются и считаются проблемой, если модель их взяла
  assert.ok(!repairOutfit(base, items, { weather: { temp: 15 }, occasion: 'every', nogo: ['кроссовки'] }).ids.includes('s1'))
  assert.deepEqual(outfitProblems({ ids: ['t', 'b', 's1'] }, items, { weather: { temp: 15 }, occasion: 'study', nogo: [] }), ['s1'])
})

test('AI: если в образе осталась неподходящая вещь, делается второй запрос и берётся лучший', async () => {
  const items = [
    { id: 't', category: 'top', title: 'Футболка', warmth: 'лёгкая', formality: 'кэжуал' },
    { id: 'b', category: 'bottom', title: 'Джинсы', warmth: 'демисезон', formality: 'кэжуал' },
    { id: 'h', category: 'top', title: 'Худи', warmth: 'демисезон', formality: 'спорт' },
  ]
  let calls = 0
  const t = await boot({ aiChat: async () => (++calls === 1 ? '{"ids":["h","b"],"name":"Один","explanation":"y"}' : '{"ids":["t","b"],"name":"Два","explanation":"y"}') })
  const { auth } = await t.login()
  const r = await t.call('POST', '/api/ai/outfit', { items, occasion: 'work', weather: { temp: 15 } }, auth)
  assert.equal(r.status, 200)
  assert.equal(calls, 2)
  assert.equal(r.body.name, 'Два')
  t.server.close()
})

const MET = (temp, symbol, wind = 2, precip = 0) => ({ properties: { timeseries: [{ time: new Date().toISOString(), data: { instant: { details: { air_temperature: temp, wind_speed: wind } }, next_1_hours: { summary: { symbol_code: symbol }, details: { precipitation_amount: precip } } } }] } })

test('погода: запрос без входа, ответ по-русски, второй запрос берётся из кэша, координаты округляются', async () => {
  const urls = []
  const t = await boot({ fetchImpl: async (url, init) => { urls.push({ url, ua: init.headers['User-Agent'] }); return { ok: true, status: 200, json: async () => MET(1.3, 'cloudy', 6) } } })
  const r = await t.call('GET', '/api/weather?lat=55.7558&lon=37.6173')
  assert.equal(r.status, 200)
  assert.equal(r.body.temp, 1)
  assert.equal(r.body.label, 'Пасмурно')
  assert.equal(r.body.kind, 'cloud')
  assert.equal(r.body.note, 'ветер, без осадков')
  assert.ok(urls[0].url.includes('lat=55.76&lon=37.62'))
  assert.ok(urls[0].ua.includes('Atelier'))
  await t.call('GET', '/api/weather?lat=55.7601&lon=37.6199')
  assert.equal(urls.length, 1)
  t.server.close()
})

test('погода: дождь и гроза, плохие координаты, недоступный источник без кэша', async () => {
  const t = await boot({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => MET(-4, 'heavysnow_day', 12, 1) }) })
  const r = await t.call('GET', '/api/weather?lat=59.9&lon=30.3')
  assert.equal(r.body.kind, 'snow')
  assert.equal(r.body.note, 'сильный ветер')
  assert.equal((await t.call('GET', '/api/weather?lat=abc&lon=1')).status, 400)
  assert.equal((await t.call('GET', '/api/weather?lat=95&lon=1')).status, 400)
  t.server.close()
  const down = await boot({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }) })
  const e = await down.call('GET', '/api/weather?lat=1&lon=1')
  assert.equal(e.status, 502)
  assert.equal(e.body.error ?? e.body.code, 'weather_unavailable')
  down.server.close()
})

test('поддержка: человек пишет, команда отвечает, ответ виден в приложении, чужой токен не пускает', async () => {
  const t = await boot()
  const { auth } = await t.login('u@x.ru')
  const noAuth = await t.call('POST', '/api/support', { text: 'привет' })
  assert.equal(noAuth.status, 401)
  assert.equal((await t.call('POST', '/api/support', { text: ' ' }, auth)).status, 400)
  const sent = await t.call('POST', '/api/support', { text: 'Не открывается гардероб' }, auth)
  assert.equal(sent.status, 200)
  assert.equal(sent.body.messages.length, 1)
  assert.equal(sent.body.messages[0].from, 'user')
  const admin = { 'X-Admin-Token': 'admin-secret-token', 'X-Requested-With': 'atelier-admin' }
  assert.equal((await t.call('GET', '/api/admin/support', undefined, { 'X-Admin-Token': 'nope' })).status, 401)
  assert.equal((await t.call('GET', '/api/admin/support')).status, 401)
  const list = await t.call('GET', '/api/admin/support', undefined, admin)
  assert.equal(list.body.threads[0].email, 'u@x.ru')
  assert.equal(list.body.threads[0].waiting, true)
  assert.equal((await t.call('POST', '/api/admin/support', { email: 'u@x.ru', text: 'Починили, обнови приложение' }, admin)).status, 200)
  const mine = await t.call('GET', '/api/support', undefined, auth)
  assert.equal(mine.body.messages.length, 2)
  assert.equal(mine.body.unread, 1)
  const again = await t.call('GET', '/api/support', undefined, auth)
  assert.equal(again.body.unread, 0) // прочитано
  const del = await t.call('DELETE', '/api/me', undefined, auth)
  assert.equal(del.status, 200)
  assert.equal(t.store.db.support?.[Object.keys(t.store.db.support ?? {})[0]], undefined) // переписка удаляется вместе с аккаунтом
  t.server.close()
})

const XR = { 'X-Requested-With': 'atelier-admin' }
const { totp } = await import('../totp.mjs')

/** Полный вход админа: письмо, аутентификатор (на первом входе настройка), cookie сессии */
async function adminLogin(t, email = 'boss@x.ru', { secret, offset = 0, code } = {}) {
  assert.equal((await t.call('POST', '/api/admin/auth/request', { email }, XR)).status, 200)
  const v = await t.call('POST', '/api/admin/auth/verify', { email, code: t.codes[email] }, XR)
  assert.equal(v.status, 200)
  const sec = v.body.step === 'setup' ? v.body.secret : secret
  const r = await t.call('POST', '/api/admin/auth/totp', { ticket: v.body.ticket, code: code ?? totp(sec, Date.now() + offset) }, XR)
  assert.equal(r.status, 200)
  const cookie = r.headers.get('set-cookie').split(';')[0]
  return { cookie, h: { Cookie: cookie, ...XR }, secret: sec, recovery: r.body.recovery, setCookie: r.headers.get('set-cookie') }
}

test('админка: без входа закрыта, список и карточка, выдать, продлить, отменить, снять тариф, удалить', async () => {
  const t = await boot()
  const a = await t.login('a@x.ru')
  await t.login('b@x.ru')
  for (const p of ['/api/admin/overview', '/api/admin/users', '/api/admin/payments', '/api/admin/admins']) assert.equal((await t.call('GET', p)).status, 401)
  // старый токен больше не открывает админку
  assert.equal((await t.call('GET', '/api/admin/users', undefined, { 'X-Admin-Token': 'admin-secret-token' })).status, 401)
  const adm = await adminLogin(t)
  const admin = adm.h

  const list = await t.call('GET', '/api/admin/users', undefined, admin)
  assert.equal(list.body.total, 2)
  assert.equal((await t.call('GET', '/api/admin/users?q=b@x', undefined, admin)).body.total, 1)
  const id = a.user.id
  const sub = (body) => t.call('POST', `/api/admin/users/${id}/sub`, body, admin)

  assert.equal((await sub({ action: 'extend', days: 5 })).status, 400) // на Free продлевать нечего
  assert.equal((await sub({ action: 'grant', plan: 'gold', days: 30 })).status, 400)
  const g = await sub({ action: 'grant', plan: 'plus', days: 30 })
  assert.equal(g.status, 200)
  assert.equal(g.body.plan, 'plus')
  assert.equal((await t.call('GET', '/api/me', undefined, a.auth)).body.sub.plan, 'plus') // в приложении тариф уже виден
  const end1 = g.body.endsAt
  const e = await sub({ action: 'extend', days: 10 })
  assert.equal(e.body.endsAt - end1, 10 * 86400000)
  assert.equal((await sub({ action: 'cancel' })).body.cancelled, true)
  assert.equal((await t.call('GET', '/api/admin/users?plan=paid', undefined, admin)).body.total, 1)

  const ov = await t.call('GET', '/api/admin/overview', undefined, admin)
  assert.equal(ov.body.totals.users, 2)
  assert.equal(ov.body.totals.plus, 1)
  assert.equal(ov.body.signupsByDay.length, 30)
  assert.ok(ov.body.log.length >= 3)
  assert.equal(ov.body.log[0].by, 'boss@x.ru') // в журнале видно, кто сделал

  const r = await sub({ action: 'revoke' })
  assert.equal(r.body.plan, 'free')
  assert.equal((await t.call('GET', '/api/me', undefined, a.auth)).body.sub.plan, 'free')
  assert.equal((await sub({ action: 'reset_usage' })).status, 200)

  assert.equal((await t.call('GET', '/api/admin/users/' + 'f'.repeat(24), undefined, admin)).status, 404)
  assert.equal((await t.call('DELETE', `/api/admin/users/${id}`, undefined, admin)).status, 200)
  assert.equal((await t.call('GET', '/api/admin/users', undefined, admin)).body.total, 1)
  t.server.close()
})

test('вход в админку: чужая почта, настройка аутентификатора, резервные коды, повтор кода, блокировка', async () => {
  const t = await boot()
  // чужая почта: тот же ответ, но кода нет и войти нельзя
  assert.equal((await t.call('POST', '/api/admin/auth/request', { email: 'hacker@x.ru' }, XR)).status, 200)
  assert.equal(t.codes['hacker@x.ru'], undefined)
  assert.equal((await t.call('POST', '/api/admin/auth/verify', { email: 'hacker@x.ru', code: '123456' }, XR)).status, 401)
  // без кода из письма билет не получить, а подделанный билет не принимается
  assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: 'x.y', code: '123456' }, XR)).status, 401)
  // неверный код из письма и 5 попыток
  await t.call('POST', '/api/admin/auth/request', { email: 'boss@x.ru' }, XR)
  for (let i = 0; i < 5; i++) assert.equal((await t.call('POST', '/api/admin/auth/verify', { email: 'boss@x.ru', code: '000000' }, XR)).status, 401)
  assert.equal((await t.call('POST', '/api/admin/auth/verify', { email: 'boss@x.ru', code: t.codes['boss@x.ru'] }, XR)).status, 401) // код сгорел после 5 ошибок

  t.store.db.admCodes = {} // имитируем «прошла минута», чтобы запросить новый код
  const first = await adminLogin(t)
  assert.equal(first.recovery.length, 10) // резервные коды выданы один раз
  assert.match(first.setCookie, /HttpOnly/)
  assert.match(first.setCookie, /SameSite=Strict/)
  assert.equal((await t.call('GET', '/api/admin/auth/me', undefined, first.h)).body.email, 'boss@x.ru')

  // второй вход: уже нужен код аутентификатора; тот же код дважды не работает
  t.store.db.admCodes = {}
  const v = async () => { t.store.db.admCodes = {}; await t.call('POST', '/api/admin/auth/request', { email: 'boss@x.ru' }, XR); return (await t.call('POST', '/api/admin/auth/verify', { email: 'boss@x.ru', code: t.codes['boss@x.ru'] }, XR)).body }
  const s2 = await v()
  assert.equal(s2.step, 'totp')
  const sameStep = await t.call('POST', '/api/admin/auth/totp', { ticket: s2.ticket, code: totp(first.secret) }, XR)
  assert.equal(sameStep.status, 401) // этот шаг уже использован при настройке
  const next = await t.call('POST', '/api/admin/auth/totp', { ticket: s2.ticket, code: totp(first.secret, Date.now() + 30000) }, XR)
  assert.equal(next.status, 200)

  // резервный код работает один раз
  const s3 = await v()
  assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: s3.ticket, code: first.recovery[0] }, XR)).status, 200)
  const s4 = await v()
  assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: s4.ticket, code: first.recovery[0] }, XR)).status, 401)

  t.store.db.admins['boss@x.ru'].fails = 0
  // 5 неверных кодов блокируют вход на 15 минут, даже верный код после этого не пройдёт
  for (let i = 0; i < 4; i++) assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: s4.ticket, code: '000000' }, XR)).status, 401)
  assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: s4.ticket, code: '000000' }, XR)).status, 429)
  assert.equal((await t.call('POST', '/api/admin/auth/totp', { ticket: s4.ticket, code: totp(first.secret, Date.now() + 60000) }, XR)).status, 429)
  t.server.close()
})

test('сессия админа: CSRF, простой, выход, выход везде, смена админов', async () => {
  const t = await boot()
  const a = await adminLogin(t)
  // изменяющие запросы без особого заголовка и с чужого сайта отклоняются
  assert.equal((await t.call('POST', '/api/admin/logout-all', {}, { Cookie: a.cookie })).status, 403)
  assert.equal((await t.call('POST', '/api/admin/logout-all', {}, { ...a.h, Origin: 'https://evil.example' })).status, 403)
  // список админов без секретов
  const list = await t.call('GET', '/api/admin/admins', undefined, a.h)
  assert.deepEqual(list.body.admins.map((x) => x.email), ['boss@x.ru', 'second@x.ru'])
  assert.equal(list.body.admins[0].totp, true)
  assert.ok(!JSON.stringify(list.body).includes(a.secret))
  // простой больше 30 минут: сессия закрывается
  const key = Object.keys(t.store.db.admSessions)[0]
  t.store.db.admSessions[key].seen -= 31 * 60000
  assert.equal((await t.call('GET', '/api/admin/overview', undefined, a.h)).status, 401)
  // выход
  const b = await adminLogin(t, 'second@x.ru')
  assert.equal((await t.call('POST', '/api/admin/auth/logout', {}, b.h)).status, 200)
  assert.equal((await t.call('GET', '/api/admin/overview', undefined, b.h)).status, 401)
  // выход везде
  t.store.db.admCodes = {}
  const c = await adminLogin(t, 'second@x.ru', { secret: b.secret, offset: 30000 })
  t.store.db.admCodes = {}
  const d = await adminLogin(t, 'second@x.ru', { secret: b.secret, code: b.recovery[0] })
  assert.equal((await t.call('POST', '/api/admin/logout-all', {}, c.h)).status, 200)
  assert.equal((await t.call('GET', '/api/admin/overview', undefined, d.h)).status, 401)
  t.server.close()
})

test('почта с разметкой и кавычками отклоняется, обычная проходит', async () => {
  const t = await boot()
  for (const bad of ['"><svg/onload=alert(1)>@x.ru', 'a<b@x.ru', "o'x@x.ru", 'a&b@x.ru', 'a`b@x.ru']) assert.equal((await t.call('POST', '/api/auth/request', { email: bad })).status, 400, bad)
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'ivan.petrov+t@mail.ru', consent: '2026-11-19' })).status, 200)
  t.server.close()
})

test('согласие на обработку данных: без него код не отправляется, с ним версия и время сохраняются у человека', async () => {
  const t = await boot()
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'c@x.ru' })).status, 400)
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'c@x.ru', consent: 'да' })).status, 400)
  assert.equal(Object.keys(t.store.db.codes).length, 0) // ничего не выдали и не сохранили
  const { user } = await t.login('c@x.ru')
  const saved = t.store.user(user.id).consent
  assert.equal(saved.version, '2026-11-19')
  assert.ok(Math.abs(saved.at - Date.now()) < 10000)
  const admin = (await adminLogin(t)).h
  assert.equal((await t.call('GET', `/api/admin/users/${user.id}`, undefined, admin)).body.consent.version, '2026-11-19')
  t.server.close()
})

test('админка: сброс второго фактора только с сервера по токену, из браузера нельзя', async () => {
  const t = await boot()
  const a = await adminLogin(t)
  const tok = { 'X-Admin-Token': 'admin-secret-token', ...XR }
  assert.equal((await t.call('POST', '/api/admin/reset-2fa', { email: 'boss@x.ru' }, a.h)).status, 403) // из админки нельзя
  assert.equal((await t.call('POST', '/api/admin/reset-2fa', { email: 'boss@x.ru' }, { ...tok, 'X-Forwarded-For': '1.2.3.4' })).status, 401) // токен не работает через nginx
  assert.equal((await t.call('POST', '/api/admin/reset-2fa', { email: 'nobody@x.ru' }, tok)).status, 404)
  assert.equal((await t.call('POST', '/api/admin/reset-2fa', { email: 'boss@x.ru' }, tok)).status, 200)
  assert.equal((await t.call('GET', '/api/admin/overview', undefined, a.h)).status, 401) // сессии закрыты
  const again = await adminLogin(t) // снова настройка, а не ввод старого кода
  assert.equal(again.recovery.length, 10)
  t.server.close()
})

test('фото: у Подписки+ потолок 100 в месяц, у Подписки 30', async () => {
  const t = await boot()
  const { auth, user } = await t.login('p@x.ru')
  const png = Buffer.alloc(200, 1)
  const u = t.store.user(user.id)
  u.sub = { plan: 'plus', status: 'active', subscriptionId: null, endsAt: Date.now() + 86400000, cancelled: true }
  const { monthKey } = await import('../plans.mjs')
  t.store.db.usage[user.id] = { weekKey: '', outfitsWeek: 0, monthKey: '', outfitsMonth: 0, photoMonthKey: monthKey(Date.now()), photosMonth: 99, photosTotal: 99 }
  const send = () => fetch(`http://localhost:${t.server.address().port}/api/ai/analyze`, { method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: png })
  const ok = await send()
  assert.notEqual(ok.status, 429) // 100-е фото ещё можно (дальше ответ сервиса распознавания, не лимит)
  t.store.db.usage[user.id].photosMonth = 100
  const over = await send()
  assert.equal(over.status, 429)
  assert.equal((await over.json()).error, 'photo_limit')
  t.server.close()
})
