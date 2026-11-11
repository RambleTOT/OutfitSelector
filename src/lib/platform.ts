export type Platform = 'ios' | 'android' | 'telegram' | 'instagram' | 'vk' | 'tiktok' | 'inapp'
export type PlatformPref = 'auto' | Platform

/**
 * Где открыт сайт. Встроенные браузеры приложений не умеют ставить сайт на экран (на iPhone нет «На экран Домой»), поэтому их узнаём и просим открыть ссылку в настоящем браузере.
 * Telegram на iPhone в user agent себя не называет, зато у встроенных браузеров на iOS (WKWebView) нет слова Safari/, у настоящих Safari, Chrome, Яндекса и Firefox оно есть.
 * Иконка на экране «Домой» тоже без Safari/, поэтому в режиме приложения встроенным браузером не считаем. На десктопе показываем iOS-вариант
 */
export function detectPlatform(ua = navigator.userAgent): Platform {
  if (/Telegram/i.test(ua) || 'TelegramWebviewProxy' in window) return 'telegram'
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/VKClient|VKAndroidApp/i.test(ua)) return 'vk'
  if (/musical_ly|Bytedance|TikTok/i.test(ua)) return 'tiktok'
  const ios = /iPhone|iPad|iPod/i.test(ua)
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches
  if (/FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|OKApp|Snapchat/i.test(ua)) return 'inapp'
  if (ios && !standalone && !/Safari\//i.test(ua)) return 'inapp'
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return 'inapp'
  if (/Android/i.test(ua)) return 'android'
  return 'ios'
}

export const resolvePlatform = (pref: PlatformPref): Platform => (pref === 'auto' ? detectPlatform() : pref)

export const isInApp = (p: Platform) => p === 'telegram' || p === 'instagram' || p === 'vk' || p === 'tiktok' || p === 'inapp'

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

/** Тексты ON-12 по приложениям (решение 8 из пакета). Везде одно: открыть ссылку в настоящем браузере */
const OPEN_IN = 'Открой ссылку в Safari, Chrome, Яндекс Браузере или любом другом браузере'
export const IN_APP: Record<'telegram' | 'instagram' | 'vk' | 'tiktok' | 'inapp', { name: string; why: string; steps: [string, string] }> = {
  telegram: { name: 'Telegram', why: `Внутри Telegram нельзя поставить Atelier на экран: там нет кнопки «На экран Домой». ${OPEN_IN}`, steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в Safari или Открыть в браузере'] },
  instagram: { name: 'Instagram', why: `Внутри Instagram не работают камера, вход и установка на экран. ${OPEN_IN}`, steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть во внешнем браузере'] },
  vk: { name: 'VK', why: `Внутри VK нельзя поставить Atelier на экран. ${OPEN_IN}`, steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в браузере'] },
  tiktok: { name: 'TikTok', why: `Внутри TikTok не работают камера, вход и установка на экран. ${OPEN_IN}`, steps: ['Нажми ⋯ вверху справа', 'Выбери Открыть в браузере'] },
  inapp: { name: 'приложения', why: `Во встроенном браузере приложения (Telegram, VK, Instagram и других) нельзя поставить Atelier на экран. ${OPEN_IN}`, steps: ['Нажми ⋯, значок компаса или «Поделиться» в этом окне', 'Выбери Открыть в Safari, Chrome или другом браузере'] },
}
