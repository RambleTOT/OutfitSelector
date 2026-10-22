// Поиск кандидатов на Wikimedia Commons: для каждого запроса скачивает превью и собирает контактный лист с номерами.
// Использование: node tools/commons-search.mjs <папка-для-данных>
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
mkdirSync(out, { recursive: true })

const QUERIES = {
  i01: 'white t-shirt on white background',
  i02: 'blue dress shirt on white background',
  i03: 'grey sweater pullover white background',
  i04: 'black hoodie white background',
  i05: 'green hoodie white background',
  i06: 'striped t-shirt breton white background',
  i07: 'red burgundy sweater white background',
  i08: 'trench coat beige white background',
  i09: 'black blazer jacket white background',
  i10: 'blue bomber jacket white background',
  i11: 'grey wool coat white background',
  i12: 'blue jeans white background',
  i13: 'black trousers pants white background',
  i14: 'chino trousers beige white background',
  i15: 'black skirt white background',
  i16: 'denim shorts white background',
  i17: 'green dress white background',
  i18: 'white sneakers white background',
  i19: 'black loafers shoes white background',
  i20: 'brown leather boots white background',
  i21: 'black handbag white background',
  i22: 'brown leather handbag white background',
  i23: 'grey scarf white background',
  i24: 'black baseball cap white background',
}
const only = process.argv[3]?.split(',')

const api = (q) =>
  'https://commons.wikimedia.org/w/api.php?' +
  new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrsearch: `${q} filetype:bitmap`, gsrlimit: '24',
    prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '420', origin: '*',
  })

const UA = { 'User-Agent': 'AtelierPrototype/1.0 (student startup demo; contact: dufanfouran@gmail.com)' }
const ok = (lic) => /^(cc0|public domain|pd|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|cc-by)/i.test(lic) || /public domain|cc0|cc by/i.test(lic)

for (const [id, q] of Object.entries(QUERIES)) {
  if (only && !only.includes(id)) continue
  const r = await fetch(api(q), { headers: UA }).then((x) => x.json()).catch(() => null)
  const pages = Object.values(r?.query?.pages ?? {}).sort((a, b) => a.index - b.index)
  const cands = []
  for (const p of pages) {
    const ii = p.imageinfo?.[0]
    if (!ii || !/jpeg|png/.test(ii.mime)) continue
    const lic = ii.extmetadata?.LicenseShortName?.value ?? ''
    if (!ok(lic)) continue
    if (ii.width < 600 || ii.height < 600) continue
    cands.push({ title: p.title, url: ii.url, thumb: ii.thumburl, lic, author: (ii.extmetadata?.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(), page: ii.descriptionurl, w: ii.width, h: ii.height })
    if (cands.length >= 8) break
  }
  const tiles = []
  for (let i = 0; i < cands.length; i++) {
    try {
      const buf = Buffer.from(await (await fetch(cands[i].thumb, { headers: UA })).arrayBuffer())
      const img = await sharp(buf).resize(300, 300, { fit: 'contain', background: '#fff' }).jpeg({ quality: 80 }).toBuffer()
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect x="6" y="6" width="34" height="28" rx="6" fill="#111"/><text x="23" y="26" font-size="20" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${i}</text></svg>`)
      tiles.push({ input: await sharp(img).composite([{ input: label }]).toBuffer(), left: (i % 4) * 304, top: Math.floor(i / 4) * 304 })
    } catch { /* пропускаем битый файл */ }
  }
  if (tiles.length) {
    await sharp({ create: { width: 4 * 304, height: Math.ceil(tiles.length / 4) * 304, channels: 3, background: '#ddd' } }).composite(tiles).jpeg({ quality: 78 }).toFile(join(out, `${id}.jpg`))
  }
  writeFileSync(join(out, `${id}.json`), JSON.stringify(cands, null, 1))
  console.log(id, q, '->', cands.length)
  await new Promise((r) => setTimeout(r, 400))
}
