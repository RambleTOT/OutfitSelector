import { useEffect, useState } from 'react'
import { openSupport } from '../../lib/support'
import { refreshMe } from '../../lib/sync'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, EmptyState, Icon, IconButton, PlanBadge } from '../../ui'
import { useApp, useLimits } from '../../store/app'
import { LIMITS } from '../../store/limits'

/** Что открылось на тарифе: строки списка на экране «Подписка включена» */
function unlocked(plan: 'sub' | 'plus'): string[] {
  const l = LIMITS[plan]
  return plan === 'plus'
    ? ['Образы без лимита', `${LIMITS.plus.photosMonth} фото вещей в месяц`, 'Избранное без лимита', 'Каталог и конструктор без лимита']
    : [`${l.outfitsWeek} образов в неделю`, `${l.photosMonth} фото вещей в месяц`, `${l.favorites} мест в избранном`, 'Каталог и конструктор без лимита']
}
const CONFETTI = ['var(--accent)', 'var(--success)', 'var(--ink-primary)', 'var(--accent-text)']

/** PAY-02 PaymentSuccess: пока сервер подтверждает оплату, спокойное ожидание; потом праздник: галочка, конфетти, срок и что открылось */
export function PaymentSuccess() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  const lim = useLimits()
  const endsAt = useApp((s) => s.subEndsAt)
  const plan = lim.plan
  const active = plan !== 'free'
  const [tries, setTries] = useState(0)

  // пришли по ссылке из страницы оплаты: подтягиваем тариф с сервера, пока не включится (уведомление об оплате могло прийти только что)
  useEffect(() => {
    if (active) return
    void refreshMe()
    const t = setInterval(() => { void refreshMe(); setTries((n) => n + 1) }, 2000)
    return () => clearInterval(t)
  }, [active])
  useEffect(() => { if (active) { try { navigator.vibrate?.([18, 40, 28]) } catch { /* нет вибрации */ } } }, [active])

  if (!active) {
    const long = tries >= 15
    return (
      <>
        <div className="flow" style={{ padding: '56px 20px 160px', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <span className="pay-wait" aria-hidden />
          <h2 className="t-title1">{long ? 'Оплата получена' : 'Подтверждаем оплату'}</h2>
          <span className="t-body muted" style={{ maxWidth: 300, textWrap: 'pretty' }}>
            {long ? 'Подписка включится в течение минуты. Если этого не случилось, напиши нам, разберёмся' : 'Это занимает несколько секунд'}
          </span>
        </div>
        {long && (
          <CtaPlate>
            <Button full icon="arrows-clockwise" onClick={() => { setTries(0); void refreshMe() }}>Проверить ещё раз</Button>
            <Button variant="text" full icon="chat-circle" onClick={() => openSupport('Оплатил, подписка не включилась')}>Написать в поддержку</Button>
          </CtaPlate>
        )}
      </>
    )
  }

  const rows = unlocked(plan as 'sub' | 'plus')
  const until = endsAt ? new Date(endsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : null
  return (
    <>
      <div className="pay-glow" aria-hidden />
      <div className="flow" style={{ padding: '72px 20px 160px', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div className="pay-badge" aria-hidden>
          {CONFETTI.flatMap((c, a) => [0, 1, 2, 3].map((k) => {
            const n = a * 4 + k
            const ang = (n / 16) * 360 + (k % 2) * 11
            return <i key={n} className="pay-dot" style={{ ['--a' as string]: `${ang}deg`, ['--d' as string]: `${86 + (n % 3) * 22}px`, ['--c' as string]: c, animationDelay: `${0.35 + (n % 4) * 0.05}s` }} />
          }))}
          <span className="pay-ring" />
          <svg viewBox="0 0 52 52" width="56" height="56" className="pay-check"><path d="M14 27.5l8.5 8.5L38.5 18" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="pay-rise" style={{ animationDelay: '0.45s' }}><PlanBadge plan={plan} /></div>
        <h2 className="t-serif pay-rise" style={{ fontSize: 40, lineHeight: '44px', animationDelay: '0.55s' }}>{plan === 'plus' ? 'Подписка+ включена' : 'Подписка включена'}</h2>
        {until && <span className="t-body muted pay-rise" style={{ animationDelay: '0.65s' }}>Действует до {until}</span>}
        <div className="pay-list pay-rise" style={{ animationDelay: '0.75s' }}>
          {rows.map((r, i) => (
            <div key={r} className="pay-row" style={{ animationDelay: `${0.85 + i * 0.1}s` }}>
              <Icon name="check-circle" fill size={22} color="var(--success)" />
              <span className="t-callout">{r}</span>
            </div>
          ))}
        </div>
      </div>
      <CtaPlate>
        <Button full icon="sparkle" onClick={() => navigate('/outfit', { replace: true })}>Собрать образ</Button>
        {state?.from && state.from !== '/outfit' && <Button variant="text" full onClick={() => navigate(state.from!, { replace: true })}>Вернуться</Button>}
      </CtaPlate>
    </>
  )
}

/** PAY-03 PaymentError: деньги не списаны */
export function PaymentError() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 200px', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={() => navigate(state?.from ?? '/profile', { replace: true })} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <EmptyState icon="credit-card" title="Не получилось оплатить" text="Деньги не списаны. Проверь карту или выбери другую" />
        </div>
      </div>
      <CtaPlate>
        <Button full icon="arrows-clockwise" onClick={() => navigate('/paywall', { replace: true, state: { from: state?.from } })}>Попробовать ещё</Button>
        <Button variant="text" full icon="chat-circle" onClick={() => openSupport('Проблема с оплатой')}>Написать в поддержку</Button>
      </CtaPlate>
    </>
  )
}
