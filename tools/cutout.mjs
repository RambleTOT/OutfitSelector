// Вырезает вещь с фона: node tools/cutout.mjs <папка-с-исходниками> <папка-результата>
// Фон = область от краёв кадра, близкая по цвету к краям и ограниченная резкими границами. Остаётся самый большой объект.
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [srcDir, outDir] = process.argv.slice(2)
const only = process.argv[4]?.split(',')
mkdirSync(outDir, { recursive: true })
const picks = JSON.parse(readFileSync(new URL('./picks.json', import.meta.url), 'utf8'))
const SIZE = 512

async function cut(file, opt) {
  let img = sharp(file).rotate()
  const meta = await img.metadata()
  if (opt.crop) {
    const [l, t, w, h] = opt.crop
    img = img.extract({ left: Math.round(l * meta.width), top: Math.round(t * meta.height), width: Math.round(w * meta.width), height: Math.round(h * meta.height) })
  }
  const { data, info } = await img.resize({ width: 760, height: 760, fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height, n = w * h
  const px = (p, c) => data[p * 3 + c]

  // яркость и градиент (Собель) как барьер для заливки
  const lum = new Float32Array(n)
  for (let p = 0; p < n; p++) lum[p] = 0.299 * px(p, 0) + 0.587 * px(p, 1) + 0.114 * px(p, 2)
  const grad = new Float32Array(n)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x
    const gx = lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1] - lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1]
    const gy = lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1] - lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1]
    grad[p] = Math.hypot(gx, gy) / 4
  }

  // эталон фона: медиана по рамке
  const edge = []
  const m = Math.max(2, Math.round(Math.min(w, h) * 0.015))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < m || y < m || x >= w - m || y >= h - m) edge.push(y * w + x)
  const med = (c) => { const a = edge.map((p) => px(p, c)).sort((x, y) => x - y); return a[a.length >> 1] }
  let ref = [med(0), med(1), med(2)]
  if (opt.refPoint) { // цвет фона задан вручную: среднее по пятну 7x7 в точке (доли кадра)
    const cx = Math.round(opt.refPoint[0] * (w - 1)), cy = Math.round(opt.refPoint[1] * (h - 1))
    let r = 0, g = 0, b = 0, c = 0
    for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (x >= 0 && y >= 0 && x < w && y < h) { r += px(y * w + x, 0); g += px(y * w + x, 1); b += px(y * w + x, 2); c++ }
    ref = [r / c, g / c, b / c]
  }
  const dRef = (p) => Math.hypot(px(p, 0) - ref[0], px(p, 1) - ref[1], px(p, 2) - ref[2])
  const dPar = (p, q) => Math.hypot(px(p, 0) - px(q, 0), px(p, 1) - px(q, 1), px(p, 2) - px(q, 2))
  const T = opt.t ?? 34 // близость к эталону
  const G = opt.g ?? 22 // барьер резкой границы
  const S = opt.s ?? 7 // шаг плавного градиента фона
  const MAXD = opt.max ?? 95

  const bg = new Uint8Array(n)
  const stack = []
  const tryJoin = (p, q) => {
    if (bg[p]) return
    const dr = dRef(p)
    const ok = (dr < T && grad[p] < G * 1.6) || (grad[p] < G && dPar(p, q) < S && dr < MAXD)
    if (ok) { bg[p] = 1; stack.push(p) }
  }
  for (const p of edge) { if (!bg[p] && dRef(p) < MAXD) { bg[p] = 1; stack.push(p) } }
  while (stack.length) {
    const q = stack.pop()
    const x = q % w
    if (x > 0) tryJoin(q - 1, q)
    if (x < w - 1) tryJoin(q + 1, q)
    if (q >= w) tryJoin(q - w, q)
    if (q < n - w) tryJoin(q + w, q)
  }

  // самый большой связный объект переднего плана
  const label = new Int32Array(n)
  let best = 0, bestN = 0, id = 0
  for (let s = 0; s < n; s++) {
    if (bg[s] || label[s]) continue
    id++
    let cnt = 0
    const st = [s]
    label[s] = id
    while (st.length) {
      const q = st.pop(); cnt++
      const x = q % w
      for (const r of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, q >= w ? q - w : -1, q < n - w ? q + w : -1]) {
        if (r >= 0 && !bg[r] && !label[r]) { label[r] = id; st.push(r) }
      }
    }
    if (cnt > bestN) { bestN = cnt; best = id }
  }
  // оставляем самый большой объект и соседей крупнее доли keep от него (пара обуви, например)
  const sizes = new Map()
  for (let p = 0; p < n; p++) if (label[p]) sizes.set(label[p], (sizes.get(label[p]) ?? 0) + 1)
  const keepIds = new Set([...sizes].filter(([l, c]) => l === best || c >= bestN * (opt.keep ?? 1.01)).map(([l]) => l))
  const alpha = Buffer.alloc(n)
  for (let p = 0; p < n; p++) alpha[p] = keepIds.has(label[p]) ? 255 : 0

  // мягкий край
  const aRes = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).median(3).blur(1.1).linear(1.6, -90).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true })
  const a = aRes.data
  if (aRes.info.channels !== 1) throw new Error('alpha channels ' + aRes.info.channels)
  const rgba = Buffer.alloc(n * 4)
  for (let p = 0; p < n; p++) { rgba[p * 4] = px(p, 0); rgba[p * 4 + 1] = px(p, 1); rgba[p * 4 + 2] = px(p, 2); rgba[p * 4 + 3] = a[p] }
  const cutRaw = sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
  const trimmed = await cutRaw.png().toBuffer().then((b) => sharp(b).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true }))
  const k = Math.min((SIZE * 0.9) / trimmed.info.width, (SIZE * 0.9) / trimmed.info.height)
  const rw = Math.max(1, Math.round(trimmed.info.width * k)), rh = Math.max(1, Math.round(trimmed.info.height * k))
  const resized = await sharp(trimmed.data).resize(rw, rh).png().toBuffer()
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.round((SIZE - rw) / 2), top: Math.round((SIZE - rh) / 2) }])
    .png({ compressionLevel: 9, palette: true, quality: 92, effort: 8 })
}

for (const [id, p] of Object.entries(picks)) {
  if (only && !only.includes(id)) continue
  try {
    const out = await cut(join(srcDir, `src-${p.key}.jpg`), p)
    await out.toFile(join(outDir, `${id}.png`))
    console.log('ok', id)
  } catch (e) { console.log('FAIL', id, e.message) }
}
