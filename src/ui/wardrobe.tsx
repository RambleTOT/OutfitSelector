import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Silhouette } from '../data/silhouettes'
import type { Category, Item } from '../data/types'
import { Icon } from './Icon'
import { IconButton } from './buttons'
import { TickBars } from './stats'

/* PNG из public/items/{id}.png подхватывается автоматически; ids без файла запоминаются */
const noPng = new Set<string>()

export function ItemArt({ item, shadow = false }: { item: Item; shadow?: boolean }) {
  const [failed, setFailed] = useState(noPng.has(item.id))
  const src = item.photo ?? (failed ? null : `${import.meta.env.BASE_URL}items/${item.id}.png`)
  return (
    <div className={`art ${shadow ? 'art--shadow' : ''}`}>
      {src ? (
        <img
          src={src} alt={item.title} draggable={false}
          onError={() => { noPng.add(item.id); setFailed(true) }}
        />
      ) : (
        <Silhouette kind={item.kind} color={item.color} pattern={item.pattern} title={item.title} />
      )}
    </div>
  )
}

export function ItemTile({
  item, label, unavailable, unavailableLabel = 'в стирке', selected, loading, error, queued, onClick, onLongPress,
}: {
  item?: Item; label?: string; unavailable?: boolean; unavailableLabel?: string; selected?: boolean; loading?: boolean
  error?: string | boolean; queued?: boolean; onClick?: () => void; onLongPress?: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  return (
    <div className="tile">
      <button
        type="button" className="tile__btn" aria-pressed={!!selected} aria-label={label ?? item?.title}
        data-selected={!!selected} data-error={!!error} data-loading={!!loading || !!queued}
        onClick={onClick}
        onPointerDown={() => { if (onLongPress) timer.current = setTimeout(onLongPress, 500) }}
        onPointerUp={() => clearTimeout(timer.current)} onPointerLeave={() => clearTimeout(timer.current)}
        onContextMenu={(e) => { if (onLongPress) e.preventDefault() }}
      >
        {!loading && !queued && item && <span className="tile__art" data-dim={!!unavailable}><ItemArt item={item} shadow /></span>}
        {unavailable && <span className="tile__badge"><Icon name="drop" size={12} />{unavailableLabel}</span>}
        {queued && <span className="tile__badge"><Icon name="wifi-slash" size={12} />Ждёт сеть</span>}
        {selected && <span className="tile__mark"><Icon name="check" size={15} /></span>}
        {error && <span className="tile__mark tile__mark--error"><Icon name="exclamation-mark" size={15} /></span>}
      </button>
      {(label ?? item?.title) && (
        <span className={`t-caption tile__label ${typeof error === 'string' ? 'tile__label--error' : ''}`}>
          {typeof error === 'string' ? error : (label ?? item?.title)}
        </span>
      )}
    </div>
  )
}

/* Коллаж «как на кровати»: верхняя одежда и верх сверху, низ ниже, обувь у ног, аксессуары сбоку */
interface Slot { left: string; top: string; width: string; height: string; rotate: number; z: number }
const SLOTS: Record<Category, Slot> = {
  outer: { left: '6%', top: '4%', width: '46%', height: '46%', rotate: -6, z: 2 },
  top: { left: '38%', top: '6%', width: '40%', height: '40%', rotate: 4, z: 3 },
  bottom: { left: '24%', top: '40%', width: '38%', height: '50%', rotate: -2, z: 1 },
  dress: { left: '27%', top: '6%', width: '44%', height: '82%', rotate: -2, z: 2 },
  shoes: { left: '56%', top: '66%', width: '30%', height: '26%', rotate: 8, z: 4 },
  accessory: { left: '74%', top: '30%', width: '22%', height: '24%', rotate: 10, z: 5 },
  bag: { left: '4%', top: '58%', width: '26%', height: '28%', rotate: -8, z: 4 },
}
const SLOTS_WITH_DRESS: Partial<Record<Category, Slot>> = {
  outer: { left: '2%', top: '12%', width: '46%', height: '58%', rotate: -8, z: 1 },
  bag: { left: '4%', top: '64%', width: '26%', height: '26%', rotate: -8, z: 4 },
}

export function OutfitCard({
  items, explanation, liked = null, onLike, onDislike, loading = false, hint, aspect = '1 / 1.05', header, footer, ghostSlots, style,
}: {
  items: Item[]; explanation?: string; liked?: boolean | null; onLike?: () => void; onDislike?: () => void; loading?: boolean
  hint?: ReactNode; aspect?: string; header?: ReactNode; footer?: ReactNode
  /** для ожидания AI: пустые слоты по категориям вместо реальных вещей */
  ghostSlots?: Category[]
  style?: CSSProperties
}) {
  const hasDress = items.some((i) => i.category === 'dress')
  const seen = new Set<Category>()
  const placed = items.filter((i) => (seen.has(i.category) ? false : (seen.add(i.category), true)))
  return (
    <div className="outfit" style={style}>
      {header}
      <div className="outfit__mat" style={{ aspectRatio: aspect }}>
        {placed.map((it, i) => {
          const s = (hasDress && SLOTS_WITH_DRESS[it.category]) || SLOTS[it.category]
          const style: CSSProperties = {
            left: s.left, top: s.top, width: s.width, height: s.height, zIndex: s.z, transform: `rotate(${s.rotate}deg)`,
            animation: loading ? `at-shuffle 2.4s ${i * 0.2}s ease-in-out infinite` : `at-fly-in var(--dur-spring) ${i * 60}ms var(--ease-spring) both`,
          }
          return <div key={it.id} className="outfit__item" style={style}><ItemArt item={it} shadow /></div>
        })}
        {ghostSlots?.map((c, i) => {
          const s = SLOTS[c]
          return (
            <div key={c} className="outfit__item" style={{ left: s.left, top: s.top, width: s.width, height: s.height, zIndex: s.z, transform: `rotate(${s.rotate}deg)`, animation: `at-shuffle 2.4s ${i * 0.2}s ease-in-out infinite` }}>
              <span style={{ width: '100%', height: '100%', borderRadius: 18, background: '#F7F7FA', boxShadow: 'var(--shadow-item)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B4B4BD' }}>
                <Icon name={ghostIcon[c]} size={36} />
              </span>
            </div>
          )
        })}
        {!loading && (onLike || onDislike) && (
          <div className="outfit__rate">
            <span className={liked === true ? 'pop-on' : ''}><IconButton icon="thumbs-up" label="Нравится" selected={liked === true} pop={liked === true} onClick={onLike} /></span>
            <span><IconButton icon="thumbs-down" label="Не нравится" selected={liked === false} pop={liked === false} onClick={onDislike} /></span>
          </div>
        )}
      </div>
      {explanation && <p className="t-body outfit__text">{explanation}</p>}
      {hint && <div className="t-callout outfit__hint"><Icon name="sneaker" size={20} color="var(--accent)" />{hint}</div>}
      {footer}
    </div>
  )
}

const ghostIcon: Record<Category, string> = {
  top: 't-shirt', outer: 'hoodie', bottom: 'pants', dress: 'dress', shoes: 'sneaker', bag: 'handbag', accessory: 'sunglasses',
}

/** SetupBanner: Первые вещи · N из 5 */
export function SetupBanner({ count, goal = 5, hint, onClick }: { count: number; goal?: number; hint: string; onClick: () => void }) {
  return (
    <button type="button" className="setup" onClick={onClick}>
      <span className="setup__body">
        <span className="t-micro setup__label">Первые вещи · {count} из {goal}</span>
        <span className="t-headline">{hint}</span>
        <TickBars value={count} max={goal} count={goal} height={10} />
      </span>
      <Icon name="caret-right" size={22} color="var(--ink-secondary)" />
    </button>
  )
}

/** SettingsList / SettingsRow */
export function SettingsList({ children }: { children: ReactNode }) {
  return <div className="list">{children}</div>
}

export function SettingsRow({ icon, label, value, trailing = 'caret', danger, radio, onClick }: {
  icon?: string; label: string; value?: string; trailing?: 'caret' | 'radio' | 'check' | 'none' | ReactNode; danger?: boolean; radio?: boolean; onClick?: () => void
}) {
  return (
    <button type="button" className={`row ${danger ? 'row--danger' : ''}`} onClick={onClick}>
      {icon && <Icon name={icon} size={22} />}
      <span className="t-body row__label">{label}</span>
      {value && <span className="t-callout row__val">{value}</span>}
      {trailing === 'caret' && <Icon name="caret-right" size={20} color="var(--ink-tertiary)" />}
      {trailing === 'radio' && <span className="radio" data-on={!!radio} />}
      {trailing === 'check' && radio && <Icon name="check" size={22} color="var(--accent)" />}
      {typeof trailing === 'object' && trailing}
    </button>
  )
}
