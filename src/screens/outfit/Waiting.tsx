import { useEffect, useMemo, useState } from 'react'
import { IconButton, OutfitCard } from '../../ui'
import { useApp } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import { occasionById, temp } from '../../lib/format'
import type { Category, Item } from '../../data/types'

const SLOTS: Category[] = ['outer', 'top', 'bottom', 'shoes', 'accessory', 'bag']
const WAIT = ['Смотрю погоду', 'Перебираю твои вещи', 'Подбираю сочетание']

/** OUT-02 OutfitGenerating: вещи перемешиваются каждые 600 мс, тексты шагов сменяются */
export function Waiting({ withTabBar = true }: { withTabBar?: boolean }) {
  const items = useApp((s) => s.items)
  const { occasion, wish, cancel } = useOutfitFlow()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 600)
    return () => clearInterval(t)
  }, [])

  const { shuffle, ghosts } = useMemo(() => {
    const picked: Item[] = []
    const missing: Category[] = []
    for (const c of SLOTS) {
      const pool = items.filter((i) => i.available && i.category === c)
      if (pool.length) picked.push(pool[Math.floor(Math.random() * pool.length)])
      else missing.push(c)
    }
    return { shuffle: picked, ghosts: missing }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, items])

  const occ = occasionById(occasion)
  const wishText = wish.trim() ? ` · ${wish.trim().charAt(0).toLowerCase()}${wish.trim().slice(1)}` : ''
  return (
    <div className="screen screen--fade" style={{ gap: 24, paddingBottom: withTabBar ? 124 : 40 }}>
      <div className="nav-row">
        <IconButton icon="x" label="Отменить" variant="solid" onClick={cancel} />
        <span className="t-caption muted" style={{ textAlign: 'right' }}>Лимит спишем, только если получится</span>
      </div>
      <div className="screen-title">
        <h2 className="t-title1" style={{ fontSize: '2rem', lineHeight: '2.25rem' }}>Собираю образ</h2>
        <span className="t-callout muted">{occ.emoji} {occ.label} · {temp()}{wishText}</span>
      </div>
      <OutfitCard items={shuffle} loading ghostSlots={ghosts} aspect="1 / 1.05" />
      <p className="t-body muted" style={{ textAlign: 'center' }} aria-live="polite">{WAIT[tick % WAIT.length]}</p>
    </div>
  )
}
