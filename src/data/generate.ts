import { typeDef } from './catalog'
import { MISSING_HINT, OUTFIT_TEMPLATES, WEATHER } from './items'
import type { Category, Item, MissingSlot, OccasionId, OutfitTemplate } from './types'

export interface GeneratedOutfit {
  templateId: string
  occasion: OccasionId
  itemIds: string[]
  explanation: string
  missing: MissingSlot[]
  wish: string
}

/** Есть ли в гардеробе верх и низ или платье: порог включения «Собрать образ» */
export function canGenerate(items: Item[]): boolean {
  const av = items.filter((i) => i.available)
  const has = (c: Category) => av.some((i) => i.category === c)
  return has('dress') || (has('top') && has('bottom'))
}

const FORMALITY_TARGET: Record<OccasionId, string[]> = {
  every: ['кэжуал', 'смарт-кэжуал'],
  work: ['деловой', 'смарт-кэжуал'],
  study: ['кэжуал', 'спорт'],
  date: ['вечерний', 'смарт-кэжуал'],
  walk: ['спорт', 'кэжуал'],
  party: ['вечерний', 'деловой'],
}

/** Подходит ли вещь к погоде: на +8 без шорт и без «лёгких» нижних вещей */
function weatherOk(i: Item): boolean {
  if (WEATHER.temp < 15 && i.kind === 'shorts') return false
  return true
}

function score(i: Item, occasion: OccasionId): number {
  const target = FORMALITY_TARGET[occasion]
  const f = target.indexOf(i.formality)
  let s = f === 0 ? 3 : f === 1 ? 2 : 0
  if (WEATHER.temp < 12 && i.warmth !== 'лёгкая') s += 1
  return s
}

/** Заготовки в порядке «следующая»: начиная с заготовки повода по кругу */
export function templateOrder(occasion: OccasionId): OutfitTemplate[] {
  const start = Math.max(0, OUTFIT_TEMPLATES.findIndex((t) => t.occasion === occasion))
  return [...OUTFIT_TEMPLATES.slice(start), ...OUTFIT_TEMPLATES.slice(0, start)]
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

function candidates(items: Item[], category: Category, prefer: string[], occasion: OccasionId): Item[] {
  const pool = items.filter((i) => i.available && i.category === category && weatherOk(i))
  const pref = prefer.map((id) => pool.find((i) => i.id === id)).filter((x): x is Item => !!x)
  const rest = pool.filter((i) => !pref.includes(i)).sort((a, b) => score(b, occasion) - score(a, occasion))
  return [...pref, ...rest]
}

export function explain(chosen: Item[]): string {
  const by = (c: Category) => chosen.find((i) => i.category === c)
  const plural = (i: Item) => typeDef(i.category, i.type).gender === 'p'
  const verb = (i: Item, one: string, many: string) => (plural(i) ? many : one)
  const clauses: string[] = []
  const outer = by('outer')
  const dress = by('dress')
  const top = by('top')
  const bottom = by('bottom')
  const shoes = by('shoes')
  if (outer) clauses.push(`${outer.title} ${verb(outer, 'закроет', 'закроют')} от ветра`)
  if (dress) clauses.push(`${dress.title} ${verb(dress, 'задаёт', 'задают')} настроение`)
  else if (top) clauses.push(`${top.title} ${top.warmth === 'тёплая' ? verb(top, 'согреет', 'согреют') : verb(top, 'освежит', 'освежат')}`)
  if (bottom) clauses.push(`${bottom.title} ${verb(bottom, 'собирает', 'собирают')} образ`)
  if (shoes) clauses.push(`${shoes.title} ${verb(shoes, 'держит', 'держат')} образ удобным`)
  const text = clauses.slice(0, 3).map((c, i) => (i === 0 ? c : c.charAt(0).toLowerCase() + c.slice(1))).join(', ')
  return text
}

/**
 * Имитация AI: образ из заготовки повода. Вещи берутся из реального гардероба:
 * предпочтительные из заготовки, иначе подходящие по категории, чего нет, идёт в missing.
 * `variant` выбирает заготовку по кругу, `avoid` не даёт повторить предыдущий набор.
 */
export function generateOutfit(items: Item[], occasion: OccasionId, variant: number, wish: string, avoid: string[] = []): GeneratedOutfit {
  const order = templateOrder(occasion)
  const tpl = order[variant % order.length]

  const resolve = (shift: number) => {
    const chosen: Item[] = []
    tpl.slots.forEach((slot, idx) => {
      const list = candidates(items, slot.category, slot.prefer, occasion).filter((i) => !chosen.includes(i))
      if (!list.length) return
      chosen.push(list[(idx === shift % tpl.slots.length ? shift : 0) % list.length] ?? list[0])
    })
    const has = (c: Category) => chosen.some((i) => i.category === c)
    // шаблон не закрыл основу образа: добираем верх и низ или платье из гардероба
    if (!has('dress') && !(has('top') && has('bottom'))) {
      for (const c of ['top', 'bottom'] as Category[]) {
        if (has(c)) continue
        const pick = candidates(items, c, [], occasion).find((i) => !chosen.includes(i))
        if (pick) chosen.push(pick)
      }
      if (!has('dress') && !(has('top') && has('bottom'))) {
        const d = candidates(items, 'dress', [], occasion)[0]
        if (d) { chosen.length = 0; chosen.push(d) }
      }
    }
    return chosen
  }

  let chosen = resolve(0)
  for (let shift = 1; shift < 8 && avoid.length && sameSet(chosen.map((i) => i.id), avoid); shift++) {
    chosen = resolve(shift)
  }

  const fromTemplate = chosen.every((i) => tpl.slots.some((s) => s.prefer.includes(i.id)))
  const missing: MissingSlot[] = []
  if (!items.some((i) => i.available && i.category === 'shoes')) {
    missing.push({ category: 'shoes', hint: MISSING_HINT.shoes! })
  }
  return {
    templateId: tpl.id,
    occasion,
    itemIds: chosen.map((i) => i.id),
    explanation: fromTemplate ? tpl.explanation : explain(chosen),
    missing,
    wish,
  }
}
