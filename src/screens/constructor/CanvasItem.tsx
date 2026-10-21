import { useRef } from 'react'
import { Icon, ItemArt } from '../../ui'
import type { CanvasLayoutItem, Item } from '../../data/types'
import { BASE, clamp } from './layout'

export interface Dims { w: number; boxH: number; top: number }

interface Props {
  item: Item
  l: CanvasLayoutItem
  selected: boolean
  dims: Dims
  fresh: boolean
  onSelect: () => void
  onLive: (patch: Partial<CanvasLayoutItem>) => void
  onStart: () => void
  onEnd: () => void
}

type Mode =
  | { m: 'drag'; sx: number; sy: number; ox: number; oy: number }
  | { m: 'pinch'; d0: number; a0: number; s0: number; r0: number; mx: number; my: number; ox: number; oy: number }

/**
 * CanvasItem: свободные x, y, масштаб и поворот.
 * Телефон: один палец двигает, два пальца масштабируют и поворачивают. Десктоп: тянуть мышью, ручки (поворот сверху, масштаб справа снизу), колесо мыши
 */
export function CanvasItem({ item, l, selected, dims, fresh, onSelect, onLive, onStart, onEnd }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const mode = useRef<Mode | null>(null)
  const latest = useRef(l)
  latest.current = l
  const wheelT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const size = BASE * dims.w * l.scale
  const cx = l.x * dims.w
  const cy = dims.top + l.y * dims.boxH
  // экран может быть уменьшен рамкой: переводим пиксели указателя в пиксели холста
  const k = () => (el.current ? el.current.parentElement!.getBoundingClientRect().width / dims.w : 1)

  const startMode = () => {
    const cur = latest.current
    const arr = [...pts.current.values()]
    if (arr.length >= 2) {
      const [a, b] = arr
      mode.current = {
        m: 'pinch', d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), s0: cur.scale, r0: cur.rotate,
        mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ox: cur.x, oy: cur.y,
      }
    } else if (arr.length === 1) {
      mode.current = { m: 'drag', sx: arr[0].x, sy: arr[0].y, ox: cur.x, oy: cur.y }
    }
  }

  const down = (e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect()
    try { el.current?.setPointerCapture(e.pointerId) } catch { /* указатель уже отпущен */ }
    if (pts.current.size === 0) onStart()
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    startMode()
  }
  const move = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId) || !mode.current) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const kk = k()
    const md = mode.current
    if (md.m === 'drag') {
      onLive({
        x: clamp(md.ox + (e.clientX - md.sx) / kk / dims.w, 0.02, 0.98),
        y: clamp(md.oy + (e.clientY - md.sy) / kk / dims.boxH, 0.02, 0.98),
      })
    } else {
      const [a, b] = [...pts.current.values()]
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      onLive({
        scale: clamp(md.s0 * (dist / md.d0), 0.3, 3.5),
        rotate: md.r0 + ((ang - md.a0) * 180) / Math.PI,
        x: clamp(md.ox + (mx - md.mx) / kk / dims.w, 0.02, 0.98),
        y: clamp(md.oy + (my - md.my) / kk / dims.boxH, 0.02, 0.98),
      })
    }
  }
  const up = (e: React.PointerEvent) => {
    pts.current.delete(e.pointerId)
    if (pts.current.size === 0) { mode.current = null; onEnd() } else startMode()
  }

  const wheel = (e: React.WheelEvent) => {
    if (!selected) return
    if (!wheelT.current) onStart()
    onLive({ scale: clamp(latest.current.scale * Math.exp(-e.deltaY * 0.002), 0.3, 3.5) })
    clearTimeout(wheelT.current)
    wheelT.current = setTimeout(() => { wheelT.current = undefined; onEnd() }, 350)
  }

  // ручки на десктопе: поворот и масштаб от центра вещи
  const handle = (kind: 'rotate' | 'scale') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation()
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* указатель уже отпущен */ }
      onStart()
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId) || !el.current) return
      const r = el.current.getBoundingClientRect()
      const ccx = r.left + r.width / 2
      const ccy = r.top + r.height / 2
      if (kind === 'rotate') onLive({ rotate: (Math.atan2(e.clientY - ccy, e.clientX - ccx) * 180) / Math.PI + 90 })
      else {
        const half = (BASE * dims.w * k()) / 2 // половина стороны при scale = 1, в пикселях экрана
        const d = Math.hypot(e.clientX - ccx, e.clientY - ccy) / Math.SQRT2
        onLive({ scale: clamp(d / half, 0.3, 3.5) })
      }
    },
    onPointerUp: () => onEnd(),
    onPointerCancel: () => onEnd(),
  })

  return (
    <div
      ref={el}
      className={`ci ${fresh ? 'ci--drop' : ''}`}
      style={{ left: cx, top: cy, width: size, height: size, transform: `translate(-50%, -50%) rotate(${l.rotate}deg)`, zIndex: Math.round(l.z), ['--rot' as string]: `${l.rotate}deg` }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}
      role="button" aria-label={item.title} aria-pressed={selected}
    >
      <div className="ci__art" style={{ filter: 'drop-shadow(0 6px 16px rgba(23,23,26,0.14))' }}><ItemArt item={item} /></div>
      {selected && (
        <>
          <div className="ci__frame" />
          {[{ left: -13, top: -13 }, { right: -13, top: -13 }, { left: -13, bottom: -13 }].map((p, i) => <span key={i} className="ci__h" style={{ ...p, position: 'absolute' }} />)}
          <span className="ci__stem" />
          <span className="ci__hit" style={{ left: '50%', top: -74, marginLeft: -22 }} {...handle('rotate')}><i style={{ width: 24, height: 24 }}><Icon name="arrow-clockwise" size={14} /></i></span>
          <span className="ci__hit" style={{ right: -28, bottom: -28 }} {...handle('scale')}><i style={{ width: 20, height: 20 }}><Icon name="arrows-out-simple" size={12} /></i></span>
        </>
      )}
    </div>
  )
}
