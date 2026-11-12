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

/** Вид холста: масштаб и сдвиг. Двумя пальцами по пустому месту можно увеличить поле, одним сдвинуть; есть кнопки + и − */
interface View { z: number; x: number; y: number }
const MIN_Z = 0.5
const MAX_Z = 3

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
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 })
  const viewRef = useRef(view)
  viewRef.current = view
  const vpts = useRef(new Map<number, { x: number; y: number }>())
  const vmode = useRef<{ m: 'pan'; sx: number; sy: number; x0: number; y0: number } | { m: 'pinch'; d0: number; z0: number; x0: number; y0: number; mx: number; my: number } | null>(null)

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

  // ---- масштаб и сдвиг холста
  const cvPoint = (cx: number, cy: number) => {
    const r = cvRef.current!.getBoundingClientRect()
    const k = r.width / dims.w || 1
    return { x: (cx - r.left) / k, y: (cy - r.top) / k }
  }
  const clampView = (v: View): View => {
    const H = cvRef.current?.offsetHeight ?? 844
    const lim = (size: number) => { const free = size * (1 - v.z); return [Math.min(0, free) - 80, Math.max(0, free) + 80] as const }
    const [ax, bx] = lim(dims.w)
    const [ay, by] = lim(H)
    return { z: clamp(v.z, MIN_Z, MAX_Z), x: clamp(v.x, ax, bx), y: clamp(v.y, ay, by) }
  }
  const zoomAt = (factor: number, mx = dims.w / 2, my = (cvRef.current?.offsetHeight ?? 844) / 2) => {
    const v = viewRef.current
    const z = clamp(v.z * factor, MIN_Z, MAX_Z)
    const wx = (mx - v.x) / v.z
    const wy = (my - v.y) / v.z
    setView(clampView({ z, x: mx - wx * z, y: my - wy * z }))
  }
  const startView = () => {
    const a = [...vpts.current.values()].map((p) => cvPoint(p.x, p.y))
    const v = viewRef.current
    if (a.length >= 2) vmode.current = { m: 'pinch', d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, z0: v.z, x0: v.x, y0: v.y, mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2 }
    else if (a.length === 1) vmode.current = { m: 'pan', sx: a[0].x, sy: a[0].y, x0: v.x, y0: v.y }
    else vmode.current = null
  }
  const cvDown = (e: React.PointerEvent) => {
    setSel(null)
    vpts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    startView()
  }
  const cvMove = (e: React.PointerEvent) => {
    if (!vpts.current.has(e.pointerId) || !vmode.current) return
    vpts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const a = [...vpts.current.values()].map((p) => cvPoint(p.x, p.y))
    const m = vmode.current
    if (m.m === 'pinch' && a.length >= 2) {
      const d = Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1
      const z = clamp(m.z0 * (d / m.d0), MIN_Z, MAX_Z)
      const mx = (a[0].x + a[1].x) / 2
      const my = (a[0].y + a[1].y) / 2
      const wx = (m.mx - m.x0) / m.z0
      const wy = (m.my - m.y0) / m.z0
      setView(clampView({ z, x: mx - wx * z, y: my - wy * z }))
    } else if (m.m === 'pan' && a.length === 1 && Math.hypot(a[0].x - m.sx, a[0].y - m.sy) > 3) {
      setView(clampView({ z: viewRef.current.z, x: m.x0 + (a[0].x - m.sx), y: m.y0 + (a[0].y - m.sy) }))
    }
  }
  const cvUp = (e: React.PointerEvent) => { vpts.current.delete(e.pointerId); startView() }
  const cvWheel = (e: React.WheelEvent) => {
    const p = cvPoint(e.clientX, e.clientY)
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), p.x, p.y)
  }

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
    // точка в координатах холста с учётом масштаба и сдвига
    const toWorld = (cx: number, cy: number) => {
      const p = toApp(cx, cy)
      const v = viewRef.current
      return { x: (p.x - v.x) / v.z, y: (p.y - v.y) / v.z }
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
        const p = toWorld(ev.clientX, ev.clientY)
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
    x: clamp(view.x + selL.x * dims.w * view.z, 90, dims.w - 90),
    y: clamp(view.y + (dims.top + selL.y * dims.boxH + (dims.w * 0.36 * selL.scale) / 2 + 30) * view.z, dims.top, 560),
  }

  return (
    <div className="cv" ref={cvRef} style={{ background: bgColor(bg) }} onPointerDown={cvDown} onPointerMove={cvMove} onPointerUp={cvUp} onPointerCancel={cvUp} onWheel={cvWheel}>
      <div className="cv__dots" style={{ backgroundSize: `${20 * view.z}px ${20 * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px` }} />
      {empty && (
        <div className="cv__empty">
          <span className="cv__empty-ico"><Icon name="hand-pointing" size={32} /></span>
          <span className="t-title2">Собери образ сам</span>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>Перетащи вещи из шторки на холст. Двумя пальцами можно увеличить и повернуть</span>
        </div>
      )}
      <div className="cv__world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
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
      </div>
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
      <div className="cv__zoom glass" onPointerDown={(e) => e.stopPropagation()}>
        <IconButton icon="plus" label="Увеличить" variant="plain" disabled={view.z >= MAX_Z} onClick={() => zoomAt(1.3)} />
        <IconButton icon="minus" label="Уменьшить" variant="plain" disabled={view.z <= MIN_Z} onClick={() => zoomAt(1 / 1.3)} />
        <IconButton icon="arrows-out-simple" label="Вернуть вид" variant="plain" disabled={view.z === 1 && view.x === 0 && view.y === 0} onClick={() => setView({ z: 1, x: 0, y: 0 })} />
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

