import { api, getCaps, getToken, hasSession, ApiError } from './api'
import { API_URL } from './config'
import type { Item, OccasionId } from '../data/types'
import { WEATHER } from '../data/items'
import { useApp } from '../store/app'

export interface AiOutfit { ids: string[]; name: string; explanation: string }

/** Серверный AI собирает образ. Любая ошибка (кроме лимита) возвращает null, и клиент использует локальный алгоритм: человек образ получит в любом случае */
export async function aiOutfit(items: Item[], occasion: OccasionId, wish: string, avoid: string[] = []): Promise<AiOutfit | 'limit' | null> {
  if (!hasSession() || !getCaps().ai) return null
  const nogo = useApp.getState().quiz.nogo
  try {
    return await api<AiOutfit>('POST', '/api/ai/outfit', {
      occasion, wish, avoid, nogo,
      weather: { temp: WEATHER.temp, desc: WEATHER.label },
      items: items.filter((i) => i.available).slice(0, 25).map((i) => ({ id: i.id, category: i.category, title: i.title, colorName: i.colorName, formality: i.formality, warmth: i.warmth })),
    }, { timeout: 25000 })
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'limit' || e.code === 'cap')) return 'limit'
    return null
  }
}

/** Вещь, которую нашёл сервис распознавания (vision/): вырезана с прозрачным фоном, вид и цвет определены */
export interface Analyzed {
  category: string; type: string; colorName: string; colorHex: string; pattern: string
  confidence: number; area: number; cutout: string; studio: string; source: string
}
export interface AnalyzeResult { mode: 'worn' | 'flat'; notClothing: boolean; warnings: string[]; items: Analyzed[] }

/**
 * Фото -> вещи с вырезанным фоном. Исходник ужимается до 1280 px и уходит на наш сервер, где не сохраняется.
 * null: сервис недоступен или занят, тогда приложение обрабатывает фото на телефоне упрощённо.
 */
export async function analyzePhoto(blob: Blob): Promise<AnalyzeResult | 'limit' | null> {
  if (!hasSession() || !getCaps().analyze) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 100_000)
    const r = await fetch(API_URL + '/api/ai/analyze', { method: 'POST', signal: ctrl.signal, headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': blob.type || 'image/jpeg' }, body: blob })
    clearTimeout(t)
    if (r.status === 429) return 'limit'
    if (!r.ok) return null
    return await r.json() as AnalyzeResult
  } catch { return null }
}
