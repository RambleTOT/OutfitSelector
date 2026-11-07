import { isNative } from './config'

/** Установка на экран: перехватываем событие Chrome/Edge/Samsung/Yandex, чтобы показать свою кнопку «Установить» */
interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: BIPEvent | null = null
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; installedEvent = true; emit() })
}
let installedEvent = false

export const canPromptInstall = () => deferred !== null
export const wasInstalled = () => installedEvent
export function subscribePwa(f: () => void) { subs.add(f); return () => { subs.delete(f) } }

/** Показывает системное окно установки. true, если человек согласился */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const d = deferred
  deferred = null
  try {
    await d.prompt()
    const r = await d.userChoice
    emit()
    return r.outcome === 'accepted'
  } catch {
    emit()
    return false
  }
}

export const isStandaloneMode = () =>
  isNative() || window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
