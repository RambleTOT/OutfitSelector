import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function StatTile({ value, unit, label, icon, tone = 'elevated', size = 'md' }: {
  value: ReactNode; unit?: string; label: string; icon?: string; tone?: 'elevated' | 'soft' | 'sunken' | 'plain'; size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className={`stat ${tone !== 'elevated' ? `stat--${tone}` : ''} stat--${size}`}>
      <span className="stat__num">{value}{unit && <span className="stat__unit">{unit}</span>}</span>
      <span className="t-caption stat__label">
        {icon && <Icon name={icon} fill size={15} color="var(--accent)" />}
        <span>{label}</span>
      </span>
    </div>
  )
}

export function TickBars({ value, max, count = max, variant = 'rising', height = 10 }: {
  value: number; max: number; count?: number; variant?: 'rising' | 'lines'; height?: number
}) {
  const active = Math.round((value / max) * count)
  return (
    <div className={`ticks ${variant === 'lines' ? 'ticks--lines' : ''}`}>
      <div className="ticks__row" role="img" aria-label={`${value} из ${max}`} style={{ height }}>
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i} className="tick" data-on={i < active}
            style={{ height: variant === 'rising' ? `${30 + (70 * i) / Math.max(1, count - 1)}%` : '100%', animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange, glass = true }: {
  options: { value: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void; glass?: boolean
}) {
  return (
    <div className={`seg ${glass ? 'glass' : 'seg--flat'}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" className="seg__btn" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} fill={o.value === value} size={20} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function PageDots({ count, active }: { count: number; active: number }) {
  return <div className="dots" aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} className="dot" data-on={i === active} />)}</div>
}
