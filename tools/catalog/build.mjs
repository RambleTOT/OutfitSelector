// Собирает каталог красивых фото вещей: public/catalog/*.webp и public/catalog/index.json.
//
//   node tools/catalog/build.mjs --source=generate --vision=http://127.0.0.1:7100 [--limit=20] [--only=tee]
//
// Источники картинок (--source):
//   generate  генерация студийных фото моделью изображений через OpenAI-совместимый API (IMAGE_API_URL, IMAGE_API_KEY, IMAGE_MODEL, IMAGE_AUTH).
//             Yandex AI Studio (Alice AI ART): IMAGE_API_URL=https://ai.api.cloud.yandex.net/v1  IMAGE_MODEL=art://<id каталога>/aliceai-image-art-3.0  IMAGE_AUTH=Api-Key
//             Права на картинки наши, единый стиль, цвет и крой точно как в списке. Рекомендуемый вариант, ~200 фото = несколько долларов
//   yandex    YandexART через Yandex AI Studio (YANDEX_API_KEY, YANDEX_FOLDER_ID), оплата в рублях, 10 бесплатных запросов в день в консоли
//   pexels    поиск свободных фото на Pexels (PEXELS_API_KEY, бесплатный ключ). Лицензия разрешает коммерческое использование,
//             автор и ссылка сохраняются в credit. Качество разное, нужна ручная проверка contact sheet
//   dir       свои фото из tools/catalog/inbox/<id>.jpg (например, купленный пак студийных фото)
//
// Каждая картинка проходит наш сервис распознавания (vision): фон убирается, свет выравнивается, вещь по центру квадрата. Если сервис
// не нашёл вещь или определил другой вид, позиция пропускается и попадает в tools/catalog/rejected.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const source = args.source ?? 'generate'
const vision = (args.vision ?? process.env.VISION_URL ?? 'http://127.0.0.1:7100').replace(/\/$/, '')
const limit = Number(args.limit ?? 1e9)
const out = join(root, 'public', 'catalog')
mkdirSync(out, { recursive: true })

let all = JSON.parse(readFileSync(join(here, 'list.json'), 'utf8')).filter((e) => !args.only || e.id.includes(args.only))
// --diverse: по кругу берём разные виды (type), чтобы первые N были максимально разными: обувь, низ, верх, аксессуары
if (args.diverse) {
  const groups = new Map()
  for (const e of all) { if (!groups.has(e.type)) groups.set(e.type, []); groups.get(e.type).push(e) }
  const byCat = new Map()
  for (const [, g] of groups) { const c = g[0].category; if (!byCat.has(c)) byCat.set(c, []); byCat.get(c).push(g) }
  const mixed = []
  for (let i = 0; mixed.length < all.length; i++) {
    let any = false
    for (const [, gs] of byCat) { const g = gs[i % gs.length]; const k = Math.floor(i / gs.length); if (g[k]) { mixed.push(g[k]); any = true } }
    if (!any && i > 400) break
  }
  all = mixed
}
const list = all.slice(0, limit)
const indexPath = join(out, 'index.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []
const have = new Set(index.map((e) => e.id))
const rejected = []

async function fetchImage(e) {
  if (source === 'generate') {
    const base = (process.env.IMAGE_API_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    const r = await fetch(`${base}/images/generations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `${process.env.IMAGE_AUTH ?? 'Bearer'} ${process.env.IMAGE_API_KEY}`, ...(process.env.IMAGE_PROJECT ? { 'OpenAI-Project': process.env.IMAGE_PROJECT } : {}) },
      body: JSON.stringify({ model: process.env.IMAGE_MODEL ?? 'gpt-image-1', prompt: e.prompt, size: '1024x1024', n: 1 }),
    })
    if (!r.ok) throw new Error(`images ${r.status} ${(await r.text()).slice(0, 120)}`)
    const j = await r.json()
    const d = j.data?.[0]
    if (d?.b64_json) return { bytes: Buffer.from(d.b64_json, 'base64') }
    if (d?.url) return { bytes: Buffer.from(await (await fetch(d.url)).arrayBuffer()) }
    throw new Error('нет картинки в ответе')
  }
  if (source === 'yandex') {
    const H = { 'Content-Type': 'application/json', Authorization: `Api-Key ${process.env.YANDEX_API_KEY}` }
    const start = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync', {
      method: 'POST', headers: H,
      body: JSON.stringify({ modelUri: `art://${process.env.YANDEX_FOLDER_ID}/yandex-art/latest`, generationOptions: { seed: Math.floor(Math.random() * 1e6), aspectRatio: { widthRatio: 1, heightRatio: 1 } }, messages: [{ weight: 1, text: e.prompt }] }),
    })
    if (!start.ok) throw new Error(`yandex ${start.status} ${(await start.text()).slice(0, 120)}`)
    const op = await start.json()
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      const st = await fetch(`https://operation.api.cloud.yandex.net/operations/${op.id}`, { headers: H })
      const j = await st.json()
      if (j.done) {
        if (j.error) throw new Error('yandex: ' + JSON.stringify(j.error).slice(0, 120))
        return { bytes: Buffer.from(j.response.image, 'base64') }
      }
    }
    throw new Error('yandex: долго ждали')
  }
  if (source === 'pexels') {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(e.query)}&per_page=8&orientation=square`, { headers: { Authorization: process.env.PEXELS_API_KEY } })
    if (!r.ok) throw new Error(`pexels ${r.status}`)
    const p = (await r.json()).photos?.[0]
    if (!p) throw new Error('ничего не нашли')
    return { bytes: Buffer.from(await (await fetch(p.src.large2x)).arrayBuffer()), credit: `${p.photographer}, Pexels, ${p.url}` }
  }
  if (source === 'dir') {
    const f = ['jpg', 'jpeg', 'png', 'webp'].map((x) => join(here, 'inbox', `${e.id}.${x}`)).find(existsSync)
    if (!f) throw new Error('нет файла в inbox')
    return { bytes: readFileSync(f) }
  }
  throw new Error('неизвестный источник ' + source)
}

async function analyze(bytes) {
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'photo')
  // сервис распознавания обрабатывает по одной картинке: при 503 («занят») ждём и пробуем снова
  for (let t = 0; t < 20; t++) {
    const r = await fetch(`${vision}/analyze`, { method: 'POST', body: form })
    if (r.status === 503) { await new Promise((ok) => setTimeout(ok, 2500 + Math.random() * 2500)); continue }
    if (!r.ok) throw new Error(`vision ${r.status}`)
    return r.json()
  }
  throw new Error('vision занят')
}

async function processOne(e) {
  if (have.has(e.id)) return
  try {
    // сеть (VPN, туннель) иногда рвётся: повторяем до 4 раз
    const retry = async (fn) => { for (let t = 0; ; t++) { try { return await fn() } catch (er) { if (t >= 3 || !/fetch failed|terminated|ECONN|socket/i.test(String(er.message ?? er) + String(er.cause ?? ''))) throw er; await new Promise((ok) => setTimeout(ok, 3000 * (t + 1))) } } }
    const { bytes, credit } = await retry(() => fetchImage(e))
    const res = await retry(() => analyze(bytes))
    const it = res.items?.[0]
    if (!it) { rejected.push({ id: e.id, why: 'вещь не найдена' }); console.log('—', e.id, 'не найдена'); return }
    // вид должен совпасть с заказанным (рюкзак и сумка считаем одним видом)
    // близкие виды путаются (кеды и кроссовки, куртка и пальто, свитер и свитшот): принимаем их как тот же вид, название и вид берём из списка
    const SAME = [['кеды', 'кроссовки', 'лоферы', 'ботинки'], ['куртка', 'пальто', 'тренч', 'пиджак'], ['свитер', 'свитшот', 'худи', 'лонгслив'], ['футболка', 'рубашка'], ['джинсы', 'брюки']]
    const ok = it.type === e.type || (e.category === it.category && ['сумка', 'рюкзак', 'шарф', 'кепка', 'шляпа'].includes(e.type)) || SAME.some((g) => g.includes(it.type) && g.includes(e.type))
    if (!ok && !e.force) { rejected.push({ id: e.id, why: `определили как ${it.type}` }); console.log('—', e.id, 'определили как', it.type); return }
    const b64 = it.cutout.split(',')[1]
    writeFileSync(join(out, `${e.id}.webp`), Buffer.from(b64, 'base64'))
    const { query, prompt, force, ...entry } = e
    index.push({ ...entry, img: `/catalog/${e.id}.webp`, ...(credit ? { credit } : {}) })
    writeFileSync(indexPath, JSON.stringify(index))
    console.log('✓', e.id)
  } catch (err) { rejected.push({ id: e.id, why: String(err.message ?? err) }); console.log('✗', e.id, String(err.message ?? err).slice(0, 100)) }
}
// несколько запросов одновременно (по умолчанию 4): генерация одной картинки занимает секунд 20–40
const queue = list.slice()
await Promise.all(Array.from({ length: Number(args.jobs ?? 4) }, async () => { while (queue.length) await processOne(queue.shift()) }))
writeFileSync(join(here, 'rejected.json'), JSON.stringify(rejected, null, 1))
console.log(`готово: в каталоге ${index.length}, отклонено ${rejected.length}`)
