import { create } from 'zustand'
import { canGenerate, explain, generateOutfit, type GeneratedOutfit } from '../data/generate'
import type { Item, OccasionId } from '../data/types'
import { computeLimits, useApp } from './app'
import { aiOutfit } from '../lib/ai'

export type Phase = 'idle' | 'waiting' | 'result' | 'error'

interface FlowState {
  occasion: OccasionId
  wish: string
  phase: Phase
  result: GeneratedOutfit | null
  variant: number
  liked: boolean | null
  worn: boolean
  savedId: string | null
  setOccasion: (o: OccasionId) => void
  setWish: (w: string) => void
  /** 'new' начинает с заготовки повода, 'another' берёт следующую и тратит образ */
  start: (kind: 'new' | 'another') => 'started' | 'offline' | 'limit' | 'cap' | 'empty'
  cancel: () => void
  back: () => void
  replaceItem: (oldId: string, newId: string) => void
  setLiked: (v: boolean | null) => void
  toggleWorn: () => void
  setSaved: (id: string | null) => void
}

export const WAIT_MS = 1800
let timer: ReturnType<typeof setTimeout> | undefined
let run = 0

/** Состояние сборки образа. Не сохраняется: после перезагрузки экран возвращается в исходное */
export const useOutfitFlow = create<FlowState>((set, get) => ({
  occasion: 'work',
  wish: '',
  phase: 'idle',
  result: null,
  variant: 0,
  liked: null,
  worn: false,
  savedId: null,

  setOccasion: (occasion) => set({ occasion }),
  setWish: (wish) => set({ wish }),

  start: (kind) => {
    const app = useApp.getState()
    if (app.offline) return 'offline'
    const lim = computeLimits(app)
    if (lim.monthlyCapReached) return 'cap'
    if (lim.outfitsLeft !== null && lim.outfitsLeft <= 0) return 'limit'
    if (!canGenerate(app.items)) return 'empty'
    const { occasion, wish, result, variant } = get()
    const nextVariant = kind === 'another' ? variant + 1 : 0
    set({ phase: 'waiting', variant: nextVariant })
    clearTimeout(timer)
    const avoid = kind === 'another' ? result?.itemIds : undefined
    // сервер с AI (если подключён) собирает образ параллельно с минимальным ожиданием; любая его ошибка уходит в локальный алгоритм
    const ai = aiOutfit(app.items, occasion, wish, avoid ?? [])
    const mine = ++run
    timer = setTimeout(async () => {
      const smart = await ai
      if (mine !== run || get().phase !== 'waiting') return // человек отменил ожидание
      const a = useApp.getState()
      // сеть пропала, пока ждали: образ не собран, лимит не списывается (OUT-06)
      if (a.offline) { set({ phase: 'error' }); return }
      if (smart === 'limit') { a.exhaustLimit(); set({ phase: get().result ? 'result' : 'idle' }); return }
      const gen = generateOutfit(a.items, occasion, nextVariant, wish, avoid)
      if (smart) {
        const chosen = smart.ids.map((id) => a.items.find((i) => i.id === id)).filter((i): i is Item => !!i)
        gen.itemIds = chosen.map((i) => i.id)
        gen.explanation = smart.explanation || explain(chosen)
      }
      a.spendGeneration()
      set({ phase: 'result', result: gen, liked: null, worn: false, savedId: null })
    }, WAIT_MS)
    return 'started'
  },

  cancel: () => {
    clearTimeout(timer); run++
    set({ phase: get().result ? 'result' : 'idle' })
  },

  back: () => {
    clearTimeout(timer); run++
    set({ phase: 'idle', result: null, liked: null, worn: false, savedId: null, variant: 0 })
  },

  // замена вещи бесплатна; после замены объяснение пересобирается под новый состав
  replaceItem: (oldId, newId) =>
    set((s) => {
      if (!s.result) return s
      const itemIds = s.result.itemIds.map((id) => (id === oldId ? newId : id))
      const all = useApp.getState().items
      const chosen = itemIds.map((id) => all.find((i) => i.id === id)).filter((i): i is Item => !!i)
      return { result: { ...s.result, itemIds, explanation: explain(chosen) }, savedId: null }
    }),

  setLiked: (liked) => set({ liked }),
  toggleWorn: () => set((s) => ({ worn: !s.worn })),
  setSaved: (savedId) => set({ savedId }),
}))
