import type { Item } from '../data/types'
import { plural } from './format'

/** Подсказка баннера «Первые вещи» по тому, чего не хватает */
export function setupHint(items: Item[]): string {
  const has = (c: string) => items.some((i) => i.category === c)
  const base = has('dress') || (has('top') && has('bottom'))
  if (base) return has('shoes') ? `Добавь ещё ${left(items)} для точных образов` : 'Добавь обувь, чтобы образы были полными'
  if (has('top')) return 'Добавь низ или платье, чтобы собрать первый образ'
  if (has('bottom')) return 'Добавь верх или платье, чтобы собрать первый образ'
  return 'Добавь верх и низ или платье, чтобы собрать первый образ'
}

export const goalReached = (items: Item[]) => items.length >= 5 && items.some((i) => i.category === 'shoes')


const left = (items: Item[]) => {
  const n = Math.max(1, 5 - items.length)
  return `${n} ${plural(n, 'вещь', 'вещи', 'вещей')}`
}

/** Заголовок карточки прогресса в Гардеробе (WRD-06) */
export function setupHeadline(items: Item[]): string {
  const has = (c: string) => items.some((i) => i.category === c)
  if (has('dress') || (has('top') && has('bottom'))) return has('shoes') ? `Добавь ещё ${left(items)} для точных образов` : 'Добавь обувь, чтобы образы были полными'
  if (has('top')) return 'Для первого образа нужен низ или платье'
  if (has('bottom')) return 'Для первого образа нужен верх или платье'
  return 'Для первого образа нужны верх и низ или платье'
}
