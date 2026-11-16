import { createHash, timingSafeEqual } from 'node:crypto'
import { config } from './config.mjs'

/**
 * Robokassa. Схема:
 * 1. Клиент просит POST /api/pay/intent {plan} -> сервер заводит заказ (InvId), считает подпись и отдаёт ссылку на страницу оплаты Robokassa
 * 2. Человек платит на странице Robokassa (в новой вкладке или окне), приложение тем временем ждёт включения тарифа
 * 3. Robokassa шлёт на Result URL (POST /api/pay/robokassa/result) OutSum, InvId и подпись; сервер проверяет подпись (Пароль #2), сумму и заказ,
 *    включает тариф на 30 дней и отвечает «OK<InvId>». Ответу в браузере (Success URL) не доверяем
 * Автопродления здесь нет: оплата разовая на месяц, по окончании тариф возвращается к Free (ничего не удаляется), человек платит снова.
 */
const MONTH = 30 * 86400000
const TITLE = { sub: 'Подписка Atelier', plus: 'Подписка+ Atelier' }
const rk = () => config.robokassa

export const robokassaEnabled = () => !!(rk().login && passFor(1) && passFor(2))
const passFor = (n) => (rk().test ? rk()[`testPass${n}`] : rk()[`pass${n}`])
const hash = (s) => createHash(rk().algo).update(s, 'utf8').digest('hex')
const sum = (n) => Number(n).toFixed(2)

function same(a, b) {
  const x = Buffer.from(String(a).toLowerCase())
  const y = Buffer.from(String(b).toLowerCase())
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Заказ и ссылка на оплату. Сумму считает сервер, клиент её не присылает */
export function buildRobokassaUrl(store, user, plan, now = Date.now()) {
  const price = config.pay.prices[plan]
  if (!price) throw new Error('unknown_plan')
  store.db.rkPending ??= {}
  for (const [k, v] of Object.entries(store.db.rkPending)) if (now - v.at > 7 * 86400000) delete store.db.rkPending[k]
  store.db.rkSeq = (store.db.rkSeq ?? 1000) + 1
  const invId = store.db.rkSeq
  store.db.rkPending[invId] = { userId: user.id, plan, amount: price, at: now }
  store.save()
  const outSum = sum(price)
  const signature = hash(`${rk().login}:${outSum}:${invId}:${passFor(1)}`)
  const q = new URLSearchParams({
    MerchantLogin: rk().login, OutSum: outSum, InvId: String(invId), Description: `${TITLE[plan]}, 1 месяц`,
    SignatureValue: signature, Email: user.email, Culture: 'ru',
  })
  if (rk().test) q.set('IsTest', '1')
  return `https://auth.robokassa.ru/Merchant/Index.aspx?${q}`
}

/** Уведомление об оплате. Возвращает текст ответа Robokassa («OK123») или бросает ошибку с кодом */
export function handleRobokassaResult(store, p, now = Date.now()) {
  const outSum = String(p.OutSum ?? '')
  const invId = String(p.InvId ?? '')
  const got = String(p.SignatureValue ?? '')
  if (!outSum || !invId || !got) throw Object.assign(new Error('bad_params'), { status: 400 })
  // дополнительные параметры Shp_ входят в подпись в алфавитном порядке; мы их не отправляем, но если придут, считаем честно
  const shp = Object.keys(p).filter((k) => k.toLowerCase().startsWith('shp_')).sort().map((k) => `${k}=${p[k]}`)
  const good = hash([outSum, invId, passFor(2), ...shp].join(':'))
  if (!same(got, good)) throw Object.assign(new Error('bad_signature'), { status: 400 })

  store.db.payments ??= {}
  const txId = `rk${invId}`
  if (store.db.payments[txId]) return `OK${invId}` // повтор того же уведомления
  const order = store.db.rkPending?.[invId]
  if (!order) throw Object.assign(new Error('no_order'), { status: 400 })
  if (Number(outSum) !== order.amount) throw Object.assign(new Error('bad_amount'), { status: 400 })
  const user = store.user(order.userId)
  store.db.payments[txId] = { userId: order.userId, plan: order.plan, amount: order.amount, at: now, status: 'paid', provider: 'robokassa', test: rk().test }
  delete store.db.rkPending[invId]
  if (user) {
    const base = user.sub.endsAt && user.sub.endsAt > now && user.sub.plan === order.plan ? user.sub.endsAt : now // продление добавляет месяц к остатку
    user.sub = { plan: order.plan, status: 'active', subscriptionId: undefined, endsAt: base + MONTH, cancelled: true } // cancelled: автопродления нет
  }
  store.save()
  return `OK${invId}`
}

/** Страница после оплаты: показывается в браузере, где человек платил; в приложение возвращает ссылка */
export function returnPage(ok) {
  const site = config.siteUrl || ''
  const to = `${site}/app/#/paywall/${ok ? 'success' : 'error'}`
  const title = ok ? 'Оплата прошла' : 'Оплата не прошла'
  const text = ok ? 'Спасибо! Подписка включится в приложении через несколько секунд.' : 'Деньги не списаны. Можно попробовать ещё раз или написать в поддержку в приложении.'
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;text-align:center;font:17px/24px system-ui,-apple-system,sans-serif;background:#F4F4F6;color:#111114}main{max-width:340px;padding:24px;display:flex;flex-direction:column;gap:14px;align-items:center}h1{margin:0;font:800 26px/32px system-ui,sans-serif}p{margin:0;color:#6B6B74}a{display:inline-block;margin-top:6px;padding:16px 28px;border-radius:999px;background:linear-gradient(135deg,#C9443D,#9E4F6B);color:#fff;font-weight:700;text-decoration:none}@media (prefers-color-scheme:dark){body{background:#0F0F11;color:#F5F2EE}p{color:#A8A29C}}</style></head>
<body><main><h1>${title}</h1><p>${text}</p><a href="${to}">Вернуться в Atelier</a></main></body></html>`
}
