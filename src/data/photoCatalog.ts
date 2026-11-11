import { MOCK_ITEMS } from './items'
import type { Category, Item } from './types'

/**
 * Каталог красивых фото вещей: человек ищет «чёрная футболка» и выбирает из готовых студийных фото вместо рисованных шаблонов.
 * Основной список лежит в public/catalog/index.json (собирает tools/catalog/build.mjs, см. docs/CATALOG.md) и грузится при открытии экрана.
 * Пока он пуст или недоступен, показываем встроенные 24 фото демо-гардероба
 */
export interface CatalogEntry {
  id: string
  category: Category
  type: string
  title: string
  colorName: string
  color: string
  gender: 'f' | 'm' | 'u' // для кого: женская, мужская, любая
  tags: string[] // «оверсайз», «приталенный», «льняная» и т. п.
  img: string
  material?: string
  fit?: Item['fit']
  warmth?: Item['warmth']
  formality?: Item['formality']
  credit?: string
}

const SEED: CatalogEntry[] = MOCK_ITEMS.map((i) => ({
  id: i.id, category: i.category, type: i.type, title: i.title, colorName: i.colorName, color: i.color, gender: 'u' as const,
  tags: [i.fit, i.material, i.formality].filter(Boolean), img: `/items/${i.id}.png`,
  material: i.material, fit: i.fit, warmth: i.warmth, formality: i.formality,
}))

let cache: CatalogEntry[] | null = null
export async function loadCatalog(): Promise<CatalogEntry[]> {
  if (cache) return cache
  try {
    const r = await fetch('/catalog/index.json', { cache: 'no-cache' })
    if (r.ok) {
      const list = await r.json() as CatalogEntry[]
      if (Array.isArray(list) && list.length) return (cache = list)
    }
  } catch { /* оффлайн или файла ещё нет */ }
  return (cache = SEED)
}

/** Слова-синонимы: человек пишет как привык, а в каталоге вещь названа иначе */
const SYN: Record<string, string[]> = {
  футболка: ['майка', 'тишка', 'tee', 'tshirt'], рубашка: ['сорочка', 'блуза'], свитер: ['джемпер', 'пуловер', 'кофта'], худи: ['толстовка', 'hoodie'],
  свитшот: ['толстовка'], куртка: ['ветровка', 'бомбер', 'косуха'], пальто: ['coat'], пиджак: ['жакет', 'блейзер'], джинсы: ['деним', 'джинсовые'],
  брюки: ['штаны', 'чиносы', 'слаксы'], шорты: ['бермуды'], кроссовки: ['кеды', 'сникеры'], ботинки: ['сапоги', 'берцы', 'челси'], сумка: ['рюкзак', 'шоппер'],
}
const norm = (s: string) => s.toLowerCase().replaceAll('ё', 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim()
/** Слово совпало, если одно начинается с другого (первые 4 буквы): «чёрная» находит «чёрный», «футболки» находит «футболка» */
const same = (a: string, b: string) => { const n = Math.min(4, a.length, b.length); return n >= 3 && a.slice(0, n) === b.slice(0, n) }

export function searchCatalog(list: CatalogEntry[], q: string, gender: 'all' | 'f' | 'm', category: Category | 'all'): CatalogEntry[] {
  const words = norm(q).split(' ').filter(Boolean)
  const out: { e: CatalogEntry; score: number }[] = []
  for (const e of list) {
    if (category !== 'all' && e.category !== category) continue
    if (gender !== 'all' && e.gender !== 'u' && e.gender !== gender) continue
    const hay = norm([e.title, e.type, e.colorName, ...e.tags, ...(SYN[e.type] ?? [])].join(' ')).split(' ')
    let score = 0
    let ok = true
    for (const w of words) {
      const hit = hay.some((h) => same(h, w))
      if (hit) score += 2; else { ok = false; break }
    }
    if (ok) out.push({ e, score: score + (gender !== 'all' && e.gender === gender ? 1 : 0) })
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.e)
}
