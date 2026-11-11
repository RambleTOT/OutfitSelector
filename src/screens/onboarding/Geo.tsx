import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon } from '../../ui'
import { useApp } from '../../store/app'
import { useWeather } from '../../lib/weather'
import { findCity } from '../../data/cities'
import { track } from '../../lib/analytics'

/**
 * Первый вход, сразу после кода: просим геопозицию, чтобы подбирать образ по погоде.
 * Браузер сам покажет системный запрос. Если место определилось, город в анкете подставляется сам; если нет (отказ, VPN, нет сигнала),
 * честно говорим и ведём в анкету, где город выбирается руками
 */
export function Geo() {
  const navigate = useNavigate()
  const patch = useApp((s) => s.patch)
  const setQuiz = useApp((s) => s.setQuiz)
  const locate = useWeather((s) => s.locate)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  const go = () => { patch({ geoAsked: true }); navigate('/onboarding/quiz', { replace: true }) }

  const allow = async () => {
    setBusy(true); setFailed(null)
    track('geo_ask')
    const r = await locate()
    setBusy(false)
    if (r === 'ok') {
      track('geo_ok')
      const name = useWeather.getState().place?.name
      if (name && findCity(name)) setQuiz({ city: name })
      go()
      return
    }
    track('geo_fail', { reason: r })
    setFailed(r === 'denied'
      ? 'Доступ к геопозиции закрыт. Можно разрешить его в настройках браузера или просто выбрать город самому'
      : 'Не получилось определить место, такое бывает при VPN или слабом сигнале. Выбери город сам, это быстро')
  }

  return (
    <>
      <div className="flow" style={{ padding: '96px 20px 128px', gap: 24 }}>
        <span className="geo__pin" aria-hidden><Icon name="map-pin" size={44} /></span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="t-title1" style={{ textWrap: 'balance' }}>Подберём образ по погоде</h2>
          <p className="t-body muted" style={{ textWrap: 'pretty' }}>Разреши определить, где ты, и мы сами узнаем температуру и осадки. Место нужно только для погоды, мы его нигде не показываем</p>
        </div>
        {failed && <div className="notice" role="status"><Icon name="exclamation-mark" size={24} color="var(--accent)" /><span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>{failed}</span></div>}
      </div>
      <CtaPlate>
        {failed
          ? <Button full onClick={go}>Выбрать город</Button>
          : <Button full icon="crosshair" loading={busy} onClick={allow}>Разрешить определить место</Button>}
        {!failed && <Button variant="text" full onClick={go}>Выбрать город самому</Button>}
        {failed && <Button variant="text" full loading={busy} onClick={allow}>Попробовать ещё раз</Button>}
      </CtaPlate>
    </>
  )
}
