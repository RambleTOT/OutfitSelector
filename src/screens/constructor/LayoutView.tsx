import { ItemArt } from '../../ui'
import type { CanvasLayoutItem, Item } from '../../data/types'
import { BASE, BOX_ASPECT, bgColor } from './layout'

/** Только просмотр: образ, собранный в конструкторе, с теми же позициями, поворотами и слоями */
export function LayoutView({ layout, items, bg, deletedIds }: { layout: CanvasLayoutItem[]; items: Item[]; bg?: string; deletedIds?: string[] }) {
  return (
    <div className="outfit" style={{ padding: 16 }}>
      <div className="outfit__mat" style={{ aspectRatio: `1 / ${BOX_ASPECT}`, background: bgColor(bg) === 'var(--bg-base)' ? 'var(--item-mat)' : bgColor(bg) }}>
        {[...layout].sort((a, b) => a.z - b.z).map((l, i) => {
          const it = items.find((x) => x.id === l.itemId)
          if (!it) return null
          const gone = deletedIds?.includes(it.id)
          return (
            <div
              key={l.itemId} className="outfit__item"
              style={{
                left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: `${BASE * l.scale * 100}%`, aspectRatio: '1 / 1',
                transform: `translate(-50%, -50%) rotate(${l.rotate}deg)`, zIndex: i, opacity: gone ? 0.35 : undefined,
                animation: `at-fly-in var(--dur-spring) ${i * 60}ms var(--ease-spring) both`,
              }}
            >
              <ItemArt item={it} shadow />
            </div>
          )
        })}
        {deletedIds && deletedIds.length > 0 && <span className="tile__badge" style={{ zIndex: 50 }}>вещь удалена</span>}
      </div>
    </div>
  )
}
