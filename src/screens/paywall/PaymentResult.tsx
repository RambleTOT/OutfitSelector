import { useLocation, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, EmptyState, IconButton, PlanBadge } from '../../ui'
import { useLimits } from '../../store/app'
import { LIMITS } from '../../store/limits'
import { toast } from '../../store/ui'

/** PAY-02 PaymentSuccess: лимиты сняты сразу */
export function PaymentSuccess() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  const lim = useLimits()
  const plan = lim.plan
  const l = LIMITS[plan]
  const text = plan === 'plus'
    ? 'Образы, фото и избранное без лимита уже доступны'
    : `${l.outfitsWeek} образов в неделю, ${l.photosMonth} фото в месяц и ${l.favorites} мест в избранном уже доступны`
  return (
    <>
      <div style={{ position: 'absolute', left: '50%', top: 180, width: 320, height: 320, marginLeft: -160, borderRadius: '50%', background: 'var(--gradient-sunset)', filter: 'blur(80px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div className="flow" style={{ padding: '56px 20px 160px', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        <PlanBadge plan={plan} />
        <h2 className="t-serif" style={{ fontSize: 40, lineHeight: '44px' }}>{plan === 'plus' ? 'Подписка+ включена' : 'Подписка включена'}</h2>
        <span className="t-body muted" style={{ textWrap: 'pretty' }}>{text}</span>
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
        <Button variant="text" full icon="chat-circle" onClick={() => toast('Откроется чат поддержки в Telegram', 'neutral')}>Написать в поддержку</Button>
      </CtaPlate>
    </>
  )
}
