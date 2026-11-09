import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton } from '../../ui'
import { useUi } from '../../store/ui'
import { usePhotoFlow } from '../../store/photo'
import { looksLikeNotClothing } from '../../lib/image'
import { intakePhoto } from '../../lib/intake'

/** ADD-04 PhotoNotClothing: фото не списалось, предлагаем переснять или выбрать другое */
export function NotClothing() {
  const navigate = useNavigate()
  const returnTo = useUi((s) => s.addSheet.returnTo)
  const gal = useRef<HTMLInputElement>(null)

  const pick = async (f?: File) => {
    if (!f) return
    if (looksLikeNotClothing(f)) return
    await intakePhoto(f, navigate)
  }

  return (
    <>
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      <div className="flow" style={{ padding: '56px 20px 150px', gap: 24 }}>
        <div className="nav-row"><IconButton icon="x" label="Закрыть" variant="solid" onClick={() => { usePhotoFlow.getState().reset(); navigate(returnTo, { replace: true }) }} /></div>
        <h2 className="t-title1" style={{ textWrap: 'pretty' }}>Не похоже на одежду, попробуй ещё раз</h2>
        <div className="proc-hero" data-error="true">
          <Icon name="coffee" size={150} color="#C9C9D1" />
          <span style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 999, background: 'var(--error)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="exclamation-mark" size={18} /></span>
        </div>
        <div className="notice">
          <Icon name="coat-hanger" size={24} color="var(--accent)" />
          <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>Положи вещь на ровную поверхность или повесь на плечики. Фото не списалось</span>
        </div>
      </div>
      <CtaPlate>
        <Button full icon="camera" onClick={() => navigate('/add/photo', { replace: true })}>Переснять</Button>
        <Button variant="text" full onClick={() => gal.current?.click()}>Выбрать другое фото</Button>
      </CtaPlate>
    </>
  )
}
