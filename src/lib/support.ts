import { api } from './api'
import { HAS_API } from './config'
import { hasSession } from './api'

/** Поддержка живёт внутри приложения: экран «Поддержка», переписка хранится на сервере, ответ видно там же. Почта не нужна */
export interface SupportMessage { id: string; from: 'user' | 'team'; text: string; at: number }
export interface SupportThread { messages: SupportMessage[]; unread: number }

export const supportLabel = () => 'Поддержка'

/** Открывает экран поддержки. topic подставляется в первое сообщение: «Проблема с оплатой» */
export function openSupport(topic?: string) {
  window.location.hash = `#/support${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`
}

const LOCAL = 'atelier-support-demo'
const readLocal = (): SupportMessage[] => { try { return JSON.parse(localStorage.getItem(LOCAL) ?? '[]') } catch { return [] } }
const writeLocal = (m: SupportMessage[]) => { try { localStorage.setItem(LOCAL, JSON.stringify(m)) } catch { /* нет доступа */ } }

export async function loadSupport(peek = false): Promise<SupportThread> {
  if (HAS_API && hasSession()) return api<SupportThread>('GET', `/api/support${peek ? '?peek=1' : ''}`)
  return { messages: readLocal(), unread: 0 }
}

export async function sendSupport(text: string): Promise<SupportThread> {
  if (HAS_API && hasSession()) return api<SupportThread>('POST', '/api/support', { text })
  // демо без сервера: сообщение сохраняется на телефоне и приходит вежливый ответ
  const now = Date.now()
  const m: SupportMessage[] = [...readLocal(), { id: `u${now}`, from: 'user', text, at: now }, { id: `t${now}`, from: 'team', text: 'Спасибо, получили. В настоящей версии ответ придёт сюда, в этот экран', at: now + 1 }]
  writeLocal(m)
  return { messages: m, unread: 0 }
}
