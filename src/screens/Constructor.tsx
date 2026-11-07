import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Chip, Icon, IconButton, ItemArt, ItemTile, TopBar } from '../ui'
import type { CanvasLayoutItem, Category, Item, OccasionId } from '../data/types'
import { useApp } from '../store/app'
import { useOutfitFlow } from '../store/outfit'
import { toast } from '../store/ui'
import { snapshotOf } from '../lib/outfit'
import { occasionById } from '../lib/format'
import { useSaveOutfit } from './favorites/useSaveOutfit'
import { CanvasItem, type Dims } from './constructor/CanvasItem'
import { autoLayout, BACKGROUNDS, bgColor, BOX_ASPECT, bottomZ, clamp, topZ } from './constructor/layout'

const SHORT: Record<Category, string> = { top: 'Верх', bottom: 'Низ', shoes: 'Обувь', outer: 'Верхняя', dress: 'Платья', bag: 'Сумки', accessory: 'Аксессуары' }
const CHIP_ORDER: Category[] = ['top', 'bottom', 'shoes', 'outer', 'dress', 'bag', 'accessory']
const TOP = 112 // верх рабочей области под плавающей панелью

interface Snap { layout: CanvasLayoutItem[]; bg: string }
interface NavState { itemIds?: string[]; savedId?: string; occasion?: OccasionId; explanation?: string }

/** CON-01 Constructor / CON-02 ConstructorEmpty: холст, вещи из шторки, жесты, слои, удаление, отмена, сохранение */
export function Constructor() {
  const navigate = useNavigate()
  const st = (useLocation().state ?? {}) as NavState
  const items = useApp((s) => s.items)
  const savedAll = useApp((s) => s.saved)
  const updateSaved = useApp((s) => s.updateSaved)
  const { save: saveFav, sheets } = useSaveOutfit()

  const initial = useMemo(() => {
    const saved = st.savedId ? savedAll.find((o) => o.id === st.savedId) : undefined
    if (saved) {
      const live = saved.items.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
      return { layout: saved.layout?.filter((l) => items.some((i) => i.id === l.itemId)) ?? autoLayout(live), bg: saved.bg ?? 'theme' }
    }
    const picked = (st.itemIds ?? []).map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
    return { layout: autoLayout(picked), bg: 'theme' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [layout, setLayout] = useState<CanvasLayoutItem[]>(initial.layout)
  const [bg, setBg] = useState(initial.bg)
  const [sel, setSel] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [expanded, setExpanded] = useState(initial.layout.length === 0)
  const [savedId, setSavedId] = useState<string | null>(st.savedId ?? null)
  const [dims, setDims] = useState<Dims>({ w: 390, boxH: 390 * BOX_ASPECT, top: TOP })
  const [ghost, setGhost] = useState<{ item: Item; x: number; y: number } | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const cvRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const history = useRef<Snap[]>([])
  const gestureStart = useRef<Snap | null>(null)
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const bgRef = useRef(bg)
  bgRef.current = bg

  useEffect(() => {
    const el = cvRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setDims({ w: el.offsetWidth, boxH: el.offsetWidth * BOX_ASPECT, top: TOP }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pushHistory = (s: Snap) => { history.current.push(s); if (history.current.length > 50) history.current.shift(); setCanUndo(true) }
  const snapNow = (): Snap => ({ layout: layoutRef.current.map((l) => ({ ...l })), bg: bgRef.current })
  const undo = () => {
    const s = history.current.pop()
    if (!s) return
    setLayout(s.layout); setBg(s.bg); setSel(null)
    setCanUndo(history.current.length > 0)
  }

  const live = (id: string, patch: Partial<CanvasLayoutItem>) => setLayout((ls) => ls.map((l) => (l.itemId === id ? { ...l, ...patch } : l)))
  const onStart = () => { gestureStart.current = snapNow() }
  const onEnd = () => {
    const s = gestureStart.current
    gestureStart.current = null
    if (s && JSON.stringify(s.layout) !== JSON.stringify(layoutRef.current)) pushHistory(s)
  }

  const add = useCallback((item: Item, x?: number, y?: number) => {
    pushHistory(snapNow())
    const n = layoutRef.current.length
    setLayout((ls) => [...ls, { itemId: item.id, x: x ?? clamp(0.5 + (n % 3) * 0.06 - 0.06, 0.1, 0.9), y: y ?? clamp(0.42 + (n % 3) * 0.05, 0.1, 0.9), scale: 0.85, rotate: 0, z: topZ(ls) }])
    setSel(item.id); setFresh(item.id); setExpanded(false)
    setTimeout(() => setFresh(null), 420)
  }, [])

  const removeSel = () => {
    if (!sel) return
    pushHistory(snapNow())
    setLayout((ls) => ls.filter((l) => l.itemId !== sel)); setSel(null)
  }
  const bump = (front: boolean) => {
    if (!sel) return
    pushHistory(snapNow())
    setLayout((ls) => ls.map((l) => (l.itemId === sel ? { ...l, z: front ? topZ(ls) : bottomZ(ls) } : l)))
  }
  const chooseBg = (id: string) => { if (id !== bg) { pushHistory(snapNow()); setBg(id) } }

  // ---- перетаскивание вещи из шторки на холст
  const dragFrom = (item: Item, e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    const sx = e.clientX
    const sy = e.clientY
    let started = false
    const toApp = (cx: number, cy: number) => {
      const r = cvRef.current!.getBoundingClientRect()
      const k = r.width / dims.w
      return { x: (cx - r.left) / k, y: (cy - r.top) / k, k, r }
    }
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!started) {
        const vertical = Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)
        const mouse = ev.pointerType === 'mouse' && Math.hypot(dx, dy) > 8
        if (!(vertical || mouse)) return
        started = true
      }
      const p = toApp(ev.clientX, ev.clientY)
      setGhost({ item, x: p.x, y: p.y })
    }
    const end = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', mv)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
      setGhost(null)
      if (!started) {
        if (ev.type === 'pointerup') tapTile(item)
        return
      }
      const dock = dockRef.current?.getBoundingClientRect()
      if (ev.type === 'pointerup' && dock && ev.clientY < dock.top) {
        const p = toApp(ev.clientX, ev.clientY)
        add(item, clamp(p.x / dims.w, 0.04, 0.96), clamp((p.y - dims.top) / dims.boxH, 0.04, 0.96))
      }
    }
    try { el.setPointerCapture(e.pointerId) } catch { /* указатель уже отпущен */ }
    el.addEventListener('pointermove', mv)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  }
  const tapTile = (item: Item) => {
    if (layoutRef.current.some((l) => l.itemId === item.id)) setSel(item.id)
    else add(item)
  }

  const onCanvasItems = layout.map((l) => items.find((i) => i.id === l.itemId)).filter((i): i is Item => !!i)
  const empty = layout.length === 0
  const counts = useMemo(() => {
    const m: Partial<Record<Category, number>> = {}
    items.forEach((i) => { m[i.category] = (m[i.category] ?? 0) + 1 })
    return m
  }, [items])
  const tiles = items.filter((i) => cat === 'all' || i.category === cat)

  const title = savedId ? savedAll.find((o) => o.id === savedId)?.name ?? 'Образ' : st.occasion ? `Образ на ${occasionById(st.occasion).label.toLowerCase()}` : 'Новый образ'

  const save = () => {
    if (empty) return
    const ids = layout.map((l) => l.itemId)
    const snap = snapshotOf(onCanvasItems)
    if (savedId && savedAll.some((o) => o.id === savedId)) {
      updateSaved(savedId, { items: ids, layout, bg, snap })
      toast('Образ сохранён', 'success', { icon: 'heart' })
      return
    }
    saveFav(
      { name: st.occasion ? occasionById(st.occasion).label : 'Мой образ', occasion: st.occasion ?? 'every', items: ids, layout, bg, snap, explanation: st.explanation },
      (id) => setSavedId(id),
    )
  }
  const share = () => {
    if (empty) return
    useOutfitFlow.setState({ result: { templateId: 'constructor', occasion: st.occasion ?? 'every', itemIds: layout.map((l) => l.itemId), explanation: '', missing: [], wish: '' } })
    navigate('/outfit/share')
  }

  // панель инструментов под выбранной вещью
  const selL = layout.find((l) => l.itemId === sel)
  const tool = selL && {
    x: clamp(selL.x * dims.w, 90, dims.w - 90),
    y: clamp(dims.top + selL.y * dims.boxH + (dims.w * 0.36 * selL.scale) / 2 + 30, dims.top, 560),
  }

  return (
    <div className="cv" ref={cvRef} style={{ background: bgColor(bg) }} onPointerDown={() => setSel(null)}>
      <div className="cv__dots" />
      {empty && (
        <div className="cv__empty">
          <span className="cv__empty-ico"><Icon name="hand-pointing" size={32} /></span>
          <span className="t-title2">Собери образ сам</span>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>Перетащи вещи из шторки на холст. Двумя пальцами можно увеличить и повернуть</span>
        </div>
      )}
      {layout.map((l) => {
        const it = items.find((i) => i.id === l.itemId)
        if (!it) return null
        return (
          <CanvasItem
            key={l.itemId} item={it} l={l} selected={sel === l.itemId} dims={dims} fresh={fresh === l.itemId}
            onSelect={() => setSel(l.itemId)} onLive={(p) => live(l.itemId, p)} onStart={onStart} onEnd={onEnd}
          />
        )
      })}
      {tool && (
        <div className="cv__tools glass" style={{ left: tool.x, top: tool.y }} onPointerDown={(e) => e.stopPropagation()}>
          <IconButton icon="stack-plus" label="На передний план" variant="plain" onClick={() => bump(true)} />
          <IconButton icon="stack-minus" label="На задний план" variant="plain" onClick={() => bump(false)} />
          <IconButton icon="trash" label="Убрать с холста" variant="plain" onClick={removeSel} />
        </div>
      )}
      <div className="cv__top" onPointerDown={(e) => e.stopPropagation()}>
        <TopBar
          left={<IconButton icon="caret-left" label="Назад" variant="plain" onClick={() => navigate(-1)} />}
          title={title}
          right={
            <>
              <IconButton icon="arrow-counter-clockwise" label="Отменить" variant="plain" disabled={!canUndo} onClick={undo} />
              <IconButton icon="share-network" label="Поделиться" variant="plain" disabled={empty} onClick={share} />
              <IconButton icon="bookmark-simple" label="Сохранить" variant={empty ? 'plain' : 'solid'} disabled={empty} onClick={save} />
            </>
          }
        />
      </div>
      {!empty && (
        <div className="cv__bg glass" onPointerDown={(e) => e.stopPropagation()}>
          {BACKGROUNDS.map((b) => (
            <button key={b.id} type="button" aria-label={b.label} aria-pressed={bg === b.id} onClick={() => chooseBg(b.id)}><span style={{ background: b.swatch }} /></button>
          ))}
        </div>
      )}
      {ghost && <div className="cv__ghost" style={{ left: ghost.x, top: ghost.y }}><ItemArt item={ghost.item} /></div>}

      <div className="sheet sheet--docked glass" ref={dockRef} onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="sheet__grab" aria-label={expanded ? 'Свернуть шторку' : 'Развернуть шторку'} onClick={() => setExpanded(!expanded)} style={{ width: 88, height: 44, marginBottom: -14, background: 'transparent', opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--ink-tertiary)', opacity: 0.5 }} />
        </button>
        <div className="chips-scroll" style={{ flexShrink: 0 }}>
          <Chip label={`Все ${items.length}`} selected={cat === 'all'} onClick={() => setCat('all')} />
          {CHIP_ORDER.filter((c) => counts[c]).map((c) => <Chip key={c} label={`${SHORT[c]} ${counts[c]}`} selected={cat === c} onClick={() => setCat(c)} />)}
        </div>
        <div className={expanded ? 'dock__grid sheet__body' : 'dock__strip'} style={expanded ? { maxHeight: 260 } : undefined}>
          {tiles.map((it) => {
            const used = layout.some((l) => l.itemId === it.id)
            return (
              <div key={it.id} className="dock__tile" onPointerDown={(e) => { if (!used) dragFrom(it, e) }} onClick={() => used && setSel(it.id)} style={{ width: expanded ? undefined : 76 }}>
                <ItemTile item={it} label="" selected={used} unavailable={!it.available} />
              </div>
            )
          })}
        </div>
      </div>
      {sheets}
    </div>
  )
}

