import { api, getCaps, hasSession, ApiError } from './api'
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

export interface Described { isClothing: boolean; category?: string; type?: string; colorName?: string; formality?: string; warmth?: string; fit?: string; pattern?: string; material?: string }

/** Описание вещи по фото. null: сервер без модели с картинками, карточка заполняется шаблоном */
export async function describePhoto(dataUrl: string): Promise<Described | null> {
  if (!hasSession() || !getCaps().vision) return null
  try { return await api<Described>('POST', '/api/ai/describe', { image: dataUrl }, { timeout: 30000 }) } catch { return null }
}

/** Вырезание фона через сервер. null: сервиса нет, остаётся исходное фото */
export async function cutoutPhoto(dataUrl: string): Promise<string | null> {
  if (!hasSession() || !getCaps().cutout) return null
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const { API_URL } = await import('./config')
    const { getToken } = await import('./api')
    const r = await fetch(API_URL + '/api/ai/cutout', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': blob.type || 'image/png' }, body: blob })
    if (!r.ok) return null
    const out = await r.blob()
    return await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(out) })
  } catch { return null }
}
