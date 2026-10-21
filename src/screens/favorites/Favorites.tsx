import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState, Icon, MiniCollage, PlanBadge } from '../../ui'
import { useApp, useLimits } from '../../store/app'
import { resolveSaved } from '../../lib/outfit'
import { occasionById, plural, shortDate } from '../../lib/format'
import type { SavedOutfit } from '../../data/types'
import { PaywallSheet } from '../paywall/PaywallSheet'

/** FAV-01 Favourites (+ FAV-03 пусто, FAV-05 сверх лимита после окончания подписки) */
export function Favorites() {
  const navigate = useNavigate()
  const saved = useApp((s) => s.saved)
  const lim = useLimits()
  const [pay, setPay] = useState(false)

  const over = lim.favLimit !== null && saved.length > lim.favLimit
  const full = lim.favLimit !== null && saved.length >= lim.favLimit
  const counter = lim.favLimit === null ? `${saved.length}` : `${saved.length} из ${lim.favLimit}`
  const upsell = lim.plan === 'free' ? 'До 10 образов с подпиской' : 'Без лимита с Подпиской+'

  const header = (
    <div className="nav-row">
      <h2 className="t-title1" style={{ fontSize: '2rem', lineHeight: '2.25rem' }}>Избранное</h2>
      {over
        ? <span className="photo-pill" style={{ background: 'var(--warning-soft)', boxShadow: 'none' }}>{counter}</span>
        : <span className="t-callout" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, whiteSpace: 'nowrap' }}>{counter}<span className="hide-narrow"><PlanBadge plan={lim.plan} /></span></span>}
    </div>
  )

  if (saved.length === 0) {
    return (
      <div className="screen screen--fade" style={{ gap: 16 }}>
        {header}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <EmptyState icon="heart" title="Пока ничего не сохранено" text="Собери образ и нажми Сохранить, он появится здесь" actionLabel="Собрать образ" onAction={() => navigate('/outfit')} />
        </div>
      </div>
    )
  }

  const extra = saved.length - (lim.favLimit ?? 0)
  return (
    <div className="screen screen--fade" style={{ gap: 20 }}>
      {header}
      {over && (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="t-headline" style={{ textWrap: 'pretty' }}>Новые образы не сохранятся, пока их больше {lim.favLimit}</span>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>
            Все {saved.length} можно открывать, редактировать и удалять. Удали {extra} или продли подписку
          </span>
          <Button size="sm" full onClick={() => setPay(true)}>Продлить за 300 ₽</Button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 12px' }}>
        {saved.map((o, i) => <SavedOutfitCard key={o.id} outfit={o} coach={i === 0} onClick={() => navigate(`/favorites/${o.id}`)} />)}
        {full && !over && lim.plan !== 'plus' && (
          <button type="button" onClick={() => setPay(true)} style={{ aspectRatio: '3 / 4', borderRadius: 24, border: '2px dashed var(--line)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, textAlign: 'center', color: 'var(--ink-secondary)', cursor: 'pointer' }}>
            <Icon name="lock-simple" size={28} />
            <span className="t-caption" style={{ textWrap: 'pretty', lineHeight: '18px' }}>{upsell}</span>
          </button>
        )}
      </div>
      <span className="t-caption muted" style={{ textAlign: 'center' }}>{saved.length} {plural(saved.length, 'образ', 'образа', 'образов')} сохранено</span>
      <div style={{ height: 96 }} />
      <PaywallSheet
        open={pay} onClose={() => setPay(false)}
        title="Больше мест в избранном" subtitle="Образы останутся на месте, ничего не удаляется"
      />
    </div>
  )
}

/** SavedOutfitCard: 3:4 на подложке, мини-коллаж, название, «эмодзи · повод · дата» */
export function SavedOutfitCard({ outfit, onClick, coach }: { outfit: SavedOutfit; onClick: () => void; coach?: boolean }) {
  const items = useApp((s) => s.items)
  const res = resolveSaved(outfit, items)
  const occ = occasionById(outfit.occasion)
  const hasDeleted = res.some((r) => r.deleted)
  return (
    <button type="button" onClick={onClick} className="saved-card" aria-label={outfit.name}>
      <span className="saved-card__mat" data-coach={coach ? 'favorites' : undefined}>
        <MiniCollage items={res.map((r) => r.item)} />
        {hasDeleted && <span className="tile__badge">вещь удалена</span>}
      </span>
      <span className="saved-card__text">
        <span className="t-callout saved-card__name">{outfit.name}</span>
        <span className="t-caption muted">{occ.emoji} {occ.label} · {shortDate(outfit.createdAt)}</span>
      </span>
    </button>
  )
}
