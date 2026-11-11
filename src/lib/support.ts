import { SUPPORT_EMAIL, SUPPORT_TG } from './config'
import { toast } from '../store/ui'
import { useApp } from '../store/app'

/** Куда ведёт кнопка «Поддержка»: чат в Telegram, а если его нет, письмо. Контакты задаются в .env (VITE_SUPPORT_TG, VITE_SUPPORT_EMAIL) */
export const supportAvailable = () => !!(SUPPORT_TG || SUPPORT_EMAIL)
export const supportLabel = () => (SUPPORT_TG ? 'Поддержка в Telegram' : 'Написать в поддержку')

export function openSupport(topic = 'Вопрос по Atelier') {
  if (SUPPORT_TG) {
    window.open(`https://t.me/${SUPPORT_TG}`, '_blank', 'noopener')
    return
  }
  if (SUPPORT_EMAIL) {
    const email = useApp.getState().email
    const body = email ? `\n\n—\nМоя почта в Atelier: ${email}` : ''
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(body)}`
    return
  }
  toast('Чат поддержки скоро откроется', 'neutral')
}
