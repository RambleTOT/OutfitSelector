import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Chip, CtaPlate, EmptyState, Icon, IconButton, ItemTile, SetupBanner, TextInput,
} from '../../ui'
const CHIP_ORDER: Category[] = ['top', 'bottom', 'shoes', 'outer', 'dress', 'bag', 'accessory']
import type { Category, Item } from '../../data/types'
import { useApp, useLimits } from '../../store/app'
import { useUi } from '../../store/ui'
import { COLORS } from '../../data/catalog'
import { goalReached, setupHeadline } from '../../lib/setup'
import { plural } from '../../lib/format'
import { FilterSheet } from './FilterSheet'
import { isFiltered, matchesFilters, matchesQuery, NO_FILTERS, type Filters } from './filters'

const SHORT: Record<Category, string> = { top: 'Верх', bottom: 'Низ', shoes: 'Обувь', outer: 'Верхняя', dress: 'Платья', bag: 'Сумки', accessory: 'Аксессуары' }
const hexOfGroup = (g: string) => COLORS.find((c) => c.name === g)?.hex

let loadedOnce = false // WRD-05: скелетон только при «холодном» старте

/** WRD-01 Wardrobe (+ WRD-02 пусто, WRD-03 фильтр, WRD-04 недоступные, WRD-05 загрузка, WRD-06 старт пропущен, WRD-08 выбор) */
export function Wardrobe() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const onboarded = useApp((s) => s.onboarded)
  const lim = useLimits()
  const setTabBarHidden = useUi((s) => s.setTabBarHidden)

  const [loading, setLoading] = useState(!loadedOnce)
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sheet, setSheet] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => { loadedOnce = true; setLoading(false) }, 700)
    return () => clearTimeout(t)
  }, [loading])
  useEffect(() => {
    setTabBarHidden(selecting)
    return () => setTabBarHidden(false)
  }, [selecting, setTabBarHidden])

  const counts = useMemo(() => {
    const m: Partial<Record<Category, number>> = {}
    items.forEach((i) => { m[i.category] = (m[i.category] ?? 0) + 1 })
    return m
  }, [items])

  const afterCat = cat === 'all' ? items : items.filter((i) => i.category === cat)
  const visible = afterCat.filter((i) => matchesQuery(i, query) && matchesFilters(i, filters))
  const shownTotal = items.filter((i) => matchesQuery(i, query) && matchesFilters(i, filters) && (cat === 'all' || i.category === cat)).length
  const filtered = isFiltered(filters) || query.trim().length > 0
  const reset = () => { setFilters(NO_FILTERS); setQuery('') }
  const anyUnavailable = items.some((i) => !i.available)

  const photoText = lim.photosLimit === null ? 'Фото без лимита' : `Фото ${lim.photosLimit - (lim.photosLeft ?? 0)} из ${lim.photosLimit}`

  const open = (i: Item) => {
    if (selecting) setPicked((p) => (p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id]))
    else navigate(`/item/${i.id}`)
  }
  const startSelect = (i?: Item) => { setSelecting(true); setPicked(i ? [i.id] : []) }
  const stopSelect = () => { setSelecting(false); setPicked([]) }

  // ---------- выбор для конструктора (WRD-08)
  if (selecting) {
    return (
      <>
        <div className="screen screen--fade" style={{ gap: 16, paddingBottom: 130 }}>
          <div className="nav-row">
            <IconButton icon="x" label="Отменить выбор" variant="solid" onClick={stopSelect} />
            <span className="t-headline">Выбрано {picked.length}</span>
            <Button variant="text" size="sm" onClick={() => setPicked([])}>Сбросить</Button>
          </div>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>Отметь вещи, которые хочешь сочетать. На холсте их можно двигать и добавлять другие</span>
          <div className="grid3">
            {items.map((i) => <ItemTile key={i.id} item={i} selected={picked.includes(i.id)} unavailable={!i.available} onClick={() => open(i)} />)}
          </div>
        </div>
        <CtaPlate>
          <Button full icon="hand-pointing" disabled={picked.length === 0} onClick={() => { navigate('/constructor', { state: { itemIds: picked } }); stopSelect() }}>В конструктор</Button>
        </CtaPlate>
      </>
    )
  }

  const header = (
    <div className="nav-row">
      <h2 className="t-title1" style={{ fontSize: '2rem', lineHeight: '2.25rem' }}>Гардероб</h2>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="photo-pill"><Icon name="camera" size={16} color="var(--accent)" />{photoText}</span>
        {items.length > 0 && <IconButton icon="check-circle" label="Выбрать" variant="plain" onClick={() => startSelect()} />}
      </span>
    </div>
  )

  // ---------- WRD-05 загрузка
  if (loading) {
    return (
      <div className="screen" style={{ gap: 16 }}>
        <h2 className="t-title1" style={{ fontSize: '2rem', lineHeight: '2.25rem' }}>Гардероб</h2>
        <div className="skeleton" style={{ height: 52 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[80, 70, 90].map((w) => <span key={w} className="skeleton" style={{ width: w, height: 40, borderRadius: 999 }} />)}
        </div>
        <div className="grid3">{Array.from({ length: 9 }, (_, k) => <ItemTile key={k} loading />)}</div>
      </div>
    )
  }

  // ---------- WRD-02 пусто
  if (items.length === 0) {
    return (
      <>
        <div className="screen screen--fade" style={{ gap: 16 }}>
          {header}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <EmptyState icon="coat-hanger" title="Здесь пока пусто" text="Добавь пару вещей, и я начну собирать из них образы" actionLabel="Добавить вещь" onAction={() => navigate('/add')} />
          </div>
          <span className="t-caption muted" style={{ textAlign: 'center', textWrap: 'pretty' }}>Шаблоном можно добавлять без лимита</span>
        </div>
      </>
    )
  }

  const showSetup = onboarded && !goalReached(items)
  const has = (c: Category) => counts[c]
  const base = has('dress') || (has('top') && has('bottom'))

  return (
    <>
      <div className="screen screen--fade" style={{ gap: 16 }}>
        {header}
        {showSetup && <SetupCard items={items} base={!!base} hasShoes={!!has('shoes')} onClick={() => navigate('/onboarding/items')} />}
        <TextInput placeholder="Найти: белая рубашка, лён" icon="magnifying-glass" value={query} onChange={setQuery} />
        <div className="chips-scroll" style={{ flexShrink: 0 }}>
          <Chip label={`Все ${items.length}`} selected={cat === 'all'} onClick={() => setCat('all')} />
          {CHIP_ORDER.filter((c) => counts[c]).map((c) => (
            <Chip key={c} label={`${SHORT[c]} ${counts[c]}`} selected={cat === c} onClick={() => setCat(c)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterButtons filters={filters} setFilters={setFilters} openSheet={() => setSheet(true)} />
        </div>
        {filtered && (
          <div className="nav-row">
            <span className="t-headline">{shownTotal === 0 ? 'Ничего не нашлось' : `Нашлось ${shownTotal} ${plural(shownTotal, 'вещь', 'вещи', 'вещей')}`}</span>
            <Button variant="text" onClick={reset}>Сбросить</Button>
          </div>
        )}
        {visible.length === 0 ? (
          <EmptyState icon="magnifying-glass" title="Ничего не нашлось" text="Попробуй другие слова или сбрось фильтры" actionLabel="Сбросить" onAction={() => { reset(); setCat('all') }} />
        ) : (
          <div className="grid3">
            {visible.map((i) => (
              <ItemTile key={i.id} item={i} unavailable={!i.available} queued={i.queued} onClick={() => open(i)} onLongPress={() => startSelect(i)} />
            ))}
          </div>
        )}
        {anyUnavailable && (
          <div className="notice">
            <Icon name="drop" size={22} color="var(--ink-secondary)" />
            <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>Бледные вещи сейчас недоступны и не попадают в образы. Вернуть можно в карточке вещи</span>
          </div>
        )}
        <div style={{ height: 96 }} />
      </div>
      <button type="button" className="fab" aria-label="Добавить вещь" onClick={() => navigate('/add')}><Icon name="plus" size={28} /></button>
      <FilterSheet open={sheet} onClose={() => setSheet(false)} value={filters} onChange={setFilters} count={shownTotal} />
    </>
  )
}

function FilterButtons({ filters, setFilters, openSheet }: { filters: Filters; setFilters: (f: Filters) => void; openSheet: () => void }) {
  const chip = (key: string, label: string, onRemove: () => void, swatch?: string) => (
    <button key={key} type="button" className="fbtn fbtn--on" onClick={onRemove} aria-label={`Убрать фильтр ${label}`}>
      {swatch && <span className="fbtn__sw" style={{ background: swatch }} />}{label}<Icon name="x" size={14} />
    </button>
  )
  const out = (key: string, label: string) => (
    <button key={key} type="button" className="fbtn" onClick={openSheet}>{label}<Icon name="caret-down" size={14} /></button>
  )
  return (
    <>
      {filters.colors.length ? filters.colors.map((c) => chip('c' + c, c, () => setFilters({ ...filters, colors: filters.colors.filter((x) => x !== c) }), hexOfGroup(c))) : out('c', 'Цвет')}
      {filters.seasons.length ? filters.seasons.map((c) => chip('s' + c, c, () => setFilters({ ...filters, seasons: filters.seasons.filter((x) => x !== c) }))) : out('s', 'Сезон')}
      {filters.formal.length ? filters.formal.map((c) => chip('f' + c, c, () => setFilters({ ...filters, formal: filters.formal.filter((x) => x !== c) }))) : out('f', 'Формальность')}
      {filters.hideUnavailable && chip('h', 'Без недоступных', () => setFilters({ ...filters, hideUnavailable: false }))}
    </>
  )
}

/** WRD-06 карточка прогресса: Для первого образа нужен… N из 5 */
function SetupCard({ items, base, hasShoes, onClick }: { items: Item[]; base: boolean; hasShoes: boolean; onClick: () => void }) {
  const hasTop = items.some((i) => i.category === 'top')
  const must = [
    { label: 'Верх', ok: hasTop || items.some((i) => i.category === 'dress') },
    { label: 'Низ или платье', ok: base || items.some((i) => i.category === 'bottom' || i.category === 'dress') },
    { label: 'Обувь', ok: hasShoes },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SetupBanner count={items.length} hint={setupHeadline(items)} onClick={onClick} />
      <div className="musts">
        {must.map((m) => (
          <span key={m.label} className={`must ${m.ok ? 'must--ok' : ''}`}>
            <Icon name={m.ok ? 'check' : 'circle-dashed'} size={14} color={m.ok ? 'var(--success)' : 'var(--ink-secondary)'} />{m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

