import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './buttons'

export interface TabDef { id: string; label: string; icon: string }

export const TABS: TabDef[] = [
  { id: 'outfit', label: 'Образ', icon: 'sparkle' },
  { id: 'wardrobe', label: 'Гардероб', icon: 'coat-hanger' },
  { id: 'favorites', label: 'Избранное', icon: 'heart' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
]

export function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <nav className="tabbar glass" aria-label="Разделы">
      {TABS.map((t) => (
        <button key={t.id} type="button" className="tabbar__btn" aria-current={t.id === active ? 'page' : undefined} onClick={() => onChange(t.id)}>
          <Icon name={t.icon} fill={t.id === active} size={24} />
          <span style={{ fontWeight: t.id === active ? 600 : 500 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

export function TopBar({ left, title, right, glass = true }: { left?: ReactNode; title?: ReactNode; right?: ReactNode; glass?: boolean }) {
  return (
    <div className={`topbar ${glass ? 'glass' : 'topbar--plain'}`}>
      <div className="topbar__side">{left}</div>
      <div className="topbar__title t-headline">{title}</div>
      <div className="topbar__side topbar__side--r">{right}</div>
    </div>
  )
}

/** Строка шапки внутренних экранов: назад · заголовок · пустое место */
export function NavHeader({ title, onBack, right }: { title?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="nav-row">
      <IconButton icon="caret-left" label="Назад" variant="solid" onClick={onBack} />
      {title && <span className="t-headline">{title}</span>}
      {right ?? <span style={{ width: 44 }} />}
    </div>
  )
}
