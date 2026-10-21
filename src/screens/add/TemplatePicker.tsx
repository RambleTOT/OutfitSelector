import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, CtaPlate, IconButton, ItemTile } from '../../ui'
import { buildTemplateItem, CATEGORY_SINGULAR, cap, COLORS, TYPES } from '../../data/catalog'
import { CATEGORY_ORDER } from '../../data/items'
import type { Category } from '../../data/types'
import { useApp } from '../../store/app'
import { toast, useUi } from '../../store/ui'

const LABEL: Record<Category, string> = { ...CATEGORY_SINGULAR, outer: 'Верхняя' }

/** ADD-05 TemplatePicker: категория, тип, цвет. Вещь сохраняется как иллюстрация в выбранном цвете, без лимита */
export function TemplatePicker() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const addItem = useApp((s) => s.addItem)
  const returnTo = useUi((s) => s.addSheet.returnTo)
  const firstMissing = (['top', 'bottom', 'shoes', 'outer', 'bag'] as Category[]).find((c) => !items.some((i) => i.category === c)) ?? 'accessory'
  const [category, setCategory] = useState<Category>(firstMissing)
  const [type, setType] = useState(TYPES[firstMissing][0].type)
  const [color, setColor] = useState('Синий')
  const preview = useMemo(() => buildTemplateItem(category, type, color), [category, type, color])

  const add = () => {
    addItem(preview)
    toast('Вещь добавлена')
    navigate(returnTo, { replace: true })
  }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 128px', gap: 20 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} />
          <span className="t-headline">Вещь из шаблона</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="tpl-preview"><ItemTile item={preview} label={preview.title} /></div>
        <Group title="Категория">
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} label={LABEL[c]} selected={category === c} onClick={() => { setCategory(c); setType(TYPES[c][0].type) }} />
          ))}
        </Group>
        <Group title="Тип">
          {TYPES[category].map((t) => <Chip key={t.type} label={cap(t.type)} selected={type === t.type} onClick={() => setType(t.type)} />)}
        </Group>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="t-micro group-title">Цвет · {color}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginLeft: -6 }}>
            {COLORS.map((c) => (
              <button key={c.name} type="button" className="swatch-lg" aria-label={c.name} aria-pressed={color === c.name} onClick={() => setColor(c.name)}>
                <span style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <CtaPlate><Button full onClick={add}>Добавить</Button></CtaPlate>
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="t-micro group-title">{title}</span>
      <div className="chips-wrap">{children}</div>
    </div>
  )
}
