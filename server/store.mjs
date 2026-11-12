import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, appendFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

/**
 * Хранилище в одном JSON-файле: пока пользователей до нескольких тысяч, этого хватает и не нужна база.
 * Запись атомарная (временный файл + rename). Когда станет тесно, интерфейс переносится на PostgreSQL без изменений в остальном коде.
 */
export class Store {
  constructor(dir) {
    this.dir = dir
    this.file = join(dir, 'db.json')
    mkdirSync(join(dir, 'photos'), { recursive: true })
    this.db = existsSync(this.file) ? JSON.parse(readFileSync(this.file, 'utf8')) : { users: {}, byEmail: {}, codes: {}, payments: {}, usage: {} }
    this.dirty = false
    this.timer = null
  }

  save() {
    this.dirty = true
    if (this.timer) return
    this.timer = setTimeout(() => this.flush(), 200)
  }

  flush() {
    clearTimeout(this.timer)
    this.timer = null
    if (!this.dirty) return
    this.dirty = false
    const tmp = this.file + '.tmp'
    writeFileSync(tmp, JSON.stringify(this.db))
    renameSync(tmp, this.file)
  }

  id() { return randomBytes(12).toString('hex') }

  userByEmail(email) { const id = this.db.byEmail[email]; return id ? this.db.users[id] : null }
  user(id) { return this.db.users[id] ?? null }

  createUser(email) {
    const u = { id: this.id(), email, createdAt: Date.now(), state: null, stateAt: 0, sub: { plan: 'free', status: 'none', subscriptionId: null, endsAt: null, cancelled: false } }
    this.db.users[u.id] = u
    this.db.byEmail[email] = u.id
    this.save()
    return u
  }

  deleteUser(id) {
    const u = this.db.users[id]
    if (!u) return
    delete this.db.byEmail[u.email]
    delete this.db.users[id]
    delete this.db.usage[id]
    if (this.db.support) delete this.db.support[id]
    rmSync(join(this.dir, 'photos', id), { recursive: true, force: true })
    this.save()
  }

  event(e) {
    try { appendFileSync(join(this.dir, 'events.jsonl'), JSON.stringify(e) + '\n') } catch { /* аналитика не должна ронять сервер */ }
  }
}
