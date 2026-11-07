import type { NavigateFunction } from 'react-router-dom'
import { useApp, type Plan } from '../../store/app'
import { toast } from '../../store/ui'

/**
 * Имитация оплаты через ЮKassa: «возврат» сразу ведёт на PAY-02 с включённым тарифом
 * или на PAY-03, если в панели демо включена «Ошибка оплаты» (деньги не списаны, тариф не меняется)
 */
export function payNow(plan: Plan, navigate: NavigateFunction, from?: string) {
  const app = useApp.getState()
  if (app.via === 'guest') {
    // платёж привязан к аккаунту: гость сначала входит по почте, потом возвращается к оплате
    toast('Сначала войди по почте', 'neutral', { icon: 'envelope-simple' })
    navigate('/login', { state: { next: from ?? '/paywall' } })
    return
  }
  if (app.payFail) {
    app.patch({ payFail: false })
    navigate('/paywall/error', { replace: true, state: { from, plan } })
    return
  }
  app.activatePlan(plan)
  navigate('/paywall/success', { replace: true, state: { from } })
}
