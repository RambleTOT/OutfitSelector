import { COLORS } from '../data/catalog'

/** Читает фото с устройства, уменьшает и «вырезает» вещь: фон, связанный с краями и близкий к цвету краёв, становится прозрачным */
export async function cutOutPhoto(file: File, max = 280): Promise<{ dataUrl: string; colorName: string }> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file)).catch(() => null)
  if (!bmp) throw new Error('image')
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.max(8, Math.round(bmp.width * k))
  const h = Math.max(8, Math.round(bmp.height * k))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  // эталон фона: среднее по рамке в 2 px
  let r0 = 0, g0 = 0, b0 = 0, n0 = 0
  const edge = (x: number, y: number) => { const i = (y * w + x) * 4; r0 += d[i]; g0 += d[i + 1]; b0 += d[i + 2]; n0++ }
  for (let x = 0; x < w; x++) { edge(x, 0); edge(x, h - 1); edge(x, 1); edge(x, h - 2) }
  for (let y = 0; y < h; y++) { edge(0, y); edge(w - 1, y); edge(1, y); edge(w - 2, y) }
  r0 /= n0; g0 /= n0; b0 /= n0
  const dist = (i: number) => Math.hypot(d[i] - r0, d[i + 1] - g0, d[i + 2] - b0)

  const bg = new Uint8Array(w * h)
  const stack: number[] = []
  const T = 46
  const push = (p: number) => { if (!bg[p] && dist(p * 4) < T) { bg[p] = 1; stack.push(p) } }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (stack.length) {
    const p = stack.pop()!
    const x = p % w
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (p >= w) push(p - w)
    if (p < w * (h - 1)) push(p + w)
  }
  // мягкий край: пиксели рядом с фоном получают частичную прозрачность
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (bg[p]) { d[p * 4 + 3] = 0; continue }
      if (bg[p - 1] || bg[p + 1] || bg[p - w] || bg[p + w]) d[p * 4 + 3] = 150
    }
  }

  // доминирующий цвет по непрозрачным пикселям центральной части
  let r = 0, g = 0, b = 0, n = 0
  for (let y = Math.floor(h * 0.2); y < h * 0.8; y++) {
    for (let x = Math.floor(w * 0.2); x < w * 0.8; x++) {
      const i = (y * w + x) * 4
      if (d[i + 3] < 200) continue
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++
    }
  }
  ctx.putImageData(img, 0, 0)
  const avg: [number, number, number] = n ? [r / n, g / n, b / n] : [r0, g0, b0]
  // WebP с прозрачностью втрое легче PNG: в localStorage помещается больше вещей. Если браузер не умеет кодировать WebP, вернётся PNG
  const webp = c.toDataURL('image/webp', 0.88)
  return { dataUrl: webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png'), colorName: nearestColor(avg) }
}

const parse = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]

export function nearestColor([r, g, b]: [number, number, number]): string {
  let best = COLORS[0]
  let bd = Infinity
  for (const c of COLORS) {
    const [cr, cg, cb] = parse(c.hex)
    const dd = (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2
    if (dd < bd) { bd = dd; best = c }
  }
  return best.name
}

const NOT_CLOTHES = /coffee|cup|mug|food|dog|cat|car|pizza|кружк|кофе|еда|собак|кот|машин|не.?одежд/i

/** В прототипе «не одежду» узнаём по имени файла: кружка, кофе, еда, собака, кот */
export const looksLikeNotClothing = (file: File) => NOT_CLOTHES.test(file.name)
