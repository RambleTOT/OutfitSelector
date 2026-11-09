import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton, ItemArt } from '../../ui'
import { addPhotoItem, usePhotoFlow } from '../../store/photo'
import { toast, useUi } from '../../store/ui'
import { plural } from '../../lib/format'

/** ADD-07 PhotoFound: на фото нашлось несколько вещей. Все отмечены, лишнее можно снять, одно главное действие внизу */
export function Found() {
  const navigate = useNavigate()
  const found = usePhotoFlow((s) => s.found)
  const returnTo = useUi((s) => s.addSheet.returnTo)
  const [off, setOff] = useState<Set<string>>(new Set())
  if (!found.length) return <Navigate to={returnTo} replace />

  const chosen = found.filter((i) => !off.has(i.id))
  const toggle = (id: string) => setOff((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const close = () => { usePhotoFlow.getState().reset(); navigate(returnTo, { replace: true }) }
  const add = () => {
    // одно фото с несколькими вещами считается за одно в лимите
    chosen.forEach((it, k) => addPhotoItem(it, { countPhoto: k === 0 }))
    usePhotoFlow.getState().reset()
    toast(`Добавили ${chosen.length} ${plural(chosen.length, 'вещь', 'вещи', 'вещей')}`)
    navigate(returnTo, { replace: true })
  }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 150px', gap: 20 }}>
        <div className="nav-row"><IconButton icon="x" label="Закрыть" variant="solid" onClick={close} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="t-title1">Нашли {found.length} {plural(found.length, 'вещь', 'вещи', 'вещей')}</h2>
          <span className="t-callout muted" style={{ fontWeight: 400 }}>Сняли с фона и разложили по видам. Лишнее можно убрать</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {found.map((it) => {
            const on = !off.has(it.id)
            return (
              <button key={it.id} type="button" className="found-row" aria-pressed={on} aria-label={`${it.title}, ${on ? 'добавить' : 'не добавлять'}`} onClick={() => toggle(it.id)}>
                <span className="found-row__art"><ItemArt item={it} /></span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="t-callout" style={{ fontWeight: 700 }}>{it.title}</span>
                  <span className="t-caption muted">{it.type}, {it.colorName.toLowerCase()}</span>
                </span>
                <Icon name={on ? 'check-circle' : 'circle'} fill={on} size={26} color={on ? 'var(--accent)' : 'var(--ink-tertiary)'} />
              </button>
            )
          })}
        </div>
      </div>
      <CtaPlate>
        <Button full disabled={!chosen.length} onClick={add}>{chosen.length ? `Добавить ${chosen.length}` : 'Выбери хотя бы одну'}</Button>
        <span className="t-caption muted" style={{ textAlign: 'center', padding: '4px 0 2px' }}>Вид и цвет потом можно поправить в карточке вещи</span>
      </CtaPlate>
    </>
  )
}
