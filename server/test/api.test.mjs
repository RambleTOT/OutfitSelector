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
    return { status: r.status, body: text ? JSON.parse(text) : null }
  }
  const login = async (email = 'a@b.ru') => {
    await call('POST', '/api/auth/request', { email })
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
  await t.call('POST', '/api/auth/request', { email: 'x@y.ru' })
  assert.equal((await t.call('POST', '/api/auth/request', { email: 'x@y.ru' })).status, 429)
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
  assert.equal(r.body.amount, 300)
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
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '300', AccountId: user.id, Data: data })).body, { code: 0 })
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '1', AccountId: user.id, Data: data })).body, { code: 11 })
  assert.deepEqual((await notify(t, 'check', { TransactionId: '7', Amount: '300', AccountId: 'no', Data: data })).body, { code: 10 })

  assert.deepEqual((await notify(t, 'pay', { TransactionId: '7', Amount: '300', AccountId: user.id, SubscriptionId: 'sc_1', Data: data })).body, { code: 0 })
  await notify(t, 'pay', { TransactionId: '7', Amount: '300', AccountId: user.id, SubscriptionId: 'sc_1', Data: data }) // повтор
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
  await notify(t, 'pay', { TransactionId: '9', Amount: '600', AccountId: user.id, SubscriptionId: 'sc_2', Data: data })
  await notify(t, 'recurrent', { Id: 'sc_2', AccountId: user.id, Status: 'Cancelled' })
  let me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.sub.cancelled, true)
  assert.equal(me.body.sub.effective, 'plus') // отмена не обрывает оплаченный период
  await notify(t, 'refund', { TransactionId: '9', Amount: '600' })
  me = await t.call('GET', '/api/me', undefined, auth)
  assert.equal(me.body.sub.effective, 'free')
  t.server.close()
})

test('отмена подписки идёт в CloudPayments с Basic-авторизацией', async () => {
  let seen
  const t = await boot({ fetchImpl: async (url, init) => { seen = { url, init }; return { json: async () => ({ Success: true }) } } })
  const { auth, user } = await t.login()
  await notify(t, 'pay', { TransactionId: '5', Amount: '300', AccountId: user.id, SubscriptionId: 'sc_5', Data: JSON.stringify({ plan: 'sub' }) })
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
