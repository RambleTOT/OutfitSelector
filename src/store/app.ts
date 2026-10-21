import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_ITEMS } from '../data/items'
import type { Item, OccasionId, SavedOutfit } from '../data/types'
import { LIMITS, MONTHLY_CAP, monthKey, weekKey } from './limits'

export type Plan = 'free' | 'sub' | 'plus'
export type ThemePref = 'system' | 'light' | 'dark'

export interface Quiz {
  who: string | null // для кого одежда
  city: string
  occasions: OccasionId[]
  styles: string[]
  nogo: string[]
}

export interface Notif {
  morning: boolean
  morningTime: string
  weather: boolean
  unfinished: boolean
  comeback: boolean
  forgotten: boolean
  limit: boolean
  telegramBot: boolean
}

export interface Usage {
  weekKey: string
  outfitsWeek: number
  monthKey: string
  outfitsMonth: number
  photosTotal: number
  photosMonth: number
}

interface Data {
  plan: Plan
  subEnded: boolean // подписка закончилась: лимиты как у Free, ничего не удаляется
  subCancelled: boolean // отменена, действует до subEndsAt
  subEndsAt: number | null
  theme: ThemePref
  offline: boolean

  signedIn: boolean
  via: 'email' | 'telegram' | null
  email: string
  name: string
  height: string
  size: string
  quiz: Quiz
  onboarded: boolean
  firstItemsSkipped: boolean
  installed: boolean

  items: Item[]
  saved: SavedOutfit[]
  usage: Usage
  seen: Record<string, boolean> // подсказки и разовые экраны
  notif: Notif
}

interface Actions {
  patch: (p: Partial<Data>) => void
  setPlan: (p: Plan) => void
  setTheme: (t: ThemePref) => void
  toggleOffline: () => void
  endSubscription: () => void
  exhaustLimit: () => void
  skipOnboarding: () => void
  resetDemo: () => void
  markSeen: (key: string) => void
  refreshUsage: () => void
}

export type AppState = Data & Actions

const freshUsage = (): Usage => ({
  weekKey: weekKey(),
  outfitsWeek: 0,
  monthKey: monthKey(),
  outfitsMonth: 0,
  photosTotal: 0,
  photosMonth: 0,
})

const initial = (): Data => ({
  plan: 'free',
  subEnded: false,
  subCancelled: false,
  subEndsAt: null,
  theme: 'system',
  offline: false,

  signedIn: false,
  via: null,
  email: '',
  name: '',
  height: '',
  size: '',
  quiz: { who: null, city: 'Москва', occasions: [], styles: [], nogo: [] },
  onboarded: false,
  firstItemsSkipped: false,
  installed: false,

  items: [],
  saved: [],
  usage: freshUsage(),
  seen: {},
  notif: {
    morning: true,
    morningTime: '08:00',
    weather: true,
    unfinished: true,
    comeback: true,
    forgotten: true,
    limit: true,
    telegramBot: false,
  },
})

export const STORAGE_KEY = 'atelier-demo-v1'

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      patch: (p) => set(p),

      setPlan: (plan) => set({ plan, subEnded: false, subCancelled: false, subEndsAt: null }),
      setTheme: (theme) => set({ theme }),
      toggleOffline: () => set((s) => ({ offline: !s.offline })),
      endSubscription: () =>
        set((s) => ({ plan: s.plan === 'free' ? 'sub' : s.plan, subEnded: true, subCancelled: false, subEndsAt: null })),

      // «Лимит закончился»: недельный лимит выбран (на Подписке+ срабатывает потолок 300 в месяц)
      exhaustLimit: () => {
        const s = get()
        const plan = s.subEnded ? 'free' : s.plan
        const lim = LIMITS[plan].outfitsWeek
        set({
          usage: lim === null ? { ...s.usage, outfitsMonth: MONTHLY_CAP } : { ...s.usage, outfitsWeek: lim },
        })
      },

      skipOnboarding: () =>
        set((s) => ({
          signedIn: true,
          via: s.via ?? 'email',
          email: s.email || 'anna@example.com',
          name: s.name || 'Анна',
          onboarded: true,
          items: s.items.length >= MOCK_ITEMS.length ? s.items : MOCK_ITEMS.map((i) => ({ ...i })),
          seen: { ...s.seen },
        })),

      resetDemo: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* localStorage недоступен */
        }
        set({ ...initial() })
      },

      markSeen: (key) => set((s) => (s.seen[key] ? s : { seen: { ...s.seen, [key]: true } })),

      // сброс недельного и месячного счётчиков при смене недели/месяца
      refreshUsage: () => {
        const u = get().usage
        const wk = weekKey()
        const mk = monthKey()
        if (u.weekKey === wk && u.monthKey === mk) return
        set({
          usage: {
            ...u,
            weekKey: wk,
            monthKey: mk,
            outfitsWeek: u.weekKey === wk ? u.outfitsWeek : 0,
            outfitsMonth: u.monthKey === mk ? u.outfitsMonth : 0,
            photosMonth: u.monthKey === mk ? u.photosMonth : 0,
          },
        })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // новые поля из initial() не теряются при старых сохранениях
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<AppState>) }),
      onRehydrateStorage: () => (state) => state?.refreshUsage(),
    },
  ),
)

/** Эффективный тариф: после окончания подписки лимиты как у Free */
export const effectivePlan = (s: Pick<Data, 'plan' | 'subEnded'>): Plan => (s.subEnded ? 'free' : s.plan)

export interface LimitInfo {
  plan: Plan
  outfitsLimit: number | null
  outfitsLeft: number | null // null = без лимита
  monthlyCapReached: boolean
  photosLimit: number | null
  photosLeft: number | null
  photosPeriod: 'total' | 'month' | null
  favLimit: number | null
  favLeft: number | null
}

export function computeLimits(s: Data): LimitInfo {
  const plan = effectivePlan(s)
  const l = LIMITS[plan]
  const u = s.usage
  const photosLimit = l.photosTotal ?? l.photosMonth
  const photosUsed = l.photosTotal !== null ? u.photosTotal : u.photosMonth
  return {
    plan,
    outfitsLimit: l.outfitsWeek,
    outfitsLeft: l.outfitsWeek === null ? null : Math.max(0, l.outfitsWeek - u.outfitsWeek),
    monthlyCapReached: l.outfitsWeek === null && u.outfitsMonth >= MONTHLY_CAP,
    photosLimit,
    photosLeft: photosLimit === null ? null : Math.max(0, photosLimit - photosUsed),
    photosPeriod: l.photosTotal !== null ? 'total' : l.photosMonth !== null ? 'month' : null,
    favLimit: l.favorites,
    favLeft: l.favorites === null ? null : l.favorites - s.saved.length, // может быть отрицательным (FAV-05)
  }
}

export function useLimits(): LimitInfo {
  const plan = useApp((s) => s.plan)
  const subEnded = useApp((s) => s.subEnded)
  const usage = useApp((s) => s.usage)
  const saved = useApp((s) => s.saved)
  return computeLimits({ ...initial(), plan, subEnded, usage, saved })
}
