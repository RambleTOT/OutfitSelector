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

/** Адрес сервера. Пусто: серверной части нет, всё работает на моках (как в прототипе) */
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
export const HAS_API = API_URL !== ''

/** Публичный ID терминала CloudPayments (pk_…). Пусто: оплата в демо-режиме */
export const CP_PUBLIC_ID: string = (import.meta.env.VITE_CP_PUBLIC_ID as string | undefined) ?? ''
export const HAS_PAYMENTS = CP_PUBLIC_ID !== ''

/** Id счётчика Яндекс.Метрики. Пусто: метрика не подключается */
export const METRIKA_ID: string = (import.meta.env.VITE_METRIKA_ID as string | undefined) ?? ''

export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) ?? (typeof location !== 'undefined' ? location.origin : '')
