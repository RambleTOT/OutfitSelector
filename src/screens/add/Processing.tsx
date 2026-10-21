import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton } from '../../ui'
import { ItemArt } from '../../ui'
import { useLimits } from '../../store/app'
import { addPhotoItem, PROCESS_MS, usePhotoFlow } from '../../store/photo'
import { toast, useUi } from '../../store/ui'

const STEPS = ['Убираю фон', 'Выравниваю свет и цвет', 'Заполняю описание']

/** ADD-03 PhotoProcessing: три шага за ~2 с, затем карточка вещи. «Снять следующую» не ждёт, фото доделается в фоне */
export function Processing() {
  const navigate = useNavigate()
  const { item, status, markDone } = usePhotoFlow()
  const lim = useLimits()
  const returnTo = useUi((s) => s.addSheet.returnTo)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const step = PROCESS_MS / 3
    const t1 = setTimeout(() => setPhase(1), step)
    const t2 = setTimeout(() => setPhase(2), step * 2)
    const t3 = setTimeout(() => { setPhase(3); markDone() }, PROCESS_MS)
    const t4 = setTimeout(() => navigate('/add/card', { replace: true }), PROCESS_MS + 650)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [markDone, navigate])

  if (!item || status === 'idle') return <Navigate to={returnTo} replace />
  const done = phase >= 3
  const left = lim.photosLeft === null ? null : Math.max(0, lim.photosLeft - 1)

  const next = () => {
    addPhotoItem(item, { background: true })
    usePhotoFlow.getState().reset()
    if (lim.photosLeft !== null && lim.photosLeft - 1 <= 0) { navigate(returnTo, { replace: true }); toast('Вещь добавлена'); return }
    navigate('/add/photo', { replace: true })
  }
  const close = () => { addPhotoItem(item, { background: true }); usePhotoFlow.getState().reset(); toast('Вещь добавлена'); navigate(returnTo, { replace: true }) }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 128px', gap: 24 }}>
        <div className="nav-row">
          <IconButton icon="x" label="Закрыть" variant="solid" onClick={close} />
          <span className="t-caption muted">{left === null ? 'Фото без лимита' : `Осталось ${left} из ${lim.photosLimit} фото`}</span>
        </div>
        <h2 className="t-title1">{done ? `Готово, это ${item.type}` : 'Обрабатываю фото'}</h2>
        <div className="proc-hero" data-loading={!done}>
          {done
            ? <div className="proc-hero__art"><ItemArt item={item} shadow /></div>
            : item.photo && <img className="proc-hero__raw" src={item.photo} alt="" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((label, i) => {
            const isDone = phase > i
            const active = phase === i
            return (
              <div key={label} className="proc-step t-callout" style={{ color: isDone || active ? 'var(--ink-primary)' : 'var(--ink-tertiary)' }}>
                <Icon name={isDone ? 'check-circle' : active ? 'circle-dashed' : 'circle'} fill={isDone} size={22} color={isDone ? 'var(--success)' : active ? 'var(--accent)' : 'var(--ink-tertiary)'} />
                {label}
              </div>
            )
          })}
        </div>
      </div>
      <CtaPlate>
        <Button full icon="camera" onClick={next}>Снять следующую</Button>
        <span className="t-caption muted" style={{ textAlign: 'center', padding: '4px 0 2px' }}>Можно не ждать, доделаем в фоне</span>
      </CtaPlate>
    </>
  )
}
