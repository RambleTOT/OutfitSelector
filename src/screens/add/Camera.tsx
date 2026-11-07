import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../ui'
import { CATEGORY_ICON } from '../../data/items'
import { useApp, useLimits } from '../../store/app'
import { usePhotoFlow, guessItem, describedItem } from '../../store/photo'
import { cutoutPhoto, describePhoto } from '../../lib/ai'
import { toast } from '../../store/ui'
import { cutOutPhoto, looksLikeNotClothing } from '../../lib/image'

/** ADD-02 Camera: всегда тёмная. Камера и галерея открывают выбор фото с устройства */
export function Camera() {
  const navigate = useNavigate()
  const lim = useLimits()
  const items = useApp((s) => s.items)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)

  const missing = (['top', 'bottom', 'shoes', 'outer', 'bag'] as const).find((c) => !items.some((i) => i.category === c)) ?? 'top'
  const counter = lim.photosLimit === null ? 'Фото без лимита' : `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото`

  const onFile = async (f?: File) => {
    if (!f || busy) return
    setBusy(true)
    try {
      if (looksLikeNotClothing(f)) {
        usePhotoFlow.getState().fail()
        navigate('/add/notclothing', { replace: true })
        return
      }
      const local = await cutOutPhoto(f)
      // сервер (если подключён) вырезает фон лучше и описывает вещь по фото; без него остаётся локальный результат
      const [cut, desc] = await Promise.all([cutoutPhoto(local.dataUrl), describePhoto(local.dataUrl)])
      const dataUrl = cut ?? local.dataUrl
      if (desc && desc.isClothing === false) {
        usePhotoFlow.getState().fail()
        navigate('/add/notclothing', { replace: true })
        return
      }
      usePhotoFlow.getState().start(desc?.category ? describedItem(dataUrl, local.colorName, desc) : guessItem(dataUrl, local.colorName, f.name))
      navigate('/add/processing', { replace: true })
    } catch {
      toast('Не получилось открыть фото', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cam">
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
