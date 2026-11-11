import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../ui'

/** Что «делает» приложение, пока сервер разбирает фото: сменяющиеся шаги, чтобы ожидание не казалось зависанием */
const PHASES = [
  'Ищу вещи на фото',
  'Убираю фон',
  'Смотрю на цвет и ткань',
  'Определяю вид вещи',
  'Выравниваю свет',
  'Готовлю карточку',
]
const TIPS = [
  'Лучше всего получаются вещи на ровном фоне при дневном свете',
  'Положи вещь целиком в кадр: так край получится чище',
  'Можно сфотографировать себя в образе, найдём каждую вещь отдельно',
  'Неудачное фото лимит не тратит',
  'Одну вещь на фото разбираем точнее, чем целую гору',
]

/**
 * Экран ожидания распознавания: фото человека, по нему идёт полоса света, шаги и подсказки меняются сами.
 * Полоса прогресса ускоренно заполняется до ~90% и дальше замедляется, на 100% не доходит, пока нет ответа
 */
export function ScanOverlay({ file, onCancel }: { file: File | null; onCancel: () => void }) {
  const [sec, setSec] = useState(0)
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const phase = Math.min(PHASES.length - 1, Math.floor(sec / 2.6))
  const tip = TIPS[Math.floor(sec / 6) % TIPS.length]
  const pct = Math.round(92 * (1 - Math.exp(-sec / 9)))
  const slow = sec >= 30 ? 'Связь медленная, подожди ещё чуть-чуть' : sec >= 18 ? 'Фото непростое, ещё немного' : null

  return (
    <div className="scan" role="status" aria-live="polite">
      <div className="scan__photo">
        {url && <img className="scan__bg" src={url} alt="" />}
        {url && <img className="scan__img" src={url} alt="" />}
        <span className="scan__beam" aria-hidden />
      </div>
      <div className="scan__text">
        <h2 key={phase} className="t-title2 scan__phase">{PHASES[phase]}</h2>
        <div className="scan__dots" aria-hidden>
          {PHASES.map((p, i) => <span key={p} data-on={i <= phase} />)}
        </div>
        <div className="scan__bar" aria-hidden><span style={{ width: `${pct}%` }} /></div>
        <p key={tip} className="t-callout scan__tip">{slow ?? tip}</p>
      </div>
      <Button variant="text" onClick={onCancel}>Отмена</Button>
    </div>
  )
}
