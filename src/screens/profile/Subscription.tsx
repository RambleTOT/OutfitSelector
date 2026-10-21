import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BottomSheet, Button, Icon, NavHeader, PlanBadge, StatTile } from '../../ui'
import { useApp, useLimits } from '../../store/app'
import { LIMITS, PLAN_PRICE } from '../../store/limits'
import { toast } from '../../store/ui'
import { dateLong } from '../../lib/format'

/** PRF-02 Subscription, PRF-03 CancelSubscriptionSheet. Отмена в 2 нажатия: «Отменить подписку» → «Да, отменить» */
export function Subscription() {
  const navigate = useNavigate()
  const app = useApp()
  const lim = useLimits()
  const [cancel, setCancel] = useState(false)
  if (lim.plan === 'free') return <Navigate to="/profile" replace />
  const plan = lim.plan
  const until = app.subEndsAt ?? Date.now() + 30 * 86400000
  const u = app.usage
  const l = LIMITS[plan]
  const stats = [
    { v: String(l.outfitsWeek === null ? u.outfitsMonth : u.outfitsWeek), u: l.outfitsWeek === null ? 'в мес' : `из ${l.outfitsWeek}`, l: l.outfitsWeek === null ? 'образов собрано' : 'образов на неделе' },
    { v: String(l.photosMonth === null ? u.photosTotal : u.photosMonth), u: l.photosMonth === null ? 'всего' : `из ${l.photosMonth}`, l: l.photosMonth === null ? 'фото' : 'фото в месяце' },
    { v: String(app.saved.length), u: l.favorites === null ? '' : `из ${l.favorites}`, l: 'в избранном' },
  ]
  const rows = app.subCancelled
    ? [{ label: 'Действует до', value: dateLong(until) }, { label: 'Автоплатёж', value: 'отключён' }]
    : [{ label: 'Следующее списание', value: dateLong(until) }, { label: 'Карта', value: 'Мир •• 4821' }, { label: 'Чеки', value: app.email ? `на ${app.email}` : 'в Telegram' }]

  const notes = [
    { icon: 'check', color: 'var(--success)', text: 'Все вещи и образы останутся' },
    { icon: 'check', color: 'var(--success)', text: 'Конструктор и шаблоны без лимита' },
    { icon: 'minus', color: 'var(--ink-tertiary)', text: 'Потом 5 образов в неделю и 3 места в избранном' },
  ]
  const d = new Date(until)

  return (
    <div className="screen screen--push" style={{ gap: 16, paddingBottom: 40 }}>
      <NavHeader title="Подписка" onBack={() => navigate(-1)} />
      <div className="card" style={{ borderRadius: 'var(--radius-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PlanBadge plan={plan} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ font: '900 var(--type-display-size)/52px var(--font-ui)', letterSpacing: '-0.02em' }}>{PLAN_PRICE[plan]} ₽</span>
          <span className="t-headline muted" style={{ fontWeight: 600 }}>в месяц</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r) => (
            <div key={r.label} style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--line)' }}>
              <span className="t-callout muted">{r.label}</span>
              <span className="t-callout" style={{ fontWeight: 700, textAlign: 'right' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {stats.map((s) => <StatTile key={s.l} value={s.v} unit={s.u} label={s.l} size="sm" />)}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16 }}>
        <Button variant="secondary" full onClick={() => navigate('/paywall')}>Сменить тариф</Button>
        {app.subCancelled
          ? <Button variant="text" full onClick={() => { app.patch({ subCancelled: false }); toast('Подписка продолжится') }}>Возобновить подписку</Button>
          : <button type="button" className="btn btn--text" style={{ color: 'var(--error-text)', height: 44 }} onClick={() => setCancel(true)}>Отменить подписку</button>}
      </div>

      <BottomSheet open={cancel} onClose={() => setCancel(false)} title="Отменить подписку?">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
          <span style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 16, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', font: '800 20px/1 var(--font-ui)' }}>
            {d.getDate()}<span style={{ font: '800 10px/12px var(--font-ui)', textTransform: 'uppercase' }}>{d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</span>
          </span>
          <span className="t-callout" style={{ textWrap: 'pretty' }}>Подписка работает до {dateLong(until)}. Больше списаний не будет</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((n) => (
            <span key={n.text} className="t-callout" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
              <Icon name={n.icon} size={20} color={n.color} />{n.text}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="secondary" full onClick={() => setCancel(false)}>Оставить подписку</Button>
          <button type="button" className="btn btn--text" style={{ color: 'var(--error-text)', height: 44 }} onClick={() => { app.patch({ subCancelled: true }); setCancel(false); toast(`Подписка действует до ${dateLong(until)}`, 'neutral'); navigate('/profile', { replace: true }) }}>Да, отменить</button>
        </div>
      </BottomSheet>
    </div>
  )
}
