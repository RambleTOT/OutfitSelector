import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkDisk, checkTls, checkWrite, evaluate, formatDuration, runChecks } from '../monitor.mjs'

const MIN = 60000
const bad = (name = 'public', detail = 'x') => [{ name, ok: false, detail }]
const good = (name = 'public') => [{ name, ok: true }]

test('монитор: тревога только после двух неудач подряд, одно сообщение, потом напоминание раз в 6 часов', () => {
  let t = 1_000_000
  let r = evaluate(null, bad(), t)
  assert.equal(r.messages.length, 0) // первая неудача: ждём
  r = evaluate(r.state, bad(), (t += MIN))
  assert.equal(r.messages.length, 1)
  assert.equal(r.messages[0].kind, 'down')
  assert.match(r.messages[0].text, /Сайт не отвечает/)
  r = evaluate(r.state, bad(), (t += MIN))
  assert.equal(r.messages.length, 0) // повторов каждую минуту нет
  r = evaluate(r.state, bad(), (t += 5 * 60 * MIN))
  assert.equal(r.messages.length, 0) // ещё нет 6 часов с тревоги
  r = evaluate(r.state, bad(), (t += 2 * 60 * MIN))
  assert.equal(r.messages[0].kind, 'remind')
})

test('монитор: восстановление шлёт одно сообщение с длительностью, одиночный сбой молчит', () => {
  let t = 5_000_000
  let r = evaluate(null, bad('local'), t)
  r = evaluate(r.state, good('local'), (t += MIN))
  assert.equal(r.messages.length, 0) // одиночный сбой, тревоги не было и «восстановилось» не нужно
  r = evaluate(r.state, bad('local'), (t += MIN))
  r = evaluate(r.state, bad('local'), (t += MIN))
  assert.equal(r.messages[0].kind, 'down')
  r = evaluate(r.state, good('local'), (t += 10 * MIN))
  assert.equal(r.messages.length, 1)
  assert.equal(r.messages[0].kind, 'up')
  assert.match(r.messages[0].text, /Простой: 11 мин/)
  assert.equal(evaluate(r.state, good('local'), t + MIN).messages.length, 0)
})

test('монитор: проверки независимы, пропущенная проверка состояние не трогает', () => {
  let r = evaluate(null, [...bad('public'), ...good('local')], 1)
  r = evaluate(r.state, [...bad('public'), ...good('local'), { name: 'tls', ok: null }], 2)
  assert.deepEqual(r.messages.map((m) => m.name), ['public'])
  assert.equal(r.state.checks.tls, undefined)
})

test('монитор: формат длительности', () => {
  assert.equal(formatDuration(30000), '1 мин')
  assert.equal(formatDuration(90 * MIN), '1 ч 30 мин')
  assert.equal(formatDuration(3 * 24 * 60 * MIN), '3 дн 0 ч')
})

test('монитор: диск, запись и сертификат', async () => {
  const st = (free, total) => () => ({ bavail: free, blocks: total, bsize: 1 })
  const GB = 1024 ** 3
  assert.equal(checkDisk('.', st(50 * GB, 59 * GB)).ok, true)
  assert.equal(checkDisk('.', st(2 * GB, 100 * GB)).ok, false) // меньше 3 ГБ
  assert.equal(checkDisk('.', st(10 * GB, 100 * GB)).ok, false) // меньше 15%
  assert.equal(checkDisk('.', () => { throw new Error('нет') }).ok, false)
  assert.equal(checkWrite(mkdtempSync(join(tmpdir(), 'mon-'))).ok, true)
  assert.equal(checkWrite('/нет/такого/каталога').ok, false)
  assert.equal((await checkTls('a.ru', async () => 40)).ok, true)
  const low = await checkTls('a.ru', async () => 5.2)
  assert.equal(low.ok, false)
  assert.match(low.detail, /осталось 5 дн/)
  assert.equal((await checkTls('a.ru', async () => { throw new Error('таймаут') })).ok, false)
})

test('монитор: runChecks с подменой сети, сертификат не чаще раза в 6 часов', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mon-'))
  const urls = []
  const fetchImpl = async (url) => {
    urls.push(String(url))
    if (String(url).includes('7100')) return { ok: true, json: async () => ({ ok: true }) }
    if (String(url).startsWith('http://127.0.0.1')) return { ok: false, status: 502, json: async () => ({}) }
    return { ok: true, json: async () => ({ ok: true, ai: true }) }
  }
  const env = { DATA_DIR: dir, SITE_URL: 'https://example.test', PORT: '8787' }
  const statfs = () => ({ bavail: 50 * 1024 ** 3, blocks: 59 * 1024 ** 3, bsize: 1 })
  const now = Date.now()
  const a = await runChecks({ env, fetchImpl, now, tlsAt: 0, statfs, tlsImpl: async () => 60 })
  const by = Object.fromEntries(a.results.map((r) => [r.name, r]))
  assert.equal(by.public.ok, true)
  assert.equal(by.vision.ok, true)
  assert.equal(by.local.ok, false)
  assert.match(by.local.detail, /HTTP 502/)
  assert.equal(by.disk.ok, true)
  assert.equal(by.write.ok, true)
  assert.equal(a.checkedTls, true)
  assert.ok(urls.includes('https://example.test/api/health'))
  const b = await runChecks({ env, fetchImpl, now, tlsAt: now - 60000, statfs, tlsImpl: async () => 60 })
  assert.equal(b.checkedTls, false)
  assert.ok(!b.results.some((r) => r.name === 'tls'))
})
