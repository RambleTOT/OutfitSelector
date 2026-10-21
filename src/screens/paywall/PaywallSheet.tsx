import { useEffect, useState } from 'react'
import { BottomSheet, Button, Checkbox, PlanBadge } from '../../ui'
import { LIMITS, PLAN_PRICE } from '../../store/limits'
import { effectivePlan, useApp, type Plan } from '../../store/app'

const SHORT: Record<Plan, string> = {
  free: '5 образов в неделю',
  sub: '10 образов в неделю, 30 фото',
  plus: 'Всё без лимитов',
}

/** Шторка пейвола (PAY-01 inline): три тарифа, галочка автоплатежа, оплата имитируется */
export function PaywallSheet({
  open, onClose, title, subtitle, onPaid,
}: { open: boolean; onClose: () => void; title: string; subtitle?: string; onPaid?: (plan: Plan) => void }) {
  const current = useApp((s) => effectivePlan(s))
  const activatePlan = useApp((s) => s.activatePlan)
  const suggested: Plan = current === 'free' ? 'sub' : 'plus'
  const [plan, setPlan] = useState<Plan>(suggested)
  const [agree, setAgree] = useState(false)
  useEffect(() => { if (open) { setPlan(suggested); setAgree(false) } }, [open, suggested])
  const isCurrent = plan === current
  const pay = () => {
    activatePlan(plan)
    onPaid?.(plan)
    onClose()
  }
  return (
    <BottomSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['free', 'sub', 'plus'] as Plan[]).map((p) => (
          <button key={p} type="button" className="plan-row" aria-pressed={plan === p} onClick={() => setPlan(p)}>
            <span className="plan-row__body">
              <PlanBadge plan={p} />
              <span className="t-caption plan-row__short">{SHORT[p]}</span>
            </span>
            <span className="t-headline plan-row__price" style={{ fontWeight: 800 }}>{p === 'free' ? '0 ₽' : `${PLAN_PRICE[p]} ₽/мес`}</span>
          </button>
        ))}
      </div>
      {plan !== 'free' && !isCurrent && (
        <Checkbox checked={agree} onChange={setAgree}>Согласен на автоматическое продление подписки, списание {PLAN_PRICE[plan]} ₽ каждый месяц</Checkbox>
      )}
      <div className="pay-foot">
        <Button full disabled={isCurrent || plan === 'free' || !agree} onClick={pay}>
          {isCurrent || plan === 'free' ? 'Это твой тариф' : `Оформить за ${PLAN_PRICE[plan]} ₽`}
        </Button>
        <span className="t-caption muted">Отменить можно в любой момент в профиле</span>
      </div>
    </BottomSheet>
  )
}

export const weeklyLimitOf = (plan: Plan) => LIMITS[plan].outfitsWeek
