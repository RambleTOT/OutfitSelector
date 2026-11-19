import { getToken } from '../lib/api'
import { HAS_API } from '../lib/config'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { hasPhoto, MOCK_ITEMS } from '../data/items'
import type { Item, SavedOutfit } from '../data/types'
import type { PlatformPref } from '../lib/platform'
import { LIMITS, MONTHLY_CAP, monthKey, weekKey } from './limits'

export type Plan = 'free' | 'sub' | 'plus'
export type ThemePref = 'system' | 'light' | 'dark'

export interface Quiz {
  who: string | null // для кого одежда
  city: string
  occasions: string[]
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
  payments: boolean
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
  subEndedAt: number | null
  payFail: boolean // демо: следующая оплата вернётся с ошибкой (PAY-03)
  theme: ThemePref
  offline: boolean

  signedIn: boolean
  via: 'email' | 'telegram' | null
  geoAsked: boolean // после первого входа спросили геопозицию (экран «Где ты сейчас»)
  gateDone: boolean // экран установки на главный экран пройден или пропущен
  consent: string // редакция согласия на обработку данных, которую человек принял на этом устройстве
  email: string
  name: string
  avatar: string
  height: string
  size: string
  quiz: Quiz
  quizDone: boolean
  onboarded: boolean
  firstItemsSkipped: boolean
  installed: boolean
  platform: PlatformPref // где открыт сайт (демо: переключается в панели)

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
  spendGeneration: () => void
  saveOutfit: (o: Omit<SavedOutfit, 'id' | 'createdAt'>) => 'saved' | 'full' | 'over'
  activatePlan: (p: Plan) => void
  signIn: (email: string, via: 'email' | 'telegram') => 'new' | 'returning'
  setQuiz: (q: Partial<Quiz>) => void
  finishQuiz: () => void
  finishOnboarding: (skipped: boolean) => void
  signOut: () => void
  deleteSaved: (id: string) => void
  updateSaved: (id: string, patch: Partial<SavedOutfit>) => void
  replaceSaved: (oldId: string, o: Omit<SavedOutfit, 'id' | 'createdAt'>) => void
  addItem: (i: Item) => void
  updateItem: (i: Item) => void
  deleteItem: (id: string) => void
}

export type AppState = Data & Actions

const DAY = 86400000
/** Два сохранённых образа для демо: избранное не пустое, а место для новых ещё есть */
const seedSaved = (): SavedOutfit[] => [
  { id: 'seed1', name: 'Офис в среду', occasion: 'work', items: ['i09', 'i02', 'i13', 'i19', 'i21'], createdAt: Date.now() - 7 * DAY, explanation: 'Пиджак и светлая рубашка держат деловой тон, лоферы собирают образ' },
  { id: 'seed2', name: 'Парк и кофе', occasion: 'walk', items: ['i04', 'i12', 'i18', 'i24'], createdAt: Date.now() - 19 * DAY, explanation: 'Худи и широкие джинсы для долгой прогулки, кепка на случай солнца' },
]

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
  subEndedAt: null,
  payFail: false,
  theme: 'system',
  offline: false,

  signedIn: false,
  via: null,
  geoAsked: false,
  gateDone: false,
  consent: '',
  email: '',
  name: '',
  avatar: '',
  height: '',
  size: '',
  quiz: { who: null, city: 'Москва', occasions: [], styles: [], nogo: [] },
  quizDone: false,
  onboarded: false,
  firstItemsSkipped: false,
  installed: false,
  platform: 'auto',

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
    payments: true,
    telegramBot: false,
  },
})

export const STORAGE_KEY = 'atelier-demo-v1'

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      patch: (p) => set(p),

      setPlan: (plan) => set({ plan, subEnded: false, subCancelled: false, subEndsAt: plan === 'free' ? null : Date.now() + 30 * 86400000 }),
      setTheme: (theme) => set({ theme }),
      toggleOffline: () => {
        const nowOnline = get().offline
        set({ offline: !nowOnline })
        if (nowOnline) window.dispatchEvent(new Event('atelier:online')) // очередь фото подхватит store/photo.ts
      },
      endSubscription: () =>
        set((s) => ({ plan: s.plan === 'free' ? 'sub' : s.plan, subEnded: true, subCancelled: false, subEndsAt: null, subEndedAt: Date.now() })),

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
          quizDone: true,
          onboarded: true,
          items: s.items.length >= MOCK_ITEMS.length ? s.items : MOCK_ITEMS.map((i) => ({ ...i })),
          saved: s.saved.length ? s.saved : seedSaved(),
          seen: { ...s.seen },
        })),

      resetDemo: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* localStorage недоступен */
        }
        set({ ...initial(), theme: get().theme }) // тема переживает сброс, чтобы не мигала на показе
      },

      // успешная генерация тратит образ (замена вещи и неудачная генерация не тратят)
      spendGeneration: () =>
        set((s) => ({ usage: { ...s.usage, outfitsWeek: s.usage.outfitsWeek + 1, outfitsMonth: s.usage.outfitsMonth + 1 } })),

      // сохранение в избранное: при заполненном избранном (FAV-02) или превышении после окончания подписки (FAV-05) не сохраняет
      saveOutfit: (o) => {
        const s = get()
        const limit = LIMITS[effectivePlan(s)].favorites
        if (limit !== null && s.saved.length >= limit) return s.saved.length > limit ? 'over' : 'full'
        set({ saved: [{ ...o, id: 'o' + Date.now().toString(36), createdAt: Date.now() }, ...s.saved] })
        return 'saved'
      },

      deleteSaved: (id) => set((s) => ({ saved: s.saved.filter((o) => o.id !== id) })),
      updateSaved: (id, patch) => set((s) => ({ saved: s.saved.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      // шторка заполненного избранного: новый образ встаёт на место выбранного
      replaceSaved: (oldId, o) => set((s) => ({ saved: [{ ...o, id: 'o' + Date.now().toString(36), createdAt: Date.now() }, ...s.saved.filter((x) => x.id !== oldId)] })),

      // имитация оплаты: тариф включается сразу
      activatePlan: (plan) => set({ plan, subEnded: false, subCancelled: false, subEndedAt: null, subEndsAt: plan === 'free' ? null : Date.now() + 30 * 86400000 }),

      // вход: любая почта и код 1111, Telegram пускает сразу. Возвращающийся пользователь сразу попадает в Образ
      signIn: (email, via) => {
        const s = get()
        const returning = s.onboarded && via === 'email' && s.email === email
        set({
          signedIn: true,
          via,
          email: via === 'email' ? email : s.email,
          name: s.name || (via === 'email' ? email.split('@')[0].replace(/^./, (c) => c.toUpperCase()) : 'Анна'),
          notif: via === 'telegram' ? { ...s.notif, telegramBot: true } : s.notif,
        })
        return returning ? 'returning' : 'new'
      },
      setQuiz: (q) => set((s) => ({ quiz: { ...s.quiz, ...q } })),
      finishQuiz: () => set({ quizDone: true }),
      signOut: () => set({ signedIn: false }),
      finishOnboarding: (skipped) => set((s) => ({ onboarded: true, firstItemsSkipped: skipped, seen: skipped ? s.seen : { ...s.seen, firstOutfit: true } })),

      addItem: (item) => set((s) => ({ items: [{ ...item, addedAt: item.addedAt ?? Date.now() }, ...s.items] })),
      updateItem: (item) => set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
      // удаление не возвращает слот фото; сохранённые образы помечают вещь как удалённую (P6)
      deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

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
      // переполнение localStorage (много фото) не должно ломать приложение
      storage: createJSONStorage(() => ({
        getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
        setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* квота */ } },
        removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* нет доступа */ } },
      })),
      // новые поля из initial() не теряются при старых сохранениях
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        // сохранения до появления quizDone: уже прошедший онбординг считается прошедшим анкету
        // фото, которые «обрабатывались» в момент перезагрузки, считаем готовыми
        const items = (p.items ?? current.items).filter(hasPhoto).map((i) => (i.processing ? { ...i, processing: undefined } : i))
        const merged = { ...current, ...p, items, quizDone: p.quizDone ?? !!p.onboarded }
        // гостевого режима больше нет: сохранённый «гость» или вход без токена (при подключённом сервере) требует войти заново
        if ((merged.via as string) === 'guest' || (HAS_API && !getToken())) { merged.signedIn = false; merged.via = null }
        return merged
      },
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
