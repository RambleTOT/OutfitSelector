// Поиск свободных фото одежды через Openverse (CC0 и другие свободные лицензии), с контактными листами.
// Использование: node tools/openverse-search.mjs <папка-для-данных> [id1,id2] [источник]
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
const only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null
const source = process.argv[4] || 'rawpixel'
mkdirSync(out, { recursive: true })

const QUERIES = {
  i01: 'white t-shirt', i02: 'blue shirt', i03: 'grey sweater', i04: 'black hoodie', i05: 'green hoodie', i06: 'striped t-shirt',
  i07: 'burgundy sweater', i08: 'trench coat', i09: 'black blazer', i10: 'blue jacket', i11: 'grey coat', i12: 'blue jeans',
  i13: 'black trousers', i14: 'beige chinos pants', i15: 'black skirt', i16: 'denim shorts', i17: 'green dress', i18: 'white sneakers',
  i19: 'black loafers', i20: 'brown boots', i21: 'black handbag', i22: 'brown leather bag', i23: 'grey scarf', i24: 'black cap',
}
const UA = { 'User-Agent': 'AtelierPrototype/1.0 (student startup demo)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const [id, q] of Object.entries(QUERIES)) {
  if (only && !only.includes(id)) continue
  const suffix = process.argv[5] ?? ''
  const url = 'https://api.openverse.org/v1/images/?' + new URLSearchParams({ q: q + suffix, source, license_type: 'commercial', page_size: '20', mature: 'false' })
  let r = null
  for (let t = 0; t < 3 && !r; t++) {
    const resp = await fetch(url, { headers: UA })
    if (resp.status === 429) { await sleep(20000); continue }
    r = await resp.json().catch(() => null)
  }
  const cands = (r?.results ?? []).filter((x) => (x.width ?? 0) >= 500 && (x.height ?? 0) >= 500).slice(0, 12).map((x) => ({
    title: x.title, url: x.url, thumb: x.thumbnail, license: x.license, version: x.license_version, creator: x.creator, landing: x.foreign_landing_url, source: x.source, w: x.width, h: x.height,
  }))
  const tiles = []
  for (let i = 0; i < cands.length; i++) {
    try {
      const buf = Buffer.from(await (await fetch(cands[i].thumb, { headers: UA })).arrayBuffer())
      const img = await sharp(buf).flatten({ background: '#ffffff' }).resize(260, 260, { fit: 'contain', background: '#fff' }).jpeg({ quality: 80 }).toBuffer()
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><rect x="6" y="6" width="34" height="28" rx="6" fill="#111"/><text x="23" y="26" font-size="20" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${i}</text></svg>`)
      tiles.push({ input: await sharp(img).composite([{ input: label }]).toBuffer(), left: (i % 6) * 264, top: Math.floor(i / 6) * 264 })
    } catch { /* пропускаем битый файл */ }
  }
  if (tiles.length) await sharp({ create: { width: 6 * 264, height: Math.ceil(tiles.length / 6) * 264, channels: 3, background: '#ddd' } }).composite(tiles).jpeg({ quality: 76 }).toFile(join(out, `${id}.jpg`))
  writeFileSync(join(out, `${id}.json`), JSON.stringify(cands, null, 1))
  console.log(id, q, '->', cands.length)
  await sleep(3500)
}
