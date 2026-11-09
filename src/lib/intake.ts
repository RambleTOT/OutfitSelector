import type { NavigateFunction } from 'react-router-dom'
import { analyzePhoto } from './ai'
import { cutOutPhoto, looksLikeNotClothing, prepareUpload } from './image'
import { getCaps, hasSession } from './api'
import { analyzedItem, guessItem, usePhotoFlow } from '../store/photo'
import { toast } from '../store/ui'

/**
 * Единый вход для фото вещи (камера, галерея, «Не похоже на одежду»).
 * С сервисом распознавания: вырезание фона, вид и цвет определяет сервер, на фото может быть несколько вещей.
 * Без него (демо или сервис недоступен): упрощённая обработка на телефоне и догадка по названию файла.
 * Возвращает false, если человек остаётся на месте (ошибка), true, если ушли на другой экран.
 */
export async function intakePhoto(file: File, navigate: NavigateFunction, onLimit?: () => void): Promise<boolean> {
  if (looksLikeNotClothing(file)) {
    usePhotoFlow.getState().fail()
    navigate('/add/notclothing', { replace: true })
    return true
  }
  if (hasSession() && getCaps().analyze) {
    let res
    try { res = await analyzePhoto(await prepareUpload(file)) } catch { res = null }
    if (res === 'limit') { onLimit?.(); toast('Лимит фото на тарифе закончился', 'error'); return false }
    if (res) {
      if (res.notClothing || !res.items.length) {
        usePhotoFlow.getState().fail()
        navigate('/add/notclothing', { replace: true })
        return true
      }
      const items = res.items.map(analyzedItem)
      if (items.length === 1) {
        usePhotoFlow.getState().start(items[0])
        navigate('/add/processing', { replace: true })
      } else {
        usePhotoFlow.getState().startFound(items)
        navigate('/add/found', { replace: true })
      }
      return true
    }
    // сервис не ответил: идём упрощённым путём, человек не должен терять фото
  }
  const local = await cutOutPhoto(file)
  usePhotoFlow.getState().start(guessItem(local.dataUrl, local.colorName, file.name))
  navigate('/add/processing', { replace: true })
  return true
}
