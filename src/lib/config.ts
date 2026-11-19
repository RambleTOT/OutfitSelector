/** Редакция согласия на обработку данных (дата документа). Меняется вместе с docs/legal/consent.md: тогда людей снова попросят согласиться */
export const CONSENT_VERSION = '2026-11-19'

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

/** Контакты поддержки: ник в Telegram (без @) и почта. Задаются в .env, пока пусто, кнопки поддержки скромно сообщают, что чат скоро откроется */
export const SUPPORT_TG: string = ((import.meta.env.VITE_SUPPORT_TG as string | undefined) ?? '').replace(/^@/, '')
export const SUPPORT_EMAIL: string = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? ''

/** Id счётчика Яндекс.Метрики. Пусто: метрика не подключается */
export const METRIKA_ID: string = (import.meta.env.VITE_METRIKA_ID as string | undefined) ?? ''

export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) ?? (typeof location !== 'undefined' ? location.origin : '')
