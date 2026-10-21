import { useEffect, useState } from 'react'
import { BottomSheet, Button, Icon, MiniCollage } from '../../ui'
import { useApp } from '../../store/app'
import { resolveSaved } from '../../lib/outfit'
import { occasionById, shortDate } from '../../lib/format'
import type { SavedOutfit } from '../../data/types'

/** FAV-02 FavouritesFullSheet: избранное заполнено, выбери образ, который заменить новым */
export function FavoritesFullSheet({
  open, onClose, onReplace, onBuy, buyLabel,
}: { open: boolean; onClose: () => void; onReplace: (old: SavedOutfit) => void; onBuy: () => void; buyLabel: string }) {
  const saved = useApp((s) => s.saved)
  const items = useApp((s) => s.items)
  const [pick, setPick] = useState<string | null>(null)
  useEffect(() => { if (open) setPick(null) }, [open])
  return (
    <BottomSheet open={open} onClose={onClose} title="Избранное заполнено" subtitle="Выбери, какой образ заменить новым">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {saved.map((o) => {
          const occ = occasionById(o.occasion)
          const sel = pick === o.id
          return (
            <button key={o.id} type="button" className="plan-row" aria-pressed={sel} style={{ minHeight: 76, padding: '8px 16px 8px 8px' }} onClick={() => setPick(o.id)}>
              <span style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 16, background: 'var(--item-mat)', overflow: 'hidden' }}>
                <MiniCollage items={resolveSaved(o, items).map((r) => r.item)} size={60} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="t-callout" style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
                <span className="t-caption muted">{occ.emoji} {occ.label} · {shortDate(o.createdAt)}</span>
              </span>
              <Icon name={sel ? 'check-circle' : 'circle'} fill={sel} size={24} color={sel ? 'var(--accent)' : 'var(--ink-tertiary)'} />
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button full disabled={!pick} onClick={() => { const o = saved.find((x) => x.id === pick); if (o) onReplace(o) }}>Заменить</Button>
        <Button variant="secondary" full icon="crown-simple" onClick={onBuy}>{buyLabel}</Button>
      </div>
    </BottomSheet>
  )
}
