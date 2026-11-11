// Погода для подбора образа. Источник: MET Norway (api.met.no), бесплатно с указанием источника, без ключа.
// Запросы идут через наш сервер: так координаты человека не уходят третьим лицам (наружу идёт точка, округлённая до ~1 км),
// ответ кэшируется на 20 минут, а при сбое источника отдаём последнюю известную погоду

const TTL = 20 * 60 * 1000
const STALE_MAX = 3 * 3600 * 1000
const UA = 'Atelier/1.0 (+https://atelierai.ru)'

const LABELS = {
  clearsky: ['Ясно', 'sun'],
  fair: ['Малооблачно', 'cloud-sun'],
  partlycloudy: ['Переменная облачность', 'cloud-sun'],
  cloudy: ['Пасмурно', 'cloud'],
  fog: ['Туман', 'cloud'],
  lightrain: ['Небольшой дождь', 'rain'],
  rain: ['Дождь', 'rain'],
  heavyrain: ['Сильный дождь', 'rain'],
  lightrainshowers: ['Небольшой дождь', 'rain'],
  rainshowers: ['Ливень', 'rain'],
  heavyrainshowers: ['Сильный ливень', 'rain'],
  lightsleet: ['Дождь со снегом', 'snow'],
  sleet: ['Дождь со снегом', 'snow'],
  heavysleet: ['Дождь со снегом', 'snow'],
  lightsleetshowers: ['Дождь со снегом', 'snow'],
  sleetshowers: ['Дождь со снегом', 'snow'],
  heavysleetshowers: ['Дождь со снегом', 'snow'],
  lightsnow: ['Небольшой снег', 'snow'],
  snow: ['Снег', 'snow'],
  heavysnow: ['Сильный снег', 'snow'],
  lightsnowshowers: ['Небольшой снег', 'snow'],
  snowshowers: ['Снегопад', 'snow'],
  heavysnowshowers: ['Сильный снегопад', 'snow'],
}

/** «partlycloudy_day» -> ['Переменная облачность', 'cloud-sun']; грозы определяем по суффиксу andthunder */
export function describeSymbol(code) {
  const base = String(code ?? '').replace(/_(day|night|polartwilight)$/, '')
  if (base.includes('thunder')) return ['Гроза', 'storm']
  return LABELS[base] ?? ['Облачно', 'cloud']
}

/** Из ответа MET берём ближайший к текущему моменту час */
export function parseMet(json, now = Date.now()) {
  const series = json?.properties?.timeseries
  if (!Array.isArray(series) || !series.length) throw new Error('empty')
  let best = series[0]
  for (const s of series) if (Math.abs(Date.parse(s.time) - now) < Math.abs(Date.parse(best.time) - now)) best = s
  const d = best.data?.instant?.details ?? {}
  if (typeof d.air_temperature !== 'number') throw new Error('no_temp')
  const sym = best.data.next_1_hours?.summary?.symbol_code ?? best.data.next_6_hours?.summary?.symbol_code
  const [label, kind] = describeSymbol(sym)
  const wind = Number(d.wind_speed ?? 0)
  const precip = Number(best.data.next_1_hours?.details?.precipitation_amount ?? 0)
  const wet = kind === 'rain' || kind === 'snow' || kind === 'storm' || precip >= 0.2
  const parts = []
  if (wind >= 10) parts.push('сильный ветер')
  else if (wind >= 5) parts.push('ветер')
  if (!wet) parts.push('без осадков')
  return { temp: Math.round(d.air_temperature), label, kind, note: parts.join(', '), wind: Math.round(wind * 10) / 10, wet, at: Date.now() }
}

export function createWeather(fetchImpl = fetch) {
  const cache = new Map()
  return async function weather(lat, lon) {
    const la = Math.round(lat * 100) / 100
    const lo = Math.round(lon * 100) / 100
    const key = `${la},${lo}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < TTL) return hit.data
    try {
      const r = await fetchImpl(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${la}&lon=${lo}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) throw new Error(`met_${r.status}`)
      const data = parseMet(await r.json())
      cache.set(key, { at: Date.now(), data })
      if (cache.size > 2000) for (const [k, v] of cache) if (Date.now() - v.at > TTL) cache.delete(k)
      return data
    } catch (e) {
      if (hit && Date.now() - hit.at < STALE_MAX) return { ...hit.data, stale: true }
      throw e
    }
  }
}
