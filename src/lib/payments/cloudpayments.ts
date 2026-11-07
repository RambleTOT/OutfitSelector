import { api, getCaps, hasSession, type ServerMe } from '../api'
import { applySub, refreshMe } from '../sync'
import type { Plan } from '../../store/app'

/**
 * Оплата через виджет CloudPayments. Параметры (сумма, чек, автопродление) приходят с нашего сервера,
 * тариф включается, когда сервер получил уведомление Pay: ответу виджета в браузере не доверяем.
 */
declare global { interface Window { cp?: { CloudPayments: new () => Widget } } }
interface Widget { oncomplete?: (r: unknown) => void; start: (p: unknown) => Promise<{ type: string; status: string }> }

const SRC = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js'
let loading: Promise<void> | null = null
function loadWidget(): Promise<void> {
  if (window.cp) return Promise.resolve()
  loading ??= new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = SRC; s.async = true
    s.onload = () => res()
    s.onerror = () => { loading = null; rej(new Error('widget_load')) }
    document.head.appendChild(s)
  })
  return loading
}

export const paymentsLive = () => hasSession() && getCaps().pay

export type PayResult = 'success' | 'fail' | 'cancel'

export async function payWithCloudPayments(plan: Exclude<Plan, 'free'>): Promise<PayResult> {
  try {
    const [intent] = await Promise.all([api<Record<string, unknown>>('POST', '/api/pay/intent', { plan }), loadWidget()])
    const widget = new window.cp!.CloudPayments()
    const result = await widget.start(intent)
    if (result.status === 'success') return (await waitForPlan(plan)) ? 'success' : 'success' // деньги списаны; если вебхук задержался, тариф подтянется при следующем открытии
    if (result.status === 'cancel' || result.type === 'cancel') return 'cancel'
    return 'fail'
  } catch (e) {
    // виджет отдаёт отмену закрытием окна как reject без объекта
    if (e && typeof e === 'object' && 'status' in e && (e as { status: string }).status === 'cancel') return 'cancel'
    return 'fail'
  }
}

/** Ждём до 20 секунд, пока придёт уведомление Pay и сервер включит тариф */
async function waitForPlan(plan: string): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    const me: ServerMe | null = await refreshMe()
    if (me?.sub.effective === plan) { applySub(me); return true }
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}
