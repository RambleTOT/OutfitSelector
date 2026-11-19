import type { Plan } from './app'

/* Лимиты по спецификации §1. Раздел 16 («на будущее») в прототип не входит */
export interface PlanLimits {
  outfitsWeek: number | null // null = без лимита
  photosTotal: number | null // за всё время (только Free)
  photosMonth: number | null // в месяц (Подписка и Подписка+)
  favorites: number | null
}

export const LIMITS: Record<Plan, PlanLimits> = {
  free: { outfitsWeek: 5, photosTotal: 3, photosMonth: null, favorites: 3 },
  sub: { outfitsWeek: 10, photosTotal: null, photosMonth: 30, favorites: 10 },
  plus: { outfitsWeek: null, photosTotal: null, photosMonth: 100, favorites: null },
}

/** Потолок «безлимита» в оферте: 300 образов в месяц */
export const MONTHLY_CAP = 300

export const PLAN_NAME: Record<Plan, string> = { free: 'Free', sub: 'Подписка', plus: 'Подписка+' }
export const PLAN_PRICE: Record<Plan, number> = { free: 0, sub: 299, plus: 599 }

const MSK = 3 * 3600 * 1000 // Москва UTC+3 без перехода на летнее время
const msk = (d: Date) => new Date(d.getTime() + MSK)

/** Ключ недели: дата понедельника по Москве. Недельный лимит обновляется в понедельник в 00:00 МСК */
export function weekKey(d = new Date()): string {
  const m = msk(d)
  const back = (m.getUTCDay() + 6) % 7
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() - back)).toISOString().slice(0, 10)
}

export function monthKey(d = new Date()): string {
  return msk(d).toISOString().slice(0, 7)
}

export function firstOfNextMonthLabel(d = new Date()): string {
  const m = msk(d)
  const next = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))
  return next.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}
