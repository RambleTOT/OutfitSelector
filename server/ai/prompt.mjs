/** Общая часть для всех провайдеров: подсказка стилисту, разбор и проверка ответа */

const OCC = { every: 'на каждый день', work: 'на работу', study: 'на учёбу', date: 'на свидание', walk: 'на прогулку', party: 'на вечеринку' }
const SLOTS = { top: 'верх', bottom: 'низ', dress: 'платье', outer: 'верхняя одежда', shoes: 'обувь', accessory: 'аксессуар', bag: 'сумка' }

export const SYSTEM = `Ты стилист в приложении Atelier. Из списка вещей пользователя собери один образ.
Правила:
- Используй только вещи из списка и только их id. Ничего не выдумывай.
- Образ: верх и низ (или платье) и обувь, если она есть в списке. Верхнюю одежду добавляй, если холодно. Сумку и аксессуар только если они уместны, не больше одной вещи каждого вида.
- Не бери две вещи одной категории, кроме аксессуаров.
- Учитывай погоду, повод и пожелание. Не бери то, что пользователь не носит.
- Пояснение: одно предложение до 120 символов на «ты», без точки в конце, про то, почему вещи сочетаются.
- Название: 2–3 слова.
Ответ строго JSON без пояснений вокруг: {"ids":["id1","id2"],"name":"Название","explanation":"Пояснение"}`

/** Список вещей в компактном виде: одна строка на вещь, чтобы экономить токены (до 25 вещей, см. спецификацию §12) */
export function buildUserPrompt({ items, occasion, wish, weather, nogo, avoid }) {
  const lines = items.slice(0, 25).map((i) => `${i.id} | ${SLOTS[i.category] ?? i.category} | ${i.title} | ${i.colorName ?? ''} | ${i.formality ?? ''} | ${i.warmth ?? ''}`)
  return [
    `Повод: ${OCC[occasion] ?? occasion}`,
    weather ? `Погода: ${weather.temp}°C${weather.desc ? ', ' + weather.desc : ''}` : '',
    wish ? `Пожелание: ${String(wish).slice(0, 200)}` : '',
    nogo?.length ? `Не носит: ${nogo.join(', ')}` : '',
    avoid?.length ? `Предложи другой набор, не такой: ${avoid.join(', ')}` : '',
    'Вещи (id | вид | название | цвет | формальность | тепло):',
    ...lines,
  ].filter(Boolean).join('\n')
}

/** Достаёт JSON из ответа модели (она может обернуть его в ```), проверяет, что id настоящие и состав разумный */
export function parseOutfit(text, items) {
  const m = String(text).match(/\{[\s\S]*\}/)
  if (!m) throw new Error('bad_json')
  let d
  try { d = JSON.parse(m[0]) } catch { throw new Error('bad_json') }
  const byId = new Map(items.map((i) => [i.id, i]))
  const ids = [...new Set((Array.isArray(d.ids) ? d.ids : []).filter((x) => byId.has(x)))]
  const cats = ids.map((id) => byId.get(id).category)
  const hasBody = cats.includes('dress') || (cats.includes('top') && cats.includes('bottom'))
  if (!hasBody) throw new Error('bad_set')
  for (const c of ['top', 'bottom', 'dress', 'outer', 'shoes', 'bag']) if (cats.filter((x) => x === c).length > 1) throw new Error('bad_set')
  if (cats.includes('dress') && (cats.includes('top') || cats.includes('bottom'))) throw new Error('bad_set')
  return {
    ids,
    name: String(d.name ?? '').slice(0, 40),
    explanation: String(d.explanation ?? '').replace(/\.$/, '').slice(0, 200),
  }
}

export async function fetchJson(url, init, timeoutMs) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal })
    const text = await r.text()
    if (!r.ok) throw new Error(`http_${r.status}: ${text.slice(0, 200)}`)
    return JSON.parse(text)
  } finally { clearTimeout(t) }
}
