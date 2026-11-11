import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'
import { HAS_API } from './config'
import { findCity, nearestCity, type City } from '../data/cities'
import { WEATHER as DEMO } from '../data/items'
import { useApp } from '../store/app'

/**
 * Погода для подбора образа. Место берётся так:
 * 1) то, что человек выбрал сам: «определить по геопозиции» или город из шторки;
 * 2) иначе город из анкеты.
 * Если ни то ни другое не распознано (VPN, отказ в геопозиции, город вне списка), погоды нет, и приложение просит выбрать город.
 * Образ при этом собирается всё равно: без погоды алгоритм и AI считают условия мягкими
 */
export type WxKind = 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'snow' | 'storm'
export interface Wx { temp: number; label: string; kind: WxKind; note: string; at: number; stale?: boolean }
export interface Place { name: string; lat: number; lon: number; source: 'geo' | 'city' }
export type GeoResult = 'ok' | 'denied' | 'unavailable' | 'error'

const FRESH_MS = 15 * 60 * 1000
const KEEP_MS = 6 * 3600 * 1000
export const WX_ICON: Record<WxKind, string> = { sun: 'sun', 'cloud-sun': 'cloud-sun', cloud: 'cloud', rain: 'cloud-rain', snow: 'cloud-snow', storm: 'lightning' }

const round2 = (n: number) => Math.round(n * 100) / 100
const keyOf = (p: { lat: number; lon: number }) => `${round2(p.lat)},${round2(p.lon)}`

/** Место из анкеты: «Казань» из списка городов. Произвольный текст вне списка места не даёт */
function quizPlace(): Place | null {
  const c = findCity(useApp.getState().quiz.city)
  return c ? { name: c.name, lat: c.lat, lon: c.lon, source: 'city' } : null
}

interface WeatherState {
  place: Place | null
  data: Wx | null
  dataKey: string
  status: 'idle' | 'loading' | 'ok' | 'error'
  refresh: (force?: boolean) => Promise<void>
  /** true, если погода для города загрузилась */
  pickCity: (c: City) => Promise<boolean>
  locate: () => Promise<GeoResult>
}

let inflight: Promise<void> | null = null

export const useWeather = create<WeatherState>()(
  persist(
    (set, get) => ({
      place: null,
      data: null,
      dataKey: '',
      status: 'idle',

      refresh: async (force = false) => {
        const place = get().place ?? quizPlace()
        if (!place) { set({ status: 'error', data: null, dataKey: '' }); return }
        const key = keyOf(place)
        const { data, dataKey } = get()
        if (!force && data && dataKey === key && Date.now() - data.at < FRESH_MS) { set({ status: 'ok' }); return }
        // без серверной части (демо) погода условная, но выбор города работает
        if (!HAS_API) { set({ data: { temp: DEMO.temp, label: DEMO.label, kind: 'cloud-sun', note: DEMO.note, at: Date.now() }, dataKey: key, status: 'ok' }); return }
        if (useApp.getState().offline) return
        if (inflight) return inflight
        set({ status: data && dataKey === key ? get().status : 'loading' })
        inflight = (async () => {
          try {
            const w = await api<Wx>('GET', `/api/weather?lat=${round2(place.lat)}&lon=${round2(place.lon)}`, undefined, { timeout: 9000 })
            set({ data: w, dataKey: key, status: 'ok' })
          } catch {
            // сеть или источник недоступны: старые данные этого же места живут до 6 часов, чужие не показываем
            const cur = get()
            const usable = cur.data && cur.dataKey === key && Date.now() - cur.data.at < KEEP_MS
            set({ status: 'error', ...(usable ? {} : { data: null, dataKey: '' }) })
          } finally { inflight = null }
        })()
        return inflight
      },

      pickCity: async (c) => {
        set({ place: { name: c.name, lat: c.lat, lon: c.lon, source: 'city' } })
        useApp.getState().setQuiz({ city: c.name })
        await get().refresh(true)
        const { data, dataKey } = get()
        return !!data && dataKey === keyOf(c)
      },

      locate: () => new Promise<GeoResult>((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve('unavailable'); return }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = round2(pos.coords.latitude)
            const lon = round2(pos.coords.longitude)
            const near = nearestCity(lat, lon)
            set({ place: { name: near?.name ?? 'Рядом с тобой', lat, lon, source: 'geo' } })
            await get().refresh(true)
            resolve(get().data ? 'ok' : 'error')
          },
          (err) => resolve(err.code === 1 ? 'denied' : 'unavailable'),
          { timeout: 10000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false },
        )
      }),
    }),
    {
      name: 'atelier-weather',
      partialize: (s) => ({ place: s.place, data: s.data, dataKey: s.dataKey }),
    },
  ),
)

/** Погода сейчас для расчётов (образ, AI): null, если места нет или данные старше 6 часов */
export function currentWeather(): Wx | null {
  const { data, dataKey, place } = useWeather.getState()
  const p = place ?? quizPlace()
  if (!data || !p || dataKey !== keyOf(p) || Date.now() - data.at > KEEP_MS) return null
  return data
}

/** Название места для подписи: выбранное или из анкеты */
export function placeName(place: Place | null, quizCity: string): string {
  return place?.name ?? findCity(quizCity)?.name ?? ''
}

/** Если разрешение на геопозицию уже выдано и человек выбрал «по геопозиции», тихо обновляем координаты: он мог переехать */
export async function refreshGeoQuietly() {
  const { place, locate } = useWeather.getState()
  if (place?.source !== 'geo') return
  try {
    const st = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    if (st?.state === 'granted') await locate()
  } catch { /* Permissions API нет: оставляем сохранённую точку */ }
}

/** Что у человека с температурой: «+8°», «−3°», «0°» (настоящий минус, не дефис) */
export function tempText(t: number): string {
  if (t > 0) return `+${t}°`
  if (t < 0) return `−${Math.abs(t)}°`
  return '0°'
}
