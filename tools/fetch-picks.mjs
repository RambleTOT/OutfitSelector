// Скачивает выбранные фото Unsplash крупно: node tools/fetch-picks.mjs <папка>
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const out = process.argv[2]
mkdirSync(out, { recursive: true })
const picks = JSON.parse(readFileSync(new URL('./picks.json', import.meta.url), 'utf8'))
const done = new Map()
for (const [id, p] of Object.entries(picks)) {
  const f = join(out, `src-${p.key}.jpg`)
  if (!done.has(p.key) && !existsSync(f)) {
    const r = await fetch(`https://images.unsplash.com/photo-${p.key}?w=1400&q=85&fm=jpg`)
    if (!r.ok) { console.log('FAIL', id, r.status); continue }
    writeFileSync(f, Buffer.from(await r.arrayBuffer()))
  }
  done.set(p.key, true)
  console.log('ok', id, p.key)
}
