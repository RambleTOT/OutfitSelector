// Скачивает превью кандидатов Unsplash и собирает контактные листы с номерами: node tools/unsplash-sheets.mjs <cands.txt> <папка>
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [file, out] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => l.split('|'))
const by = {}
for (const [id, key, who] of rows) (by[id] ||= []).push({ key, who })

const T = 250
for (const [id, list] of Object.entries(by)) {
  const tiles = []
  for (let i = 0; i < list.length; i++) {
    try {
      const r = await fetch(`https://images.unsplash.com/photo-${list[i].key}?w=400&q=60&fm=jpg`)
      if (!r.ok) continue
      const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(T, T, { fit: 'contain', background: '#e9e9e9' }).jpeg({ quality: 78 }).toBuffer()
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><rect x="6" y="6" width="34" height="28" rx="6" fill="#111"/><text x="23" y="26" font-size="20" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${i}</text></svg>`)
      tiles.push({ input: await sharp(img).composite([{ input: label }]).toBuffer(), left: (i % 5) * (T + 4), top: Math.floor(i / 5) * (T + 4) })
    } catch { /* пропускаем */ }
  }
  if (tiles.length) await sharp({ create: { width: 5 * (T + 4), height: Math.ceil(list.length / 5) * (T + 4), channels: 3, background: '#cfcfcf' } }).composite(tiles).jpeg({ quality: 74 }).toFile(join(out, `${id}.jpg`))
  console.log(id, tiles.length)
}
