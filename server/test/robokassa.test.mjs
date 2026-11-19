import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

process.env.TOKEN_SECRET = 'test-secret'
process.env.ROBOKASSA_LOGIN = 'shop'
process.env.ROBOKASSA_PASS1 = 'pass-one'
process.env.ROBOKASSA_PASS2 = 'pass-two'
process.env.SITE_URL = 'https://atelierai.ru'

const { createApp } = await import('../app.mjs')
const { Store } = await import('../store.mjs')
const sha = (s) => createHash('sha256').update(s).digest('hex')

async function boot() {
  const codes = {}
  const store = new Store(mkdtempSync(join(tmpdir(), 'atelier-rk-')))
  const { server } = createApp({ store, mailer: async (e, c) => { codes[e] = c }, aiOn: () => false })
  await new Promise((r) => server.listen(0, r))
  const base = `http://localhost:${server.address().port}`
  const call = async (method, path, body, headers = {}) => {
    const r = await fetch(base + path, { method, headers, body })
    const text = await r.text()
    return { status: r.status, text, json: () => JSON.parse(text) }
  }
  const login = async (email = 'p@x.ru') => {
    await call('POST', '/api/auth/request', JSON.stringify({ email, consent: '2026-11-19' }), { 'Content-Type': 'application/json' })
    const r = await call('POST', '/api/auth/verify', JSON.stringify({ email, code: codes[email] }), { 'Content-Type': 'application/json' })
    return { 'Authorization': `Bearer ${r.json().token}`, 'Content-Type': 'application/json' }
  }
  return { call, login, store, server }
}
const form = (o) => new URLSearchParams(o).toString()
const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' }

test('Robokassa: ссылка на оплату с верной подписью, суммой от сервера и уведомление включает тариф', async () => {
  const t = await boot()
  const auth = await t.login()
  assert.equal(JSON.parse((await t.call('GET', '/api/config')).text).pay, true)
  const r = await t.call('POST', '/api/pay/intent', JSON.stringify({ plan: 'sub', amount: 1 }), auth)
  assert.equal(r.status, 200)
  const { provider, url } = r.json()
  assert.equal(provider, 'robokassa')
  const q = new URL(url).searchParams
  assert.equal(q.get('MerchantLogin'), 'shop')
  assert.equal(q.get('OutSum'), '299.00') // сумма с сервера, а не из запроса клиента
  assert.equal(q.get('SignatureValue'), sha(`shop:299.00:${q.get('InvId')}:pass-one`))
  assert.equal(q.get('IsTest'), null)

  const inv = q.get('InvId')
  // неверная подпись, чужая сумма: не включаем
  assert.equal((await t.call('POST', '/api/pay/robokassa/result', form({ OutSum: '299.00', InvId: inv, SignatureValue: 'bad' }), FORM)).status, 400)
  assert.equal((await t.call('POST', '/api/pay/robokassa/result', form({ OutSum: '1.00', InvId: inv, SignatureValue: sha(`1.00:${inv}:pass-two`) }), FORM)).status, 400)
  assert.equal(JSON.parse((await t.call('GET', '/api/me', undefined, auth)).text).sub.effective, 'free')
  // верное уведомление
  const sig = sha(`299.00:${inv}:pass-two`).toUpperCase() // Robokassa присылает подпись в верхнем регистре
  const ok = await t.call('POST', '/api/pay/robokassa/result', form({ OutSum: '299.00', InvId: inv, SignatureValue: sig }), FORM)
  assert.equal(ok.status, 200)
  assert.equal(ok.text, `OK${inv}`)
  const me = JSON.parse((await t.call('GET', '/api/me', undefined, auth)).text)
  assert.equal(me.sub.effective, 'sub')
  assert.ok(me.sub.endsAt > Date.now() + 29 * 86400000)
  // повтор того же уведомления не продлевает второй раз
  const again = await t.call('POST', '/api/pay/robokassa/result', form({ OutSum: '299.00', InvId: inv, SignatureValue: sig }), FORM)
  assert.equal(again.text, `OK${inv}`)
  const me2 = JSON.parse((await t.call('GET', '/api/me', undefined, auth)).text)
  assert.equal(me2.sub.endsAt, me.sub.endsAt)
  t.server.close()
})

test('Robokassa: страницы возврата отдают ссылку в приложение', async () => {
  const t = await boot()
  const ok = await t.call('GET', '/api/pay/robokassa/success')
  assert.equal(ok.status, 200)
  assert.match(ok.text, /https:\/\/atelierai\.ru\/app\/#\/paywall\/success/)
  const fail = await t.call('GET', '/api/pay/robokassa/fail')
  assert.match(fail.text, /paywall\/error/)
  t.server.close()
})
