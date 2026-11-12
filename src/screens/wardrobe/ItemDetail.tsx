import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomSheet, Button, Chip, CtaPlate, Icon, IconButton, Switch } from '../../ui'
import { ItemArt } from '../../ui'
import { applyItemEdit, CATEGORY_SINGULAR, cap, COLORS, FIELD_OPTIONS, hexOfColorName, TYPES } from '../../data/catalog'
import { CATEGORY_ORDER } from '../../data/items'
import type { Item } from '../../data/types'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { shortDate } from '../../lib/format'

type Key = 'category' | 'type' | 'color' | 'color2' | 'pattern' | 'material' | 'fit' | 'warmth' | 'formality'

interface FieldDef { key: Key; label: string; group: string; swatch?: boolean }
const FIELDS: FieldDef[] = [
  { key: 'category', label: 'Категория', group: 'Основное' },
  { key: 'type', label: 'Тип', group: 'Основное' },
  { key: 'color', label: 'Цвет', group: 'Основное', swatch: true },
  { key: 'color2', label: 'Доп. цвет', group: 'Основное', swatch: true },
  { key: 'pattern', label: 'Узор', group: 'Подробнее' },
  { key: 'material', label: 'Материал', group: 'Подробнее' },
  { key: 'fit', label: 'Посадка', group: 'Подробнее' },
  { key: 'warmth', label: 'Теплота', group: 'Подробнее' },
  { key: 'formality', label: 'Формальность', group: 'Подробнее' },
]

/** Карточка вещи: поля, описание (редактируется), «Недоступна сейчас», удаление. Используется и после добавления вещи (ADD-06) */
export function ItemDetail({ isNew = false, itemOverride, onSaved }: { isNew?: boolean; itemOverride?: Item; onSaved?: (i: Item) => void }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const stored = useApp((s) => s.items.find((i) => i.id === id))
  const updateItem = useApp((s) => s.updateItem)
  const deleteItem = useApp((s) => s.deleteItem)
  const base = itemOverride ?? stored
  const [draft, setDraft] = useState<Item | null>(base ?? null)
  const [open, setOpen] = useState<Key | null>(null)
  const [confirm, setConfirm] = useState(false)
  if (!base || !draft) return <Navigate to="/wardrobe" replace />

  const set = (patch: Parameters<typeof applyItemEdit>[1]) => setDraft((d) => (d ? applyItemEdit(d, patch) : d))

  const value = (k: Key): string => {
    switch (k) {
      case 'category': return CATEGORY_SINGULAR[draft.category]
      case 'type': return cap(draft.type)
      case 'color': return cap(draft.colorName)
      case 'color2': return draft.color2 ? cap(draft.color2) : 'Нет'
      default: return cap(String(draft[k]))
    }
  }
  const options = (k: Key): { label: string; selected: boolean; pick: () => void }[] => {
    switch (k) {
      case 'category': return CATEGORY_ORDER.map((c) => ({ label: CATEGORY_SINGULAR[c], selected: draft.category === c, pick: () => set({ category: c }) }))
      case 'type': return TYPES[draft.category].map((t) => ({ label: cap(t.type), selected: draft.type === t.type, pick: () => set({ type: t.type }) }))
      case 'color': return COLORS.map((c) => ({ label: c.name, selected: draft.colorName === c.name.toLowerCase(), pick: () => set({ colorNameTo: c.name }) }))
      case 'color2': return [{ label: 'Нет', selected: !draft.color2, pick: () => set({ color2: undefined }) }, ...COLORS.map((c) => ({ label: c.name, selected: draft.color2 === c.name.toLowerCase(), pick: () => set({ color2: c.name.toLowerCase() }) }))]
      default: {
        const list = FIELD_OPTIONS[k as 'pattern'] as string[]
        // значение, которого нет в списке (например, пришло от распознавания), тоже показываем и оставляем выбранным
        const all = list.includes(String(draft[k])) ? list : [String(draft[k]), ...list]
        return all.map((o) => ({ label: cap(o), selected: draft[k] === o, pick: () => set({ [k]: o } as Partial<Item>) }))
      }
    }
  }
  const swatchOf = (k: Key) => (k === 'color' ? draft.color : k === 'color2' && draft.color2 ? hexOfColorName(draft.color2) : undefined)

  const save = () => {
    if (onSaved) { onSaved(draft); return }
    updateItem(draft)
    if (draft.available === false && stored?.available !== false) {
      toast(`${cap(draft.type)} в стирке, не возьму в образы`, 'neutral', {
        icon: 'drop', action: 'Вернуть',
        onAction: () => { const cur = useApp.getState().items.find((i) => i.id === draft.id); if (cur) updateItem({ ...cur, available: true }) },
      })
    } else toast('Изменения сохранены')
    navigate(-1)
  }

  const groups = ['Основное', 'Подробнее']
  const added = draft.addedAt ? (new Date(draft.addedAt).toDateString() === new Date().toDateString() ? 'добавлено сегодня' : `добавлено ${shortDate(draft.addedAt)}`) : null

  return (
    <>
      <div className="screen screen--push" style={{ gap: 16, paddingBottom: 128 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} />
          {!isNew && <IconButton icon="trash" label="Удалить" variant="solid" onClick={() => setConfirm(true)} />}
        </div>
        <div className="item-hero">
          <div className="item-hero__art" style={{ opacity: draft.available ? 1 : 0.4 }}><ItemArt item={draft} shadow /></div>
          {!draft.available && <span className="item-hero__badge"><Icon name="drop" size={14} />в стирке</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
          <h2 className="t-title1">{draft.title}</h2>
          <span className="t-caption muted">Ещё не надевал{added ? ` · ${added}` : ''}</span>
        </div>
        <div className="desc-card">
          <span className="t-micro group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="sparkle" size={14} color="var(--accent)" />Описание заполнено само</span>
          <textarea rows={3} value={draft.description} aria-label="Описание" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        {groups.map((g) => (
          <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="t-micro group-title" style={{ padding: '8px 4px 0' }}>{g}</span>
            <div className="list">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="field-group">
                  <button type="button" className="field-row" aria-expanded={open === f.key} onClick={() => setOpen(open === f.key ? null : f.key)}>
                    <span className="t-callout field-row__label">{f.label}</span>
                    {swatchOf(f.key) && <span className="field-row__sw" style={{ background: swatchOf(f.key) }} />}
                    <span className="t-headline">{value(f.key)}</span>
                    <Icon name={open === f.key ? 'caret-up' : 'caret-down'} size={18} color="var(--ink-tertiary)" />
                  </button>
                  {open === f.key && (
                    <div className="field-opts">
                      {options(f.key).map((o) => <Chip key={o.label} label={o.label} selected={o.selected} onClick={o.pick} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: '8px 16px' }}>
          <Switch checked={!draft.available} onChange={(v) => setDraft({ ...draft, available: !v })} label="Недоступна сейчас" description="Например, в стирке. Не попадёт в образы" />
        </div>
      </div>
      <CtaPlate><Button full onClick={save}>Сохранить</Button></CtaPlate>
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Удалить вещь?" subtitle="Она пропадёт из гардероба и образов. Слот фото не вернётся">
        <Button variant="danger" full onClick={() => { deleteItem(draft.id); toast('Вещь удалена', 'neutral'); navigate('/wardrobe', { replace: true }) }}>Удалить</Button>
        <Button variant="secondary" full onClick={() => setConfirm(false)}>Оставить</Button>
      </BottomSheet>
    </>
  )
}
