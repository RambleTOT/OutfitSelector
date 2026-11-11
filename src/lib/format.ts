import { OCCASIONS } from '../data/items'
import { currentWeather, tempText } from './weather'
import type { OccasionId } from '../data/types'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export { cap }

/** «Ср, 21 октября» */
export function todayLabel(d = new Date()): string {
  const wd = d.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '')
  const dm = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return `${cap(wd)}, ${dm}`
}

/** Температура сейчас: «+8°». Пусто, если погоды нет (место не выбрано или нет данных) */
export const temp = () => { const w = currentWeather(); return w ? tempText(w.temp) : '' }

export const occasionById = (id: OccasionId) => OCCASIONS.find((o) => o.id === id)!

/** Винительный падеж типа вещи для «Заменить …» */
export function accusative(type: string): string {
  if (type.endsWith('а')) return type.slice(0, -1) + 'у'
  if (type.endsWith('я')) return type.slice(0, -1) + 'ю'
  return type
}

/** Дата вида «21 окт» */
export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export const OCCASION_FOR: Record<OccasionId, string> = {
  every: 'Образ на каждый день',
  work: 'Образ на работу',
  study: 'Образ на учёбу',
  date: 'Образ на свидание',
  walk: 'Образ на прогулку',
  party: 'Образ на вечеринку',
}

/** «21 ноября» */
export const dateLong = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
