import { createHmac, timingSafeEqual } from 'node:crypto'
import { config } from './config.mjs'
import { effectivePlan } from './plans.mjs'

/**
 * CloudPayments. Схема:
 * 1. Клиент просит POST /api/pay/intent {plan} -> сервер отдаёт параметры виджета (сумма и чек считаются здесь, не на клиенте)
 * 2. Виджет открывается в приложении, человек платит картой
 * 3. CloudPayments шлёт уведомления Check -> Pay (и Recurrent, Fail, Refund, Cancel) на наш адрес. Тариф включается по Pay, а не по ответу виджета
 */

const TITLE = { sub: 'Подписка Atelier', plus: 'Подписка+ Atelier' }
const MONTH = 30 * 86400000

export const payEnabled = () => !!(config.pay.publicId && config.pay.apiSecret)

export function buildIntent(user, plan) {
  const price = config.pay.prices[plan]
  if (!price) throw new Error('unknown_plan')
  const externalId = `at-${user.id.slice(0, 8)}-${Date.now().toString(36)}`
  const receipt = {
    items: [{ label: TITLE[plan] + ', 1 месяц', price, quantity: 1, amount: price, vat: config.pay.vat, method: 4, object: 4 }],
    taxationSystem: config.pay.taxation,
    email: user.email,
    amounts: { electronic: price },
  }
  return {
    publicTerminalId: config.pay.publicId,
    paymentSchema: 'Single',
    description: `${TITLE[plan]}, 1 месяц`,
    amount: price,
    currency: 'RUB',
    culture: 'ru-RU',
    externalId,
    receiptEmail: user.email,
    userInfo: { accountId: user.id, email: user.email },
    metadata: { plan, userId: user.id },
    receipt,
    // автопродление раз в месяц; первый платёж списывается сразу, дальше CloudPayments списывает сам и присылает Recurrent
    recurrent: { interval: 'Month', period: 1, amount: price, receipt },
    skin: 'modern',
    emailBehavior: 'Hidden',
  }
}

/** Подпись уведомления: base64(HMAC-SHA256(сырое тело, API Secret)) в заголовке Content-HMAC (и X-Content-HMAC в варианте с urlencode) */
export function verifySignature(rawBody, headers) {
  if (!config.pay.apiSecret) return false
  const good = createHmac('sha256', config.pay.apiSecret).update(rawBody).digest('base64')
  const got = headers['content-hmac'] ?? headers['x-content-hmac']
  if (!got) return false
  const candidates = [got]
  try { candidates.push(decodeURIComponent(got)) } catch { /* не urlencode */ }
  return candidates.some((c) => c.length === good.length && timingSafeEqual(Buffer.from(c), Buffer.from(good)))
}

/** Тело уведомления: JSON или form-urlencoded (зависит от настройки терминала) */
export function parseBody(raw, contentType = '') {
  if (contentType.includes('json')) return JSON.parse(raw)
  const o = {}
  for (const [k, v] of new URLSearchParams(raw)) o[k] = v
  return o
}

function meta(n) {
  const raw = n.Data ?? n.Metadata ?? n.data ?? n.metadata
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

/**
 * Обработчики уведомлений возвращают {code:0} — «всё хорошо». Любой другой код CloudPayments считает отказом:
 * для Check это отмена платежа, для Pay — повтор уведомления.
 */
export function handleNotification(store, kind, n, now = Date.now()) {
  const m = meta(n)
  const userId = n.AccountId ?? m.userId
  const user = userId ? store.user(userId) : null
  const amount = Number(n.Amount ?? 0)

  if (kind === 'check') {
    const plan = m.plan
    if (!user) return { code: 10 } // неверный AccountId
    if (!config.pay.prices[plan]) return { code: 12 } // платёж не может быть принят
    if (amount !== config.pay.prices[plan]) return { code: 11 } // неверная сумма
    return { code: 0 }
  }

  const txId = String(n.TransactionId ?? n.Id ?? '')
  if (kind === 'pay') {
    if (!user) return { code: 0 } // платёж прошёл, а аккаунта нет (удалён): отвечаем 0, чтобы не было повторов, возврат делает человек вручную
    if (store.db.payments[txId]) return { code: 0 } // повтор того же уведомления
    const plan = m.plan
    if (!config.pay.prices[plan]) return { code: 0 }
    store.db.payments[txId] = { userId: user.id, plan, amount, at: now, status: 'paid' }
    const base = user.sub.endsAt && user.sub.endsAt > now && user.sub.plan === plan ? user.sub.endsAt : now // продление добавляет месяц к остатку
    user.sub = { plan, status: 'active', subscriptionId: n.SubscriptionId ?? user.sub.subscriptionId, endsAt: base + MONTH, cancelled: false }
    store.save()
    return { code: 0 }
  }

  if (kind === 'recurrent') {
    // статус подписки: Active, PastDue (не удалось списать), Cancelled, Rejected, Expired
    const target = [...Object.values(store.db.users)].find((u) => u.sub.subscriptionId === (n.Id ?? n.SubscriptionId)) ?? user
    if (!target) return { code: 0 }
    const st = String(n.Status ?? '')
    if (st === 'Cancelled' || st === 'Rejected' || st === 'Expired') target.sub.cancelled = true
    target.sub.status = st.toLowerCase()
    store.save()
    return { code: 0 }
  }

  if (kind === 'refund') {
    const p = store.db.payments[String(n.TransactionId ?? '')]
    if (p) {
      p.status = 'refunded'
      const u = store.user(p.userId)
      if (u) { u.sub = { ...u.sub, plan: 'free', status: 'refunded', endsAt: now, cancelled: true } }
      store.save()
    }
    return { code: 0 }
  }

  if (kind === 'cancel' || kind === 'fail') return { code: 0 } // фиксируем только то, что тариф не включился
  return { code: 0 }
}

/** Отмена автопродления в CloudPayments. Тариф продолжает действовать до конца оплаченного периода */
export async function cancelSubscription(store, user, fetchImpl = fetch) {
  const id = user.sub.subscriptionId
  if (id) {
    const r = await fetchImpl('https://api.cloudpayments.ru/subscriptions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${config.pay.publicId}:${config.pay.apiSecret}`).toString('base64') },
      body: JSON.stringify({ Id: id }),
    })
    const j = await r.json().catch(() => ({}))
    if (!j.Success) throw new Error('cp_cancel_failed: ' + (j.Message ?? r.status))
  }
  user.sub.cancelled = true
  store.save()
}

export const publicSub = (user, now = Date.now()) => ({
  plan: user.sub.plan,
  effective: effectivePlan(user.sub, now),
  endsAt: user.sub.endsAt,
  cancelled: user.sub.cancelled,
  ended: user.sub.plan !== 'free' && !!user.sub.endsAt && user.sub.endsAt < now,
})
