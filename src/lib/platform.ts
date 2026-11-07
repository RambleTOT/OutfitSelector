export type Platform = 'ios' | 'android' | 'telegram' | 'instagram' | 'vk' | 'tiktok'
export type PlatformPref = 'auto' | Platform

/** Где открыт сайт: по user agent (Telegram, Instagram, VKClient, musical_ly / BytedanceWebview), на десктопе показываем iOS-вариант */
export function detectPlatform(ua = navigator.userAgent): Platform {
  if (/Telegram/i.test(ua)) return 'telegram'
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/VKClient/i.test(ua)) return 'vk'
  if (/musical_ly|Bytedance/i.test(ua)) return 'tiktok'
  if (/Android/i.test(ua)) return 'android'
  return 'ios'
}

export const resolvePlatform = (pref: PlatformPref): Platform => (pref === 'auto' ? detectPlatform() : pref)

export const isInApp = (p: Platform) => p === 'telegram' || p === 'instagram' || p === 'vk' || p === 'tiktok'

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Телефон или планшет (а не компьютер): по user agent и касаниям, iPadOS 13+ называет себя Mac */
export function isMobileDevice(ua = navigator.userAgent): boolean {
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
}

/** Настоящий iPhone или iPad (в отличие от detectPlatform, где по умолчанию стоит ios для десктопа) */
export const isRealIOS = (ua = navigator.userAgent) => /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)

/** Не Safari на iPhone: Chrome, Яндекс, Firefox, Opera. Там кнопка «Поделиться» может быть вверху */
export const isIOSOtherBrowser = (ua = navigator.userAgent) => isRealIOS(ua) && /CriOS|FxiOS|YaBrowser|OPiOS|EdgiOS/i.test(ua)

/** Тексты ON-12 по приложениям (решение 8 из пакета) */
export const IN_APP: Record<'telegram' | 'instagram' | 'vk' | 'tiktok', { name: string; why: string; steps: [string, string] }> = {
  telegram: { name: 'Telegram', why: 'Внутри Telegram нельзя поставить приложение на экран и включить уведомления', steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в браузере'] },
  instagram: { name: 'Instagram', why: 'Внутри Instagram не работают камера, вход и установка на экран', steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть во внешнем браузере'] },
  vk: { name: 'VK', why: 'Внутри VK нельзя поставить приложение на экран и включить уведомления', steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в браузере'] },
  tiktok: { name: 'TikTok', why: 'Внутри TikTok не работают камера, вход и установка на экран', steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в браузере'] },
}
