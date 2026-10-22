// Контактный лист результатов на светло-сером фоне: node tools/sheet-cutouts.mjs <папка-png> <выход.jpg>
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
const [dir, out] = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
const T = 220
const tiles = []
for (let i = 0; i < files.length; i++) {
  const img = await sharp(join(dir, files[i])).resize(T, T).toBuffer()
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><rect x="4" y="4" width="46" height="22" rx="5" fill="#111"/><text x="27" y="20" font-size="14" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${files[i].replace('.png', '')}</text></svg>`)
  const bg = await sharp({ create: { width: T, height: T, channels: 3, background: '#EEEEF2' } }).composite([{ input: img }, { input: label }]).png().toBuffer()
  tiles.push({ input: bg, left: (i % 6) * (T + 4), top: Math.floor(i / 6) * (T + 4) })
}
await sharp({ create: { width: 6 * (T + 4), height: Math.ceil(files.length / 6) * (T + 4), channels: 3, background: '#cfcfcf' } }).composite(tiles).jpeg({ quality: 82 }).toFile(out)
