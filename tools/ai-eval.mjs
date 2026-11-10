#!/usr/bin/env node
/**
 * Проверка языковой модели на настоящей задаче Atelier: собрать образ из гардероба.
 * Берёт тот же системный промпт, ту же сборку запроса и ту же проверку ответа, что боевой сервер
 * (server/ai/prompt.mjs), гоняет набор тестовых случаев и считает долю верных ответов, скорость и цену.
 *
 * Любой OpenAI-совместимый API (Selectel, Timeweb, cloud.ru, RouterAI, OpenRouter, Ollama):
 *   EVAL_BASE_URL=https://.../v1 EVAL_KEY=... EVAL_MODEL=qwen3-... \
 *   EVAL_PRICE_IN=4 EVAL_PRICE_OUT=17 node tools/ai-eval.mjs
 * Цены в рублях за 1 млн токенов (вход и выход). Ключ только из переменной окружения, на экран не выводится.
 *
 * Без ключа проверка работает на макете (EVAL_MOCK=good|sloppy), чтобы убедиться, что сама проверка исправна.
 *
 * Дополнительно: EVAL_SYSTEM_ROLE (system по умолчанию; у Selectel в примере developer), EVAL_MAX_TOKENS (400 как в проде; для «думающих» моделей 1500), EVAL_EXTRA (JSON, добавляется в тело запроса, например выключить рассуждение), EVAL_N (случаев, 48), EVAL_CONC (параллельно, 2), EVAL_TEMP (0.7 как в проде),
 * EVAL_JSON=1 (просить response_format json_object), EVAL_USERS (пользователей в месяц для расчёта цены, 20),
 * EVAL_OUTFITS (образов на пользователя в месяц, 25), EVAL_SEED (число).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { SYSTEM, buildUserPrompt, parseOutfit, repairOutfit } from '../server/ai/prompt.mjs'

const env = process.env
const N = Number(env.EVAL_N ?? 48)
const CONC = Number(env.EVAL_CONC ?? 2)
const TEMP = Number(env.EVAL_TEMP ?? 0.7)
const MAX_TOKENS = Number(env.EVAL_MAX_TOKENS ?? 400)
const EXTRA = env.EVAL_EXTRA ? JSON.parse(env.EVAL_EXTRA) : {}
const USERS = Number(env.EVAL_USERS ?? 20)
const OUTFITS = Number(env.EVAL_OUTFITS ?? 25)
const PRICE_IN = Number(env.EVAL_PRICE_IN ?? 0)
const PRICE_OUT = Number(env.EVAL_PRICE_OUT ?? 0)
const MOCK = env.EVAL_MOCK
const MODEL = env.EVAL_MODEL ?? (MOCK ? `mock-${MOCK}` : '')
const BASE = (env.EVAL_BASE_URL ?? '').replace(/\/$/, '')
if (!MOCK && (!BASE || !MODEL)) { console.error('Нужны EVAL_BASE_URL и EVAL_MODEL (и EVAL_KEY). Без ключа: EVAL_MOCK=good node tools/ai-eval.mjs'); process.exit(1) }

// ---- повторяемые случайные числа
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
const rand = rng(Number(env.EVAL_SEED ?? 7))
const pick = (a) => a[Math.floor(rand() * a.length)]
const shuffle = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1])

// ---- каталог (сокращённая копия src/data/catalog.ts: вид, пол слова, формальность, тепло)
const TYPES = {
  top: [['футболка', 'f', 'кэжуал', 'лёгкая'], ['рубашка', 'f', 'смарт-кэжуал', 'лёгкая'], ['свитер', 'm', 'кэжуал', 'тёплая'], ['худи', 'n', 'спорт', 'демисезон'], ['лонгслив', 'm', 'кэжуал', 'демисезон'], ['свитшот', 'm', 'кэжуал', 'демисезон']],
  outer: [['тренч', 'm', 'смарт-кэжуал', 'демисезон'], ['пальто', 'n', 'смарт-кэжуал', 'тёплая'], ['куртка', 'f', 'кэжуал', 'демисезон'], ['пиджак', 'm', 'деловой', 'демисезон']],
  bottom: [['джинсы', 'p', 'кэжуал', 'демисезон'], ['брюки', 'p', 'смарт-кэжуал', 'демисезон'], ['юбка', 'f', 'смарт-кэжуал', 'демисезон'], ['шорты', 'p', 'кэжуал', 'лёгкая']],
  dress: [['платье', 'n', 'вечерний', 'демисезон']],
  shoes: [['кеды', 'p', 'кэжуал', 'демисезон'], ['кроссовки', 'p', 'спорт', 'демисезон'], ['лоферы', 'p', 'деловой', 'демисезон'], ['ботинки', 'p', 'смарт-кэжуал', 'тёплая']],
  bag: [['сумка', 'f', 'кэжуал', 'демисезон']],
  accessory: [['шарф', 'm', 'кэжуал', 'тёплая'], ['кепка', 'f', 'спорт', 'лёгкая'], ['шляпа', 'f', 'кэжуал', 'лёгкая']],
}
const COLORS = ['Белый', 'Чёрный', 'Серый', 'Бежевый', 'Синий', 'Красный', 'Зелёный', 'Коричневый', 'Жёлтый', 'Светло-голубой', 'Бордовый']
const colorForm = (name, g) => {
  const n = name.toLowerCase(); const soft = n.endsWith('ий'); const stem = n.slice(0, -2)
  return stem + (soft ? { f: 'яя', m: 'ий', n: 'ее', p: 'ие' } : { f: 'ая', m: 'ый', n: 'ое', p: 'ые' })[g]
}
const cap = (s) => s[0].toUpperCase() + s.slice(1)

function makeWardrobe(size) {
  const items = []
  const add = (cat) => {
    const [type, g, formality, warmth] = pick(TYPES[cat]); const colorName = pick(COLORS)
    if (items.some((i) => i.category === cat && i.type === type && i.colorName === colorName)) return
    items.push({ id: `i${items.length + 1}`, category: cat, type, colorName, formality, warmth, title: cap(`${colorForm(colorName, g)} ${type}`) })
  }
  add('top'); add('bottom'); add('shoes')
  while (items.length < size) add(pick(['top', 'top', 'bottom', 'bottom', 'shoes', 'outer', 'outer', 'dress', 'bag', 'accessory']))
  return shuffle(items).map((i, k) => ({ ...i, id: `i${k + 1}` }))
}

// ---- случаи
const OCCS = ['every', 'work', 'study', 'date', 'walk', 'party']
const WEATHERS = [[-15, 'снег'], [-7, 'мороз'], [0, 'пасмурно'], [4, 'дождь'], [8, 'облачно'], [12, 'ветер'], [16, 'ясно'], [20, 'солнечно'], [26, 'жарко'], [31, 'жара']]
const WISHES = [null, null, null, 'хочу что-нибудь яркое', 'хочется уютно', 'что-то строгое', 'без лишних деталей', 'чтобы было удобно весь день']

function makeCase(i) {
  const size = [6, 10, 14, 18, 25][i % 5]
  const items = makeWardrobe(size)
  const occasion = OCCS[i % OCCS.length]
  const [temp, desc] = pick(WEATHERS)
  const c = { items, occasion, weather: { temp, desc }, wish: pick(WISHES), nogo: [], avoid: [], ban: null }
  const kind = i % 4
  if (kind === 1) { // жёсткий запрет по виду
    const withAlt = items.filter((x) => ['top', 'bottom', 'shoes', 'outer'].includes(x.category) && items.filter((y) => y.category === x.category && y.type !== x.type).length > 0)
    if (withAlt.length) { c.ban = pick(withAlt).type; c.wish = `не хочу ${c.ban === 'джинсы' || c.ban === 'брюки' || c.ban === 'шорты' ? c.ban : 'надевать ' + c.ban}` }
  }
  if (kind === 2) { // «не носит»
    const t = pick(items.filter((x) => items.filter((y) => y.category === x.category && y.type !== x.type).length > 0 || x.category === 'accessory' || x.category === 'bag'))
    if (t) c.nogo = [t.type]
  }
  if (kind === 3) { // «другой набор»: прошлый образ из первых подходящих вещей
    const top = items.find((x) => x.category === 'top'), bot = items.find((x) => x.category === 'bottom')
    if (top && bot) c.avoid = [top.id, bot.id]
  }
  return c
}

// ---- проверки: каждая возвращает строку с причиной провала или null
const CHECKS = {
  valid: (c, o) => null, // состав и id проверяет parseOutfit, ошибка идёт отдельным счётчиком
  shoes: (c, o) => c.items.some((i) => i.category === 'shoes') && !o.cats.includes('shoes') ? 'нет обуви, хотя она есть в гардеробе' : null,
  outerCold: (c, o) => c.weather.temp <= 6 && c.items.some((i) => i.category === 'outer') && !o.cats.includes('outer') ? 'холодно, а верхней одежды нет' : null,
  outerHot: (c, o) => c.weather.temp >= 22 && o.cats.includes('outer') ? 'жарко, а взята верхняя одежда' : null,
  thermal: (c, o) => {
    const t = c.weather.temp
    if (t >= 24 && o.chosen.some((i) => i.warmth === 'тёплая')) return 'жара, а взята тёплая вещь'
    if (t <= 4 && o.chosen.some((i) => i.type === 'шорты')) return 'холодно, а взяты шорты'
    if (t <= 0 && o.chosen.some((i) => ['кепка', 'шляпа'].includes(i.type))) return 'мороз, а взят летний головной убор'
    return null
  },
  occasion: (c, o) => {
    if (['work', 'study'].includes(c.occasion) && o.chosen.some((i) => i.formality === 'спорт' && i.category !== 'accessory')) return 'спортивная вещь на работу или учёбу'
    if (c.occasion === 'work' && o.chosen.some((i) => i.type === 'шорты')) return 'шорты на работу'
    return null
  },
  nogo: (c, o) => (c.nogo.length && o.chosen.some((i) => c.nogo.includes(i.type))) ? 'взята вещь из «не носит»' : null,
  ban: (c, o) => (c.ban && o.chosen.some((i) => i.type === c.ban)) ? `нарушено пожелание «не хочу ${c.ban}»` : null,
  avoid: (c, o) => (c.avoid.length && c.avoid.every((id) => o.ids.includes(id)) && o.ids.length <= c.avoid.length + 1) ? 'повторён прошлый набор' : null,
  format: (c, o) => {
    if (!o.name || o.name.split(/\s+/).length > 4) return 'название не 2–3 слова'
    if (!o.explanation || o.explanation.length > 130) return 'пояснение пустое или длиннее 120 знаков'
    if (/\.$/.test(o.rawExplanation)) return 'точка в конце пояснения'
    if (/[*#`]/.test(o.explanation)) return 'разметка в пояснении'
    if (!/[а-яё]/i.test(o.explanation)) return 'пояснение не по-русски'
    return null
  },
}

// есть ли в этом гардеробе вообще образ, не нарушающий жёсткие правила (иначе провал модели не считаем: случай нерешаем)
function solvable(c) {
  const t = c.weather.temp
  const allowed = c.items.filter((i) => {
    if (c.nogo.includes(i.type) || c.ban === i.type) return false
    if (['work', 'study'].includes(c.occasion) && i.formality === 'спорт' && i.category !== 'accessory') return false
    if (c.occasion === 'work' && i.type === 'шорты') return false
    if (t >= 24 && i.warmth === 'тёплая') return false
    if (t <= 4 && i.type === 'шорты') return false
    return true
  })
  const has = (cat, list = allowed) => list.some((i) => i.category === cat)
  if (!(has('dress') || (has('top') && has('bottom')))) return false
  if (has('shoes', c.items) && !has('shoes')) return false
  if (t <= 6 && has('outer', c.items) && !has('outer')) return false
  return true
}

// ---- вызов модели
async function callModel(system, user) {
  if (MOCK) return mockModel(user)
  const t0 = Date.now()
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), Number(env.EVAL_TIMEOUT_MS ?? 60000))
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(env.EVAL_KEY ? { Authorization: `Bearer ${env.EVAL_KEY}` } : {}) },
      body: JSON.stringify({ model: MODEL, temperature: TEMP, max_tokens: MAX_TOKENS, ...(env.EVAL_JSON === '1' ? { response_format: { type: 'json_object' } } : {}), ...EXTRA, messages: [{ role: env.EVAL_SYSTEM_ROLE ?? 'system', content: system }, { role: 'user', content: user }] }),
    })
    const text = await r.text()
    if (!r.ok) throw new Error(`http_${r.status}: ${text.slice(0, 160).replace(env.EVAL_KEY ?? '\u0000', '***')}`)
    const j = JSON.parse(text)
    const ch = j.choices?.[0]
    return { text: ch?.message?.content ?? '', inTok: j.usage?.prompt_tokens, outTok: j.usage?.completion_tokens, reasonTok: j.usage?.completion_tokens_details?.reasoning_tokens ?? 0, cut: ch?.finish_reason === 'length', ms: Date.now() - t0 }
  } finally { clearTimeout(to) }
}

// макет модели: «good» собирает разумный образ по правилам, «sloppy» намеренно ошибается
function mockModel(user) {
  const rows = user.split('\n').filter((l) => /^i\d+ \|/.test(l)).map((l) => { const [id, cat, , , , warmth] = l.split(' | '); return { id, cat, warmth } })
  const T = Number(/Погода: (-?\d+)/.exec(user)?.[1] ?? 15)
  const cat = (c) => rows.find((r) => r.cat === c)
  const ids = [cat('верх')?.id, cat('низ')?.id, cat('обувь')?.id]
  if (T <= 6 && cat('верхняя одежда')) ids.push(cat('верхняя одежда').id)
  let out = { ids: ids.filter(Boolean), name: 'Спокойный день', explanation: 'Вещи в одной гамме и по сезону' }
  if (MOCK === 'sloppy') out = { ids: [rows[0].id, rows[0].id, 'zzz'], name: 'Очень длинное название образа для теста', explanation: 'Это очень длинное пояснение которое точно длиннее ста двадцати знаков и ещё заканчивается точкой, а ещё оно слишком подробное.' }
  return { text: '```json\n' + JSON.stringify(out) + '\n```', inTok: Math.ceil(user.length / 3), outTok: 40, ms: 5 + Math.floor(rand() * 20) }
}

// ---- прогон
async function runCase(c) {
  const user = buildUserPrompt({ items: c.items, occasion: c.occasion, wish: c.wish, weather: c.weather, nogo: c.nogo, avoid: c.avoid })
  const res = { fails: [], ms: 0, inTok: 0, outTok: 0, reasonTok: 0, cut: 0, attempts: 0, ok1: false, okAfterRetry: false, clean: true, raw: '' }
  for (let attempt = 1; attempt <= 2; attempt++) {
    res.attempts = attempt
    let r
    try { r = await callModel(SYSTEM, user) } catch (e) { res.error = String(e.message); res.fails = ['api: ' + res.error]; continue }
    res.ms += r.ms; res.inTok += r.inTok ?? 0; res.outTok += r.outTok ?? 0; res.reasonTok += r.reasonTok ?? 0; res.cut += r.cut ? 1 : 0; res.raw = r.text
    if (attempt === 1) res.clean = /^\s*\{[\s\S]*\}\s*$/.test(r.text)
    let parsed
    try { parsed = parseOutfit(r.text, c.items); if (env.EVAL_NO_REPAIR !== '1') parsed = repairOutfit(parsed, c.items, { weather: c.weather, occasion: c.occasion, nogo: c.nogo }) } catch (e) { res.fails = ['parse: ' + e.message]; continue }
    const byId = new Map(c.items.map((i) => [i.id, i]))
    const chosen = parsed.ids.map((id) => byId.get(id))
    const rawExpl = (() => { try { return String(JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]).explanation ?? '') } catch { return '' } })()
    const o = { ...parsed, chosen, cats: chosen.map((i) => i.category), rawExplanation: rawExpl }
    const fails = Object.entries(CHECKS).map(([k, f]) => { const m = f(c, o); return m ? `${k}: ${m}` : null }).filter(Boolean)
    res.fails = fails; res.out = parsed
    if (!fails.length) { if (attempt === 1) res.ok1 = true; res.okAfterRetry = true; break }
    // как в проде: повтор только при ошибке разбора, но для оценки считаем и повтор по правилам
    if (attempt === 1 && fails.every((f) => !f.startsWith('parse'))) continue
  }
  return res
}

const cases = Array.from({ length: N }, (_, i) => makeCase(i))
const results = new Array(N)
let next = 0
await Promise.all(Array.from({ length: CONC }, async () => { while (next < N) { const i = next++; results[i] = await runCase(cases[i]); process.stderr.write(`\r${i + 1}/${N}`) } }))
process.stderr.write('\n')

// ---- отчёт
const pct = (x, n) => `${Math.round((100 * x) / n)}%`
const ok1 = results.filter((r) => r.ok1).length
const okR = results.filter((r) => r.okAfterRetry).length
const parseFail = results.filter((r) => r.fails.some((f) => f.startsWith('parse'))).length
const apiFail = results.filter((r) => r.error).length
const clean = results.filter((r) => r.clean).length
const byCheck = {}
for (const r of results) for (const f of r.fails) { const k = f.split(':')[0]; byCheck[k] = (byCheck[k] ?? 0) + 1 }
const lat = results.map((r) => r.ms / Math.max(1, r.attempts)).sort((a, b) => a - b)
const q = (p) => Math.round(lat[Math.min(lat.length - 1, Math.floor(p * lat.length))] ?? 0)
const sum = (k) => results.reduce((s, r) => s + r[k], 0)
const tokIn = sum('inTok') / N, tokOut = sum('outTok') / N
const rubOne = (tokIn * PRICE_IN + tokOut * PRICE_OUT) / 1e6
const perMonth = rubOne * OUTFITS * USERS

console.log(`\nМодель: ${MODEL}${MOCK ? ' (макет, не настоящая)' : ''}   случаев: ${N}   температура: ${TEMP}`)
console.log('────────────────────────────────────────────')
console.log(`Верно с первого раза:        ${ok1}/${N} (${pct(ok1, N)})`)
console.log(`Верно с учётом одного повтора: ${okR}/${N} (${pct(okR, N)})   ← это увидит пользователь без запасного алгоритма`)
const solvIdx = cases.map((c, i) => (solvable(c) ? i : -1)).filter((i) => i >= 0)
const okSolv = solvIdx.filter((i) => results[i].okAfterRetry).length
const ok1Solv = solvIdx.filter((i) => results[i].ok1).length
console.log(`Из них решаемых случаев:     ${solvIdx.length}/${N} (в остальных гардероб не позволяет собрать образ без нарушений, это дефект теста, не модели)`)
console.log(`Среди решаемых: с первого раза ${ok1Solv}/${solvIdx.length} (${pct(ok1Solv, solvIdx.length)}), с учётом повтора ${okSolv}/${solvIdx.length} (${pct(okSolv, solvIdx.length)})   ← главная цифра`)
console.log(`Чистый JSON без обёртки:     ${pct(clean, N)}   (обёртку из тройных кавычек сервер срезает, это не ошибка)`)
console.log(`Ошибки разбора / API:        ${parseFail} / ${apiFail}`)
console.log(`Скорость на запрос:          p50 ${q(0.5)} мс, p95 ${q(0.95)} мс`)
console.log(`Токены на образ:             ${Math.round(tokIn)} вход, ${Math.round(tokOut)} выход (из них рассуждение ${Math.round(sum('reasonTok') / N)})`)
if (sum('cut')) console.log(`⚠ Ответ обрезан по лимиту токенов в ${sum('cut')} запросах: модель «думает» и не успевает ответить. Подними EVAL_MAX_TOKENS или выключи рассуждение через EVAL_EXTRA.`)
if (PRICE_IN || PRICE_OUT) console.log(`Цена образа:                 ${rubOne.toFixed(4)} ₽   →   ${perMonth.toFixed(1)} ₽ в месяц (${USERS} польз. × ${OUTFITS} образов)`)
console.log('Где ошибается (число случаев):', Object.keys(byCheck).length ? JSON.stringify(byCheck) : 'нигде')

const bad = results.map((r, i) => [i, r]).filter(([, r]) => !r.okAfterRetry).slice(0, 5)
if (bad.length) { console.log('\nПримеры провалов:'); for (const [i, r] of bad) console.log(`  #${i + 1} ${cases[i].occasion}, ${cases[i].weather.temp}°C, пожелание «${cases[i].wish ?? '-'}»: ${r.fails.join('; ')}`) }
const good = results.filter((r) => r.out).slice(0, 6)
if (good.length) { console.log('\nПримеры ответов (прочти глазами: звучит ли это по-человечески):'); for (const r of good) console.log(`  «${r.out.name}»: ${r.out.explanation}`) }

mkdirSync('.ai-eval', { recursive: true })
const file = `.ai-eval/${MODEL.replace(/[^\w.-]+/g, '_')}.json`
writeFileSync(file, JSON.stringify({ model: MODEL, n: N, ok1, okAfterRetry: okR, solvable: solvIdx.length, ok1Solvable: ok1Solv, okAfterRetrySolvable: okSolv, byCheck, p50: q(0.5), p95: q(0.95), tokIn, tokOut, rubOne, perMonth, results: results.map((r, i) => ({ case: { occasion: cases[i].occasion, weather: cases[i].weather, wish: cases[i].wish, nogo: cases[i].nogo, avoid: cases[i].avoid, items: cases[i].items.length }, ...r })) }, null, 1))
console.log(`\nПодробности: ${file}`)
