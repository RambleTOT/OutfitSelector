// Собирает каталог красивых фото вещей: public/catalog/*.webp и public/catalog/index.json.
//
//   node tools/catalog/build.mjs --source=generate --vision=http://127.0.0.1:7100 [--limit=20] [--only=tee]
//
// Источники картинок (--source):
//   generate  генерация студийных фото моделью изображений через OpenAI-совместимый API (IMAGE_API_URL, IMAGE_API_KEY, IMAGE_MODEL).
//             Права на картинки наши, единый стиль, цвет и крой точно как в списке. Рекомендуемый вариант, ~200 фото = несколько долларов
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

const list = JSON.parse(readFileSync(join(here, 'list.json'), 'utf8')).filter((e) => !args.only || e.id.includes(args.only)).slice(0, limit)
const indexPath = join(out, 'index.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []
const have = new Set(index.map((e) => e.id))
const rejected = []

async function fetchImage(e) {
  if (source === 'generate') {
    const base = (process.env.IMAGE_API_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    const r = await fetch(`${base}/images/generations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.IMAGE_API_KEY}` },
      body: JSON.stringify({ model: process.env.IMAGE_MODEL ?? 'gpt-image-1', prompt: e.prompt, size: '1024x1024', n: 1 }),
    })
    if (!r.ok) throw new Error(`images ${r.status} ${(await r.text()).slice(0, 120)}`)
    const j = await r.json()
    const d = j.data?.[0]
    if (d?.b64_json) return { bytes: Buffer.from(d.b64_json, 'base64') }
    if (d?.url) return { bytes: Buffer.from(await (await fetch(d.url)).arrayBuffer()) }
    throw new Error('нет картинки в ответе')
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
  const r = await fetch(`${vision}/analyze`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`vision ${r.status}`)
  return r.json()
}

for (const e of list) {
  if (have.has(e.id)) continue
  try {
    const { bytes, credit } = await fetchImage(e)
    const res = await analyze(bytes)
    const it = res.items?.[0]
    if (!it) { rejected.push({ id: e.id, why: 'вещь не найдена' }); console.log('—', e.id, 'не найдена'); continue }
    // вид должен совпасть с заказанным (рюкзак и сумка считаем одним видом)
    const ok = it.type === e.type || (e.category === it.category && ['сумка', 'рюкзак', 'шарф', 'кепка', 'шляпа'].includes(e.type))
    if (!ok) { rejected.push({ id: e.id, why: `определили как ${it.type}` }); console.log('—', e.id, 'определили как', it.type); continue }
    const b64 = it.cutout.split(',')[1]
    writeFileSync(join(out, `${e.id}.webp`), Buffer.from(b64, 'base64'))
    const { query, prompt, ...entry } = e
    index.push({ ...entry, img: `/catalog/${e.id}.webp`, ...(credit ? { credit } : {}) })
    writeFileSync(indexPath, JSON.stringify(index))
    console.log('✓', e.id)
  } catch (err) { rejected.push({ id: e.id, why: String(err.message ?? err) }); console.log('✗', e.id, String(err.message ?? err).slice(0, 100)) }
}
writeFileSync(join(here, 'rejected.json'), JSON.stringify(rejected, null, 1))
console.log(`готово: в каталоге ${index.length}, отклонено ${rejected.length}`)
