import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { caption, decrypt, encrypt, makeArchive, rotate, runBackup, stamp, stats } from '../backup.mjs'

const NOW = Date.UTC(2026, 10, 20, 1, 0, 0) // 04:00 по Москве

function dataDir() {
  const d = mkdtempSync(join(tmpdir(), 'bk-'))
  mkdirSync(join(d, 'photos', 'u1'), { recursive: true })
  writeFileSync(join(d, 'photos', 'u1', 'a.webp'), 'фото')
  writeFileSync(join(d, 'events.jsonl'), '{"event":"x"}\n')
  writeFileSync(join(d, 'db.json'), JSON.stringify({
    users: { a: { email: 'secret-person@mail.ru', createdAt: NOW - 3600000 }, b: { email: 'old@mail.ru', createdAt: NOW - 9 * 86400000 } },
    payments: { p1: { status: 'paid', at: NOW - 1000, amount: 299 }, p2: { status: 'paid', at: NOW - 1000, amount: 299, test: true }, p3: { status: 'paid', at: NOW - 5 * 86400000, amount: 599 } },
  }))
  return d
}

test('шифрование туда и обратно, чужой пароль и порча файла не проходят, шифртекст не содержит открытых данных', () => {
  const plain = Buffer.from('почта user@example.ru ' + 'x'.repeat(5000))
  const enc = encrypt(plain, 'пароль-1')
  assert.equal(enc.subarray(0, 5).toString(), 'ATBK1')
  assert.ok(!enc.includes('user@example.ru'))
  assert.deepEqual(decrypt(enc, 'пароль-1'), plain)
  assert.throws(() => decrypt(enc, 'другой'), /Неверный пароль/)
  const broken = Buffer.from(enc); broken[broken.length - 1] ^= 1
  assert.throws(() => decrypt(broken, 'пароль-1'), /Неверный пароль или файл повреждён/)
  assert.throws(() => decrypt(Buffer.from('мусор мусор мусор мусор мусор мусор мусор мусор'), 'x'), /не бэкап/)
  assert.notDeepEqual(encrypt(plain, 'пароль-1'), enc) // соль и вектор каждый раз новые
  assert.throws(() => encrypt(plain, ''), /пароль/i)
})

test('архив содержит db.json, events.jsonl и photos', () => {
  const d = dataDir()
  const list = execFileSync('tar', ['-tzf', '-'], { input: makeArchive(d) }).toString()
  assert.match(list, /db\.json/); assert.match(list, /events\.jsonl/); assert.match(list, /photos\/u1\/a\.webp/)
})

test('ротация оставляет последние 14 и не трогает чужие файлы', () => {
  const d = mkdtempSync(join(tmpdir(), 'rot-'))
  for (let i = 1; i <= 20; i++) writeFileSync(join(d, `atelier-202611${String(i).padStart(2, '0')}-0400.tar.gz.enc`), 'x')
  writeFileSync(join(d, 'notes.txt'), 'x')
  const removed = rotate(d, 14)
  assert.equal(removed.length, 6)
  assert.ok(removed.includes('atelier-20261101-0400.tar.gz.enc'))
  const left = readdirSync(d)
  assert.equal(left.length, 15)
  assert.ok(left.includes('notes.txt') && left.includes('atelier-20261120-0400.tar.gz.enc'))
})

test('цифры и подпись: пользователи, новые за сутки, платежи без тестовых', () => {
  const st = stats(dataDir(), NOW)
  assert.deepEqual(st, { users: 2, fresh: 1, pays: 1, sum: 299, testPays: 1 })
  const cap = caption({ now: NOW, size: 2048, sha: 'abcdef1234567890', st })
  assert.match(cap, /20\.11\.2026 04:00 МСК/)
  assert.match(cap, /Пользователей: 2 \(новых за сутки: 1\)/)
  assert.match(cap, /sha256: abcdef123456/)
  assert.equal(stamp(NOW), '20261120-0400')
})

test('бэкап целиком: в Telegram уходит только шифртекст, локальный файл расшифровывается', async () => {
  const d = dataDir()
  const out = mkdtempSync(join(tmpdir(), 'out-'))
  let sentBody = null
  const fetchImpl = async (url, init) => { sentBody = { url: String(url), form: init.body }; return { ok: true } }
  const env = { DATA_DIR: d, BACKUP_DIR: out, BACKUP_PASSPHRASE: 'p@ss', ALERT_TG_BOT_TOKEN: 't', ALERT_TG_CHAT_ID: '1' }
  const r = await runBackup({ env, now: NOW, fetchImpl })
  assert.equal(r.sent, true)
  assert.match(sentBody.url, /sendDocument/)
  const sentFile = Buffer.from(await sentBody.form.get('document').arrayBuffer())
  assert.ok(!sentFile.includes('secret-person@mail.ru'))
  assert.equal(sentFile.subarray(0, 5).toString(), 'ATBK1')
  assert.ok(!String(sentBody.form.get('caption')).includes('secret-person'))
  assert.equal(readdirSync(out)[0], 'atelier-20261120-0400.tar.gz.enc')
  const tar = decrypt(readFileSync(r.file), 'p@ss')
  const names = execFileSync('tar', ['-tzf', '-'], { input: tar }).toString()
  assert.match(names, /db\.json/)
  assert.equal(execFileSync('tar', ['-xOzf', '-', 'db.json'], { input: tar }).toString().includes('secret-person@mail.ru'), true)
})

test('без ключа шифрования бэкап не делается и предупреждение уходит в Telegram; без Telegram копия только локальная', async () => {
  const d = dataDir()
  const out = mkdtempSync(join(tmpdir(), 'out-'))
  const calls = []
  const fetchImpl = async (url, init) => { calls.push(String(url)); return { ok: true } }
  const tg = { ALERT_TG_BOT_TOKEN: 't', ALERT_TG_CHAT_ID: '1' }
  await assert.rejects(runBackup({ env: { DATA_DIR: d, BACKUP_DIR: out, ...tg }, now: NOW, fetchImpl }), /BACKUP_PASSPHRASE/)
  assert.equal(readdirSync(out).length, 0)
  assert.ok(calls.some((u) => u.includes('sendMessage')))
  const r = await runBackup({ env: { DATA_DIR: d, BACKUP_DIR: out, BACKUP_PASSPHRASE: 'k' }, now: NOW, fetchImpl: async () => { throw new Error('не должно быть сети') } })
  assert.equal(r.sent, false)
  assert.ok(existsSync(r.file))
})

test('слишком большой архив в Telegram не уходит', async () => {
  const d = dataDir()
  const out = mkdtempSync(join(tmpdir(), 'out-'))
  const calls = []
  const big = () => Buffer.alloc(46 * 1024 * 1024, 7)
  const r = await runBackup({ env: { DATA_DIR: d, BACKUP_DIR: out, BACKUP_PASSPHRASE: 'k', ALERT_TG_BOT_TOKEN: 't', ALERT_TG_CHAT_ID: '1' }, now: NOW, archive: big, fetchImpl: async (u) => { calls.push(String(u)); return { ok: true } } })
  assert.equal(r.sent, false)
  assert.ok(calls.every((u) => u.includes('sendMessage')))
})
