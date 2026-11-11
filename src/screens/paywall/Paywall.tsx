import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, CtaPlate, IconButton } from '../../ui'
import { effectivePlan, useApp, type Plan } from '../../store/app'
import { PLAN_PRICE } from '../../store/limits'
import { payNow } from './pay'

const PLANS: { id: Plan; name: string; price: string; per: string; rec?: boolean; cells: [string, string][] }[] = [
  { id: 'free', name: 'Free', price: '0 ₽', per: 'навсегда', cells: [['5', 'образов в неделю'], ['3', 'фото всего'], ['3', 'в избранном'], ['∞', 'из каталога'], ['✓', 'конструктор']] },
  { id: 'sub', name: 'Подписка', price: '299 ₽', per: 'в месяц', rec: true, cells: [['10', 'образов в неделю'], ['30', 'фото в месяц'], ['10', 'в избранном'], ['∞', 'из каталога'], ['✓', 'конструктор']] },
  { id: 'plus', name: 'Подписка+', price: '599 ₽', per: 'в месяц', cells: [['∞', 'образов'], ['∞', 'фото'], ['∞', 'в избранном'], ['∞', 'из каталога'], ['✓', 'конструктор']] },
]

/** PAY-01 Paywall: три тарифа рядом, галочка автоплатежа не стоит по умолчанию, оплата имитируется */
export function Paywall() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  const current = useApp((s) => effectivePlan(s))
  const [plan, setPlan] = useState<Plan>(current === 'free' ? 'sub' : current === 'sub' ? 'plus' : 'plus')
  const [agree, setAgree] = useState(false)
  const isCurrent = plan === current

  return (
    <>
      <div className="pay-glow" />
      <div className="flow" style={{ padding: '52px 16px 200px', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" onClick={() => navigate(-1)} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 4px' }}>
          <h2 className="t-serif" style={{ fontSize: 40, lineHeight: '44px', textWrap: 'pretty' }}>Больше образов каждую неделю</h2>
          <span className="t-callout muted" style={{ fontWeight: 400 }}>Все вещи и образы остаются на любом тарифе</span>
        </div>
        <div className="plans3">
          {PLANS.map((p) => (
            <button key={p.id} type="button" className="pcol" aria-pressed={plan === p.id} onClick={() => setPlan(p.id)}>
              {p.rec && <span className="pcol__rec t-micro">Советуем</span>}
              <span className="t-caption" style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ font: '900 24px/28px var(--font-ui)', whiteSpace: 'nowrap' }}>{p.price}</span>
              <span className="t-micro" style={{ color: 'var(--ink-secondary)', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>{p.per}</span>
              <span className="pcol__sep" />
              {p.cells.map(([v, l]) => <span key={l} className="pcol__cell"><b>{v}</b><span>{l}</span></span>)}
            </button>
          ))}
        </div>
      </div>
      <CtaPlate>
        <Checkbox checked={agree} onChange={setAgree}>
          {plan === 'free' ? 'Согласен на автоплатёж. Отменить можно в профиле' : `Согласен на автоплатёж ${PLAN_PRICE[plan]} ₽ раз в месяц. Отменить можно в профиле в 2 нажатия`}
        </Checkbox>
        <Button full className="pay-btn" disabled={!agree || plan === 'free' || isCurrent} onClick={() => payNow(plan, navigate, state?.from)}>
          {plan === 'free' || isCurrent ? 'Это твой тариф' : `Оплатить ${PLAN_PRICE[plan]} ₽`}
        </Button>
      </CtaPlate>
    </>
  )
}
