import type { NavigateFunction } from 'react-router-dom'
import { useApp, type Plan } from '../../store/app'
import { toast } from '../../store/ui'
import { paymentsLive, payWithCloudPayments } from '../../lib/payments/cloudpayments'
import { track } from '../../lib/analytics'
import { HAS_API } from '../../lib/config'

/**
 * Оплата. Если на сервере включён CloudPayments и человек вошёл, открывается настоящий виджет.
 * Иначе демо: «возврат» сразу ведёт на PAY-02 с включённым тарифом или на PAY-03, если в панели демо включена «Ошибка оплаты».
 */
export async function payNow(plan: Plan, navigate: NavigateFunction, from?: string) {
  const app = useApp.getState()
  if (plan !== 'free' && paymentsLive()) {
    track('pay_start', { plan })
    const r = await payWithCloudPayments(plan)
    if (r === 'cancel') return
    track(r === 'success' ? 'pay_success' : 'pay_fail', { plan })
    navigate(r === 'success' ? '/paywall/success' : '/paywall/error', { replace: true, state: { from, plan } })
    return
  }
  if (HAS_API) {
    // боевой режим без подключённой оплаты: демо-включение тарифа здесь недопустимо, иначе платный тариф получают бесплатно
    toast('Оплата скоро появится', 'neutral', { icon: 'bell' })
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
