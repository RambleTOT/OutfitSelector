import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, CtaPlate, IconButton, ItemTile, TextInput } from '../../ui'
import { CATEGORY_SINGULAR, makeDescription } from '../../data/catalog'
import { CATEGORY_ORDER } from '../../data/items'
import type { Category, Item } from '../../data/types'
import { loadCatalog, searchCatalog, type CatalogEntry } from '../../data/photoCatalog'
import { useApp } from '../../store/app'
import { toast, useUi } from '../../store/ui'

const LABEL: Record<Category, string> = { ...CATEGORY_SINGULAR, outer: 'Верхняя' }

/** ADD-05 Catalog: поиск готовых красивых фото вещей («чёрная футболка оверсайз»). Без лимита, фото не нужно */
export function Catalog() {
  const navigate = useNavigate()
  const returnTo = useUi((s) => s.addSheet.returnTo)
  const addItem = useApp((s) => s.addItem)
  const [list, setList] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [gender, setGender] = useState<'all' | 'f' | 'm'>('all')
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => { void loadCatalog().then((l) => { setList(l); setLoading(false) }) }, [])
  const found = useMemo(() => searchCatalog(list, q, gender, cat), [list, q, gender, cat])
  const byId = useMemo(() => new Map(list.map((e) => [e.id, e])), [list])

  const toItem = (e: CatalogEntry): Item => ({
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    category: e.category, type: e.type, kind: 'tshirt', title: e.title, color: e.color, colorName: e.colorName.toLowerCase(),
    pattern: 'однотон', material: e.material ?? 'хлопок', fit: e.fit ?? 'прямой', warmth: e.warmth ?? 'демисезон', formality: e.formality ?? 'кэжуал',
    description: '', available: true, source: 'catalog', photo: e.img, addedAt: Date.now(),
  })
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const add = () => {
    for (const id of picked) {
      const e = byId.get(id)
      if (!e) continue
      const it = toItem(e)
      addItem({ ...it, description: makeDescription(it) })
    }
    toast(picked.length > 1 ? 'Вещи добавлены' : 'Вещь добавлена')
    navigate(returnTo, { replace: true })
  }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 128px', gap: 16 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} />
          <span className="t-headline">Найти вещь</span>
          <span style={{ width: 44 }} />
        </div>
        <TextInput value={q} onChange={setQ} placeholder="Например, чёрная футболка оверсайз" icon="magnifying-glass" maxLength={50} />
        <div className="chips-scroll">
          {([['all', 'Любая'], ['f', 'Женская'], ['m', 'Мужская']] as const).map(([v, l]) => <Chip key={v} label={l} selected={gender === v} onClick={() => setGender(v)} />)}
        </div>
        <div className="chips-scroll">
          <Chip label="Всё" selected={cat === 'all'} onClick={() => setCat('all')} />
          {CATEGORY_ORDER.map((c) => <Chip key={c} label={LABEL[c]} selected={cat === c} onClick={() => setCat(c)} />)}
        </div>
        {loading
          ? <p className="t-callout muted">Загружаю каталог…</p>
          : found.length === 0
            ? (
              <div className="notice" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>Такой вещи в каталоге пока нет. Лучший способ: сфотографировать её, фон уберём сами</span>
                <Button full variant="secondary" icon="camera" onClick={() => navigate('/add/photo', { replace: true })}>Сфоткать</Button>
              </div>
            )
            : (
              <div className="grid3">
                {found.slice(0, 60).map((e) => (
                  <ItemTile key={e.id} item={toItem(e)} label={e.title} selected={picked.includes(e.id)} onClick={() => toggle(e.id)} />
                ))}
              </div>
            )}
      </div>
      <CtaPlate>
        <Button full disabled={picked.length === 0} onClick={add}>{picked.length ? `Добавить · ${picked.length}` : 'Выбери вещи'}</Button>
      </CtaPlate>
    </>
  )
}
