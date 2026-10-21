import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  BigTextField, Button, Chip, Icon, IconButton, LimitMeter, SetupBanner, WeatherPill,
} from '../../ui'
import { OCCASIONS, WEATHER, WISH_SUGGESTIONS } from '../../data/items'
import { canGenerate } from '../../data/generate'
import { useApp, useLimits } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import { toast } from '../../store/ui'
import { todayLabel, temp } from '../../lib/format'
import { PaywallSheet } from '../paywall/PaywallSheet'
import { goalReached, setupHint } from '../../lib/setup'
import { MonthlyCap } from './MonthlyCap'
import { Waiting } from './Waiting'

/** OUT-01 OutfitHome: до нажатия. Ожидание (OUT-02) и результат на маршруте /outfit/result */
export function OutfitHome() {
  const phase = useOutfitFlow((s) => s.phase)
  if (phase === 'waiting') return <Waiting />
  if (phase === 'result' || phase === 'error') return <Navigate to="/outfit/result" replace />
  return <Idle />
}

function Idle() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const offline = useApp((s) => s.offline)
  const quizCity = useApp((s) => s.quiz.city) || WEATHER.city
  const onboarded = useApp((s) => s.onboarded)
  const markSeen = useApp((s) => s.markSeen)
  const lim = useLimits()
  const { occasion, wish, setOccasion, setWish, start } = useOutfitFlow()
  const [sheet, setSheet] = useState(() => lim.outfitsLeft === 0) // OUT-03: на пустом лимите шторка открывается сразу
  const [capClosed, setCapClosed] = useState(false)

  const ready = canGenerate(items)
  const unlimited = lim.outfitsLeft === null
  const empty = !unlimited && lim.outfitsLeft === 0
  const total = lim.outfitsLimit ?? 0

  // лимит кончился, пока экран открыт (кнопка демо или сборка): сразу показываем шторку
  const prevLeft = useRef(lim.outfitsLeft)
  useEffect(() => {
    if (prevLeft.current !== 0 && lim.outfitsLeft === 0) setSheet(true)
    prevLeft.current = lim.outfitsLeft
  }, [lim.outfitsLeft])
  useEffect(() => { markSeen('outfit-visited') }, [markSeen])

  if (lim.monthlyCapReached && !capClosed) return <MonthlyCap onClose={() => setCapClosed(true)} />

  const build = () => {
    const r = start('new')
    if (r === 'limit') setSheet(true)
    else if (r === 'cap') setCapClosed(false)
    else if (r === 'offline') toast('Нет интернета', 'offline')
  }

  const disabled = offline || !ready || (lim.monthlyCapReached)
  const showBanner = onboarded && !goalReached(items)

  return (
    <>
      <div className="screen screen--fade" style={{ paddingBottom: 250 }}>
        <div className="nav-row">
          <WeatherPill icon={WEATHER.icon} temp={temp()} city={quizCity} offline={offline} />
          <IconButton icon="bell" label="Уведомления" variant="solid" onClick={() => toast('Новых уведомлений нет', 'neutral')} />
        </div>
        <div className="screen-title">
          <span className="t-callout muted">{offline ? 'Погода обновится, когда появится сеть' : `${todayLabel()} · ${WEATHER.label.toLowerCase()}, ${WEATHER.note}`}</span>
          <h2 className="t-title1" style={{ fontSize: '2rem', lineHeight: '2.25rem' }}>Что наденем сегодня</h2>
        </div>
        <div className="chips-scroll">
          {OCCASIONS.map((o) => (
            <Chip key={o.id} label={o.label} emoji={o.emoji} selected={occasion === o.id} onClick={() => setOccasion(o.id)} />
          ))}
        </div>
        <BigTextField value={wish} onChange={setWish} placeholder="Пожелание, если есть" suggestions={WISH_SUGGESTIONS} maxLength={80} />
        {showBanner && <SetupBanner count={items.length} hint={setupHint(items)} onClick={() => navigate('/onboarding/items')} />}
        <div className="card" style={{ padding: empty ? '12px 16px' : 16 }}>
          <LimitMeter
            remaining={lim.outfitsLeft ?? 0} total={total} unlimited={unlimited}
            onMore={() => setSheet(true)}
          />
        </div>
        {offline && (
          <div className="notice">
            <Icon name="wifi-slash" size={24} color="var(--ink-secondary)" />
            <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>Без сети образ не собрать. Гардероб и избранное открываются как обычно</span>
          </div>
        )}
      </div>
      <div className="bottom-actions">
        <Button full icon="sparkle" disabled={disabled} onClick={build}>Собрать образ</Button>
        <Button variant="secondary" full icon="hand-pointing" onClick={() => navigate('/constructor')}>Собрать самому</Button>
      </div>
      <PaywallSheet
        open={sheet} onClose={() => setSheet(false)}
        title="Образы закончились"
        subtitle={`Новые ${total} появятся в понедельник`}
      />
    </>
  )
}
