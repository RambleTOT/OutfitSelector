import { useEffect, useState } from 'react'
import { BottomSheet, Button, Chip, TextInput } from '../../ui'
import { searchCities } from '../../data/cities'
import { useWeather } from '../../lib/weather'
import { toast } from '../../store/ui'

/** Выбор места для погоды: по геопозиции или из списка городов. Нужен, когда геопозиция недоступна (отказ, VPN) или город в анкете не найден */
export function WeatherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const place = useWeather((s) => s.place)
  const pickCity = useWeather((s) => s.pickCity)
  const locate = useWeather((s) => s.locate)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (open) { setQ(''); setMsg('') } }, [open])

  const found = searchCities(q, 8)

  const byGeo = async () => {
    setBusy(true); setMsg('')
    const r = await locate()
    setBusy(false)
    if (r === 'ok') { toast('Погоду обновил', 'success'); onClose(); return }
    setMsg(r === 'denied'
      ? 'Доступ к геопозиции закрыт. Разреши его в настройках браузера или выбери город ниже'
      : 'Не получилось определить место. Выбери город ниже')
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Где ты сейчас" subtitle="Подберу образ под погоду в этом месте">
      <Button full variant="secondary" icon="crosshair" loading={busy} onClick={byGeo}>Определить по геопозиции</Button>
      {msg && <p className="t-callout muted" role="status">{msg}</p>}
      <TextInput value={q} onChange={setQ} placeholder="Найти город" icon="magnifying-glass" maxLength={40} />
      <div className="chips-wrap">
        {found.map((c) => (
          <Chip
            key={c.name} label={c.name} selected={place?.source === 'city' && place.name === c.name}
            onClick={async () => { await pickCity(c); onClose() }}
          />
        ))}
      </div>
      {q.trim() && found.length === 0 && <p className="t-callout muted">Такого города нет в списке. Выбери ближайший крупный город рядом с тобой</p>}
    </BottomSheet>
  )
}
