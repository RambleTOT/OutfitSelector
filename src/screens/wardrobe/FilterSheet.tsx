import { BottomSheet, Button, Chip, Switch } from '../../ui'
import { COLORS } from '../../data/catalog'
import { FORMALS, NO_FILTERS, SEASONS, type Filters } from './filters'

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

/** WRD-07 WardrobeFiltersSheet */
export function FilterSheet({
  open, onClose, value, onChange, count,
}: { open: boolean; onClose: () => void; value: Filters; onChange: (f: Filters) => void; count: number }) {
  return (
    <BottomSheet
      open={open} onClose={onClose} title="Фильтры"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" className="btn--shrink" onClick={() => onChange(NO_FILTERS)}>Сбросить</Button>
          <Button full onClick={onClose}>Показать {count}</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="t-micro group-title">Цвет</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <button key={c.name} type="button" className="sw" aria-label={c.name} aria-pressed={value.colors.includes(c.name)} onClick={() => onChange({ ...value, colors: toggle(value.colors, c.name) })}>
                <span className="sw__dot" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>
        <Group title="Сезон" options={SEASONS} selected={value.seasons} onToggle={(v) => onChange({ ...value, seasons: toggle(value.seasons, v) })} />
        <Group title="Формальность" options={FORMALS} selected={value.formal} onToggle={(v) => onChange({ ...value, formal: toggle(value.formal, v) })} />
        <Switch checked={value.hideUnavailable} onChange={(v) => onChange({ ...value, hideUnavailable: v })} label="Скрыть недоступные" description="В стирке, в ремонте, у подруги" />
      </div>
    </BottomSheet>
  )
}

function Group({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="t-micro group-title">{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => <Chip key={o} label={o} selected={selected.includes(o)} onClick={() => onToggle(o)} />)}
      </div>
    </div>
  )
}
