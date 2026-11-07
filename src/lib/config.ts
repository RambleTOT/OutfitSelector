/** Настройки сборки и режима показа. Адрес API и ключи платёжки задаются в .env (см. docs/DEPLOY.md), без них приложение работает как демо */
const KEY = 'atelier-demo-mode'

function readDemo(): boolean {
  try {
    const q = new URLSearchParams(location.search)
    if (q.has('demo')) {
      if (q.get('demo') === '0') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, '1')
    }
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Демо-режим для показа и записи ролика: панель справа от рамки, без экрана установки. Включается ссылкой ?demo, выключается ?demo=0 */
export const DEMO = typeof window !== 'undefined' && readDemo()

/** Приложение собрано в Capacitor (APK для RuStore) */
export const isNative = () => typeof window !== 'undefined' && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

/**
 * Адрес сервера. Не задан VITE_API_URL: серверной части нет, всё на моках (как в прототипе).
 * VITE_API_URL=same: сайт и API на одном домене (обычный случай, nginx проксирует /api). Иначе полный адрес, например https://api.atelier.ru
 */
const RAW = import.meta.env.VITE_API_URL as string | undefined
export const HAS_API = RAW !== undefined && RAW !== ''
export const API_URL: string = RAW === 'same' || RAW === undefined ? '' : RAW.replace(/\/$/, '')

/** Id счётчика Яндекс.Метрики. Пусто: метрика не подключается */
export const METRIKA_ID: string = (import.meta.env.VITE_METRIKA_ID as string | undefined) ?? ''

export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) ?? (typeof location !== 'undefined' ? location.origin : '')
