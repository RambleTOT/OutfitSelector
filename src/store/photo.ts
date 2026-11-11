import { create } from 'zustand'
import { buildTemplateItem, makeDescription, makeTitle, typeDef, TYPES } from '../data/catalog'
import type { Category, Item } from '../data/types'
import { useApp } from './app'
import type { Analyzed } from '../lib/ai'
import { getCaps, hasSession } from '../lib/api'

/** Фото-ветка добавления вещи (ADD-02…ADD-06). Состояние в памяти, не сохраняется */
interface PhotoFlow {
  status: 'idle' | 'processing' | 'done' | 'notClothing'
  item: Item | null // карточка с предзаполненными полями
  found: Item[] // на фото нашли несколько вещей (ADD-07)
  startedAt: number
  start: (item: Item) => void
  startFound: (items: Item[]) => void
  markDone: () => void
  fail: () => void
  reset: () => void
}

export const usePhotoFlow = create<PhotoFlow>((set) => ({
  status: 'idle',
  item: null,
  found: [],
  startedAt: 0,
  startFound: (found) => set({ status: 'done', found, item: null }),
  start: (item) => set({ status: 'processing', item, startedAt: Date.now() }),
  markDone: () => set({ status: 'done' }),
  fail: () => set({ status: 'notClothing', item: null }),
  reset: () => set({ status: 'idle', item: null, found: [] }),
}))

export const PROCESS_MS = 2000

const ORDER: [Category, string][] = [['top', 'футболка'], ['bottom', 'джинсы'], ['shoes', 'кеды'], ['outer', 'тренч'], ['bag', 'сумка']]

/** Если в имени файла есть подсказка (sneakers, куртка, сумка), берём её: так демо угадывает вещь точнее */
const NAME_HINTS: [RegExp, Category, string][] = [
  [/sneaker|кроссов|кед|shoe|обув/i, 'shoes', 'кроссовки'],
  [/boot|ботин/i, 'shoes', 'ботинки'],
  [/bag|сумк/i, 'bag', 'сумка'],
  [/jacket|coat|куртк|пальто|тренч/i, 'outer', 'куртка'],
  [/jeans|pants|trouser|брюк|джинс/i, 'bottom', 'джинсы'],
  [/shirt|tee|hoodie|sweater|рубаш|футбол|свитер|худи/i, 'top', 'рубашка'],
]

/** ИИ-имитация: что за вещь на фото. Сначала подсказка из имени файла, иначе первая категория, которой нет в гардеробе, иначе по кругу */
export function guessItem(photo: string, colorName: string, fileName = ''): Item {
  const items = useApp.getState().items
  const hint = NAME_HINTS.find(([re]) => re.test(fileName))
  const pick: [Category, string] = hint ? [hint[1], hint[2]] : (ORDER.find(([c]) => !items.some((i) => i.category === c)) ?? ORDER[items.length % ORDER.length])
  const [category, type] = pick
  const d = typeDef(category, type)
  const base = buildTemplateItem(category, TYPES[category].find((t) => t.type === type)?.type ?? d.type, colorName)
  const title = makeTitle(colorName.toLowerCase(), d.type, category)
  const item: Item = { ...base, title, source: 'photo', photo, addedAt: Date.now() }
  return { ...item, description: makeDescription(item) }
}

/** Карточка вещи по ответу сервиса распознавания. Материал, крой, тепло и формальность берутся из каталога по виду вещи */
export function analyzedItem(a: Analyzed): Item {
  const category = (a.category in TYPES ? a.category : 'top') as Category
  const known = TYPES[category].find((t) => t.type === a.type) ?? TYPES[category][0]
  const base = buildTemplateItem(category, known.type, a.colorName)
  const item: Item = {
    ...base, source: 'photo', photo: a.cutout, addedAt: Date.now(),
    id: `ph${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    color: a.colorHex || base.color, colorName: a.colorName,
    pattern: (['однотон', 'полоска', 'клетка', 'принт'].includes(a.pattern) ? a.pattern : 'однотон') as Item['pattern'],
    title: makeTitle(a.colorName.toLowerCase(), known.type, category),
  }
  return { ...item, description: makeDescription(item) }
}

/** Фото учитывается в лимите, когда вещь попала в гардероб; неудачные и удалённые слот не возвращают/не тратят */
export function addPhotoItem(item: Item, opts: { background?: boolean; countPhoto?: boolean } = {}) {
  const app = useApp.getState()
  const offline = app.offline
  const processingLeft = opts.background ? Math.max(0, PROCESS_MS - (Date.now() - usePhotoFlow.getState().startedAt)) : 0
  const entry: Item = { ...item, addedAt: Date.now(), queued: offline || undefined, processing: !offline && processingLeft > 0 ? true : undefined }
  app.addItem(entry)
  // с серверным распознаванием фото уже посчитал сервер (см. intakePhoto), считаем у себя только без него
  const serverCounts = hasSession() && getCaps().analyze
  if (opts.countPhoto !== false && !serverCounts) app.patch({ usage: { ...app.usage, photosTotal: app.usage.photosTotal + 1, photosMonth: app.usage.photosMonth + 1 } })
  if (!offline && processingLeft > 0) setTimeout(() => finishProcessing(entry.id), processingLeft)
  return entry
}

/** Фото доделывается в фоне: плитка в гардеробе показывает шиммер, потом вещь готова */
export function finishProcessing(id: string) {
  const app = useApp.getState()
  const it = app.items.find((i) => i.id === id)
  if (it) app.updateItem({ ...it, processing: undefined, queued: undefined })
}

/** Когда сеть вернулась (кнопка демо или реальное событие online), фото из очереди «Ждёт сеть» обрабатываются */
export function processQueued() {
  const app = useApp.getState()
  app.items.filter((i) => i.queued).forEach((i, k) => {
    app.updateItem({ ...i, queued: undefined, processing: true })
    setTimeout(() => finishProcessing(i.id), PROCESS_MS + k * 600)
  })
}

if (typeof window !== 'undefined') window.addEventListener('atelier:online', () => setTimeout(processQueued, 600))
