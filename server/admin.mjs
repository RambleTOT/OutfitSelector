import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { effectivePlan, usageSnapshot, weekKey } from './plans.mjs'

// Админка: чистые функции над хранилищем. HTTP-обвязка и проверка токена в app.mjs, страница в public/admin/
const DAY = 86400000
const MSK = 3 * 3600000
export const PLANS = ['free', 'sub', 'plus']
const dayKey = (t) => new Date(t + MSK).toISOString().slice(0, 10)

/** Последние n суток по московскому времени, от старых к новым */
function lastDays(n, now) {
  return Array.from({ length: n }, (_, i) => dayKey(now - (n - 1 - i) * DAY))
}

/** Хвост журнала событий: файл растёт, читаем не больше 3 МБ с конца */
function readEvents(dir, maxBytes = 3_000_000) {
  const f = join(dir, 'events.jsonl')
  if (!existsSync(f)) return []
  const size = statSync(f).size
  const start = Math.max(0, size - maxBytes)
  const buf = Buffer.alloc(size - start)
  const fd = openSync(f, 'r')
  try { readSync(fd, buf, 0, buf.length, start) } finally { closeSync(fd) }
  const lines = buf.toString('utf8').split('\n')
  if (start > 0) lines.shift() // первая строка может быть обрезана
  const out = []
  for (const l of lines) { if (!l) continue; try { out.push(JSON.parse(l)) } catch { /* битая строка */ } }
  return out
}

const stateOf = (u) => (u.state && typeof u.state === 'object' ? u.state : {})
const itemsOf = (u) => (Array.isArray(stateOf(u).items) ? stateOf(u).items : [])

function itemCounts(u) {
  const c = {}
  for (const i of itemsOf(u)) c[i.category] = (c[i.category] ?? 0) + 1
  return c
}

/** Одна строка таблицы пользователей */
export function userRow(store, u, now = Date.now()) {
  const sub = u.sub ?? {}
  const plan = effectivePlan(sub, now)
  const usage = usageSnapshot(store, u, now)
  const st = stateOf(u)
  const msgs = store.db.support?.[u.id]?.messages ?? []
  const last = msgs[msgs.length - 1]
  return {
    id: u.id, email: u.email, name: typeof st.name === 'string' ? st.name : '', createdAt: u.createdAt,
    plan, paidPlan: sub.plan ?? 'free', status: sub.status ?? 'none', endsAt: sub.endsAt ?? null, cancelled: !!sub.cancelled,
    ended: (sub.plan ?? 'free') !== 'free' && !!sub.endsAt && sub.endsAt < now,
    manual: !!sub.manual,
    items: itemsOf(u).length, saved: Array.isArray(st.saved) ? st.saved.length : 0,
    onboarded: !!st.onboarded, activeAt: u.stateAt || u.createdAt,
    outfitsWeek: usage.outfitsWeek, outfitsMonth: usage.outfitsMonth, photosTotal: usage.photosTotal,
    waiting: !!last && last.from === 'user',
  }
}

export function listUsers(store, { q = '', plan = '', sort = 'new', now = Date.now() } = {}) {
  const needle = String(q).trim().toLowerCase()
  let rows = Object.values(store.db.users).map((u) => userRow(store, u, now))
  if (needle) rows = rows.filter((r) => r.email.includes(needle) || r.name.toLowerCase().includes(needle) || r.id.startsWith(needle))
  if (plan === 'paid') rows = rows.filter((r) => r.plan !== 'free')
  else if (PLANS.includes(plan)) rows = rows.filter((r) => r.plan === plan)
  else if (plan === 'ended') rows = rows.filter((r) => r.ended)
  else if (plan === 'waiting') rows = rows.filter((r) => r.waiting)
  const by = { new: (a, b) => b.createdAt - a.createdAt, active: (a, b) => b.activeAt - a.activeAt, items: (a, b) => b.items - a.items, ends: (a, b) => (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity) }
  rows.sort(by[sort] ?? by.new)
  return { total: rows.length, users: rows.slice(0, 300) }
}

export function userDetail(store, id, now = Date.now()) {
  const u = store.user(id)
  if (!u) return null
  const st = stateOf(u)
  const payments = Object.entries(store.db.payments ?? {}).filter(([, p]) => p.userId === id).map(([tx, p]) => ({ tx, ...p })).sort((a, b) => b.at - a.at)
  const log = (store.db.adminLog ?? []).filter((l) => l.userId === id).slice(-20).reverse()
  return {
    ...userRow(store, u, now),
    subscriptionId: u.sub?.subscriptionId ?? null,
    consent: u.consent ? { version: u.consent.version, at: u.consent.at } : null,
    quiz: st.quiz ?? null, height: st.height ?? null, size: st.size ?? null,
    itemCounts: itemCounts(u),
    usage: usageSnapshot(store, u, now),
    weekKey: weekKey(now),
    payments, log,
    messages: (store.db.support?.[id]?.messages ?? []).slice(-30),
  }
}

export function overview(store, now = Date.now()) {
  const users = Object.values(store.db.users)
  const rows = users.map((u) => userRow(store, u, now))
  const events = readEvents(store.dir)
  const payments = Object.entries(store.db.payments ?? {}).map(([tx, p]) => ({ tx, ...p }))
  const paidOk = payments.filter((p) => p.status === 'paid')
  const real = paidOk.filter((p) => !p.test)
  const monthStart = new Date(now + MSK); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)
  const monthFrom = monthStart.getTime() - MSK
  const days30 = lastDays(30, now)
  const signups = Object.fromEntries(days30.map((d) => [d, 0]))
  for (const u of users) { const k = dayKey(u.createdAt); if (k in signups) signups[k]++ }
  const outfits = Object.fromEntries(days30.map((d) => [d, 0]))
  const photos = Object.fromEntries(days30.map((d) => [d, 0]))
  for (const e of events) {
    const k = dayKey(e.t ?? 0)
    if (e.event === 'outfit_ok' && k in outfits) outfits[k]++
    else if (e.event === 'photo_ok' && k in photos) photos[k]++
  }
  const countEv = (name, from) => new Set(events.filter((e) => e.event === name && e.t >= from).map((e) => e.sid || e.t)).size
  const from7 = now - 7 * DAY
  const paidNow = rows.filter((r) => r.plan !== 'free')
  const supportOpen = rows.filter((r) => r.waiting).length
  const everOutfit = (u) => (store.db.usage[u.id]?.outfitsMonth ?? 0) > 0 || (store.db.usage[u.id]?.outfitsWeek ?? 0) > 0 || (Array.isArray(stateOf(u).saved) && stateOf(u).saved.length > 0)
  return {
    now,
    totals: {
      users: users.length,
      today: rows.filter((r) => dayKey(r.createdAt) === dayKey(now)).length,
      week: rows.filter((r) => r.createdAt >= from7).length,
      free: rows.filter((r) => r.plan === 'free').length,
      sub: rows.filter((r) => r.plan === 'sub').length,
      plus: rows.filter((r) => r.plan === 'plus').length,
      paid: paidNow.length,
      cancelledActive: paidNow.filter((r) => r.cancelled).length,
      endingSoon: paidNow.filter((r) => r.endsAt && r.endsAt < now + 7 * DAY).length,
      activeWeek: rows.filter((r) => r.activeAt >= from7).length,
      supportOpen,
    },
    money: {
      total: real.reduce((s, p) => s + (p.amount ?? 0), 0),
      month: real.filter((p) => p.at >= monthFrom).reduce((s, p) => s + (p.amount ?? 0), 0),
      count: real.length,
      testCount: paidOk.filter((p) => p.test).length,
      refunded: payments.filter((p) => p.status === 'refunded').length,
    },
    signupsByDay: days30.map((d) => ({ d, n: signups[d] })),
    outfitsByDay: days30.map((d) => ({ d, n: outfits[d] })),
    photosByDay: days30.map((d) => ({ d, n: photos[d] })),
    funnel: [
      { key: 'visits', label: 'Зашли на сайт', n: countEv('landing_view', from7), note: 'за 7 дней' },
      { key: 'start', label: 'Нажали «Начать»', n: countEv('start_tap', from7), note: 'за 7 дней' },
      { key: 'reg', label: 'Зарегистрировались', n: users.length },
      { key: 'quiz', label: 'Прошли анкету', n: users.filter((u) => stateOf(u).quizDone).length },
      { key: 'items', label: 'Добавили вещи', n: users.filter((u) => itemsOf(u).length > 0).length },
      { key: 'outfit', label: 'Собрали образ', n: users.filter(everOutfit).length },
      { key: 'paid', label: 'С тарифом', n: paidNow.length },
    ],
    recentUsers: [...rows].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    recentPayments: payments.sort((a, b) => b.at - a.at).slice(0, 6).map((p) => ({ ...p, email: store.user(p.userId)?.email ?? '—' })),
  }
}

export function paymentsList(store) {
  return Object.entries(store.db.payments ?? {}).map(([tx, p]) => ({ tx, ...p, email: store.user(p.userId)?.email ?? 'удалён' })).sort((a, b) => b.at - a.at).slice(0, 300)
}

function logAction(store, userId, email, text, now) {
  const log = (store.db.adminLog ??= [])
  log.push({ at: now, userId, email, text })
  if (log.length > 500) log.splice(0, log.length - 500)
}

export function recentLog(store) { return (store.db.adminLog ?? []).slice(-30).reverse() }

/**
 * Действия с тарифом. Возвращают { ok: true } или { error }.
 * grant: выдать тариф на N дней с сегодняшнего дня; extend: добавить N дней к текущему сроку;
 * cancel: отключить автопродление, тариф доживает до конца срока; revoke: вернуть на Free сразу; reset_usage: обнулить счётчики лимитов
 */
export function subAction(store, user, body, now = Date.now()) {
  const act = String(body.action ?? '')
  const days = Math.round(Number(body.days))
  const sub = user.sub ?? (user.sub = { plan: 'free', status: 'none', subscriptionId: null, endsAt: null, cancelled: false })
  if (act === 'grant') {
    if (!['sub', 'plus'].includes(body.plan)) return { error: 'bad_plan' }
    if (!(days >= 1 && days <= 3650)) return { error: 'bad_days' }
    user.sub = { plan: body.plan, status: 'active', subscriptionId: null, endsAt: now + days * DAY, cancelled: true, manual: true }
    logAction(store, user.id, user.email, `Выдан тариф ${body.plan === 'plus' ? 'Подписка+' : 'Подписка'} на ${days} дн.`, now)
  } else if (act === 'extend') {
    if (!(days >= 1 && days <= 3650)) return { error: 'bad_days' }
    if (sub.plan === 'free') return { error: 'no_plan' }
    const base = sub.endsAt && sub.endsAt > now ? sub.endsAt : now
    sub.endsAt = base + days * DAY
    sub.status = 'active'
    logAction(store, user.id, user.email, `Срок продлён на ${days} дн.`, now)
  } else if (act === 'cancel') {
    if (sub.plan === 'free') return { error: 'no_plan' }
    sub.cancelled = true
    logAction(store, user.id, user.email, 'Автопродление отключено', now)
  } else if (act === 'revoke') {
    if (sub.plan === 'free') return { error: 'no_plan' }
    user.sub = { plan: 'free', status: 'revoked', subscriptionId: null, endsAt: now, cancelled: true }
    logAction(store, user.id, user.email, 'Тариф снят, вернулся Free', now)
  } else if (act === 'reset_usage') {
    delete store.db.usage[user.id]
    logAction(store, user.id, user.email, 'Лимиты обнулены', now)
  } else return { error: 'bad_action' }
  store.save()
  return { ok: true }
}

export function logDelete(store, user, now = Date.now()) { logAction(store, user.id, user.email, 'Аккаунт удалён', now) }
