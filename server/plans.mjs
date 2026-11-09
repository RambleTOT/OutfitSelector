/** Лимиты тарифов (источник: CLAUDE.md и спецификация). Недельный счёт по московскому времени, неделя с понедельника */
export const LIMITS = {
  free: { outfitsWeek: 5, photosTotal: 3, photosMonth: null },
  sub: { outfitsWeek: 10, photosTotal: null, photosMonth: 30 },
  plus: { outfitsWeek: null, photosTotal: null, photosMonth: null },
}
export const MONTHLY_CAP = 300

const msk = (t = Date.now()) => new Date(t + 3 * 3600000)
export function weekKey(t) {
  const d = msk(t)
  const day = (d.getUTCDay() + 6) % 7
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day))
  return mon.toISOString().slice(0, 10)
}
export const monthKey = (t) => msk(t).toISOString().slice(0, 7)

/** Эффективный тариф: оплаченный период закончился -> Free, ничего не удаляется */
export function effectivePlan(sub, now = Date.now()) {
  if (!sub || sub.plan === 'free') return 'free'
  if (sub.endsAt && sub.endsAt < now) return 'free'
  return sub.plan
}

export function spend(store, user, now = Date.now()) {
  const plan = effectivePlan(user.sub, now)
  const u = (store.db.usage[user.id] ??= { weekKey: '', outfitsWeek: 0, monthKey: '', outfitsMonth: 0 })
  const wk = weekKey(now), mk = monthKey(now)
  if (u.weekKey !== wk) { u.weekKey = wk; u.outfitsWeek = 0 }
  if (u.monthKey !== mk) { u.monthKey = mk; u.outfitsMonth = 0 }
  const lim = LIMITS[plan].outfitsWeek
  if (lim !== null && u.outfitsWeek >= lim) return { ok: false, reason: 'limit' }
  if (lim === null && u.outfitsMonth >= MONTHLY_CAP) return { ok: false, reason: 'cap' }
  return { ok: true, commit: () => { u.outfitsWeek++; u.outfitsMonth++; store.save() } }
}

/** Лимит фото: Free 3 за всё время, Подписка 30 в месяц, Подписка+ без лимита. Одно фото с несколькими вещами считается за одно */
export function spendPhoto(store, user, now = Date.now()) {
  const plan = effectivePlan(user.sub, now)
  const l = LIMITS[plan]
  const u = (store.db.usage[user.id] ??= { weekKey: '', outfitsWeek: 0, monthKey: '', outfitsMonth: 0 })
  const mk = monthKey(now)
  if (u.photoMonthKey !== mk) { u.photoMonthKey = mk; u.photosMonth = 0 }
  u.photosTotal ??= 0
  if (l.photosTotal !== null && u.photosTotal >= l.photosTotal) return { ok: false, reason: 'photo_limit' }
  if (l.photosMonth !== null && u.photosMonth >= l.photosMonth) return { ok: false, reason: 'photo_limit' }
  return { ok: true, commit: () => { u.photosTotal++; u.photosMonth++; store.save() } }
}
