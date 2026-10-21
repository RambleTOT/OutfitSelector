import { colorGroup } from '../../data/catalog'
import type { Item } from '../../data/types'

export interface Filters {
  colors: string[]
  seasons: string[]
  formal: string[]
  hideUnavailable: boolean
}

export const NO_FILTERS: Filters = { colors: [], seasons: [], formal: [], hideUnavailable: false }

export const SEASONS = ['Лето', 'Демисезон', 'Зима', 'Всесезон']
export const FORMALS = ['Спорт', 'Повседневно', 'Офис', 'Нарядно']

// Сезон выводится из теплоты вещи; «Всесезон» совпадает с демисезоном
const SEASON_WARMTH: Record<string, string[]> = { Лето: ['лёгкая'], Демисезон: ['демисезон'], Зима: ['тёплая'], Всесезон: ['демисезон'] }
const FORMAL_MAP: Record<string, string[]> = {
  Спорт: ['спорт'],
  Повседневно: ['кэжуал', 'смарт-кэжуал'],
  Офис: ['деловой', 'смарт-кэжуал'],
  Нарядно: ['вечерний'],
}

export const isFiltered = (f: Filters) => f.colors.length > 0 || f.seasons.length > 0 || f.formal.length > 0 || f.hideUnavailable

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

export function matchesQuery(i: Item, q: string): boolean {
  const tokens = norm(q).split(/\s+/).filter(Boolean)
  if (!tokens.length) return true
  const hay = norm([i.title, i.type, i.colorName, i.material, i.pattern, i.fit, i.formality, i.warmth, i.description].join(' '))
  return tokens.every((t) => hay.includes(t))
}

export function matchesFilters(i: Item, f: Filters): boolean {
  if (f.hideUnavailable && !i.available) return false
  if (f.colors.length && !f.colors.includes(colorGroup(i.colorName))) return false
  if (f.seasons.length && !f.seasons.some((s) => SEASON_WARMTH[s].includes(i.warmth))) return false
  if (f.formal.length && !f.formal.some((s) => FORMAL_MAP[s].includes(i.formality))) return false
  return true
}
