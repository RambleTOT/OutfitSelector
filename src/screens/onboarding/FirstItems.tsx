import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, ItemTile, TickBars } from '../../ui'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { canGenerate } from '../../data/generate'
import { goalReached } from '../../lib/setup'

/** ON-09 FirstItems: цель 5 вещей, минимум верх и низ или платье, лучше с обувью. Можно пропустить */
export function FirstItems() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const onboarded = useApp((s) => s.onboarded)
  const finish = useApp((s) => s.finishOnboarding)
  const openAddSheet = useUi((s) => s.openAddSheet)

  const has = (c: string) => items.some((i) => i.category === c)
  const ready = canGenerate(items)
  const goal = goalReached(items)
  const title = items.length === 0 ? 'Добавь первые вещи' : goal ? 'Гардероб готов' : ready ? 'Можно собирать образ' : 'Ещё немного'
  const hasDress = has('dress')
  const musts = [
    { label: 'Верх', ok: has('top') || hasDress },
    { label: 'Низ или платье', ok: has('bottom') || hasDress },
    { label: 'Обувь', ok: has('shoes') },
  ]
  const nextLabel = !ready ? (has('top') ? 'Низ или платье' : 'Верх или платье') : !has('shoes') ? 'Обувь' : 'Любая вещь'
  const slots = Math.max(0, 5 - items.length)
  const add = () => openAddSheet('/onboarding/items')
  const leave = (skipped: boolean) => { finish(skipped); navigate('/outfit', { replace: true }) }

  return (
    <>
      <div style={{ position: 'absolute', top: 44, right: 8, zIndex: 5 }}>
        <Button variant="text" onClick={() => leave(true)}>{items.length ? 'Позже' : 'Пропустить'}</Button>
      </div>
      <div className="flow" style={{ padding: '96px 20px 128px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="t-title1">{title}</h2>
          <p className="t-body muted" style={{ textWrap: 'pretty' }}>Для образа нужны верх и низ или платье. Лучше 5 вещей вместе с обувью</p>
        </div>
        <div className="progress-card">
          <div className="progress-card__row">
            <div className="progress-card__num">
              <span style={{ font: '900 56px/1 var(--font-ui)', letterSpacing: '-0.02em' }}>{items.length}</span>
              <span className="muted" style={{ font: '800 var(--type-title2-size)/1 var(--font-ui)', whiteSpace: 'nowrap' }}>из 5</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {musts.map((m) => (
                <span key={m.label} className={`must ${m.ok ? 'must--ok' : ''}`}>
                  <Icon name={m.ok ? 'check' : 'circle-dashed'} size={14} color={m.ok ? 'var(--success)' : 'var(--ink-secondary)'} />{m.label}
                </span>
              ))}
            </div>
          </div>
          <TickBars value={Math.min(5, items.length)} max={5} count={5} height={28} />
        </div>
        <div className="grid3" style={{ gap: 12 }}>
          {items.map((i) => <ItemTile key={i.id} item={i} onClick={() => navigate(`/item/${i.id}`)} />)}
          {Array.from({ length: slots }, (_, k) => (
            <button key={k} type="button" className="slot" aria-label="Добавить вещь" onClick={add}>
              <span className="slot__box"><Icon name="plus" size={28} /></span>
              <span className="t-caption slot__label">{k === 0 ? nextLabel : 'Любая вещь'}</span>
            </button>
          ))}
        </div>
        {!onboarded && items.length === 0 && <span className="t-caption muted" style={{ textAlign: 'center' }}>Из каталога можно добавлять без лимита</span>}
      </div>
      <CtaPlate>
        {ready
          ? <Button full icon="sparkle" onClick={() => leave(false)}>Собрать первый образ</Button>
          : <Button full icon="plus" onClick={add}>Добавить вещь</Button>}
      </CtaPlate>
    </>
  )
}
