import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../ui'
import { CATEGORY_ICON } from '../../data/items'
import { useApp, useLimits } from '../../store/app'
import { toast } from '../../store/ui'
import { intakePhoto } from '../../lib/intake'
import { ScanOverlay } from './ScanOverlay'

/** ADD-02 Camera: всегда тёмная. Камера и галерея открывают выбор фото с устройства */
export function Camera() {
  const navigate = useNavigate()
  const lim = useLimits()
  const items = useApp((s) => s.items)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyFile, setBusyFile] = useState<File | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // ушли с экрана (свайп назад на iPhone): обработка отменяется и не переключит экран позже
  useEffect(() => () => abortRef.current?.abort(), [])
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)

  const missing = (['top', 'bottom', 'shoes', 'outer', 'bag'] as const).find((c) => !items.some((i) => i.category === c)) ?? 'top'
  const counter = lim.photosLimit === null ? 'Фото без лимита' : `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото`

  const onFile = async (f?: File) => {
    if (!f || busy) return
    setBusy(true)
    setBusyFile(f)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      await intakePhoto(f, navigate, undefined, ctrl.signal)
    } catch {
      toast('Не получилось открыть фото', 'error')
    } finally {
      setBusy(false)
      setBusyFile(null)
    }
  }

  return (
    <div className="cam">
      {busy && <ScanOverlay file={busyFile} onCancel={() => abortRef.current?.abort()} />}
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      <div className="cam__top">
        <button type="button" className="cam__btn" aria-label="Закрыть" onClick={() => navigate(-1)}><Icon name="x" size={24} /></button>
        <span className="cam__pill">{counter}</span>
        <button type="button" className="cam__btn" aria-label="Вспышка" aria-pressed={flash} onClick={() => setFlash(!flash)}><Icon name="lightning" size={24} /></button>
      </div>
      <div className="cam__frame"><Icon name={CATEGORY_ICON[missing]} size={140} /></div>
      <div className="cam__hint">
        <span className="t-headline">Положи вещь целиком в рамку</span>
        <span className="t-callout sub" style={{ fontWeight: 400 }}>Ровный фон и дневной свет. Неудачное фото лимит не тратит</span>
      </div>
      <div className="cam__bar">
        <button type="button" className="cam__side" aria-label="Галерея" onClick={() => galRef.current?.click()}><Icon name="image" size={26} /></button>
        <button type="button" className="cam__shutter" aria-label="Снять" onClick={() => camRef.current?.click()}><span /></button>
        <button type="button" className="cam__side" aria-label="Перевернуть камеру" onClick={() => camRef.current?.click()}><Icon name="camera-rotate" size={26} /></button>
      </div>
    </div>
  )
}
