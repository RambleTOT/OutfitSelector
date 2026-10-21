import { Icon } from './Icon'
import type { Plan } from '../store/app'

export function WeatherPill({ icon = 'cloud-sun', temp, city, loading, offline, onClick }: {
  icon?: string; temp: string; city: string; loading?: boolean; offline?: boolean; onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`glass glass-pill ${onClick ? 'glass-pill--btn' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <Icon name={offline ? 'wifi-slash' : icon} size={24} color="var(--accent)" />
      {loading ? <span className="wx__shimmer" /> : (
        <>
          <span className="t-headline">{temp}</span>
          <span className="t-caption muted">{offline ? 'последние данные' : city}</span>
        </>
      )}
    </Tag>
  )
}

/** LimitMeter: Осталось N из M на этой неделе + полоска из M сегментов */
export function LimitMeter({ remaining, total, label = 'на этой неделе', emptyText = 'Образы на неделю закончились', moreLabel = 'Больше образов', onMore, unlimited }: {
  remaining: number; total: number; label?: string; emptyText?: string; moreLabel?: string; onMore?: () => void; unlimited?: boolean
}) {
  if (unlimited) {
    return (
      <div className="limit">
        <div className="limit__row"><span className="t-callout limit__text">Образы без лимита <b>∞</b></span></div>
      </div>
    )
  }
  const empty = remaining <= 0
  const last = remaining === 1
  const segs = Math.min(total, 10)
  const on = total > 10 ? Math.round((remaining / total) * segs) : remaining
  return (
    <div className="limit" data-empty={empty} data-last={last}>
      <div className={`limit__row ${empty ? 'limit__row--empty' : ''}`}>
        <span className="t-callout limit__text">
          {empty ? emptyText : <>Осталось <b>{remaining} из {total}</b> {label}</>}
        </span>
        {empty && onMore && <button type="button" className="limit__more t-callout" onClick={onMore}>{moreLabel}</button>}
      </div>
      <div className="limit__segs" aria-hidden="true">
        {Array.from({ length: segs }, (_, i) => <span key={i} className="limit__seg" data-on={i < on} />)}
      </div>
    </div>
  )
}

const PLAN_LABEL: Record<Plan, string> = { free: 'Free', sub: 'Подписка', plus: 'Подписка+' }

export function PlanBadge({ plan, label }: { plan: Plan; label?: string }) {
  return <span className={`plan-badge plan-badge--${plan} t-micro`}>{label ?? PLAN_LABEL[plan]}</span>
}
