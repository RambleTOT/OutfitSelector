// Иконки и заставка для Android из public/icons: node scripts/build-android-assets.mjs
import sharp from 'sharp'
import { readdirSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const RES = 'android/app/src/main/res'
const SRC = 'public/icons/maskable-512.png'
const SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }

for (const [d, s] of Object.entries(SIZES)) {
  const dir = join(RES, `mipmap-${d}`)
  const sq = await sharp(SRC).resize(s, s).png().toBuffer()
  await sharp(sq).toFile(join(dir, 'ic_launcher.png'))
  const mask = Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`)
  await sharp(sq).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(join(dir, 'ic_launcher_round.png'))
  // адаптивная иконка: иконка с полями 18 %, чтобы маска не срезала знак
  const f = FG[d], inner = Math.round(f * 0.64)
  await sharp({ create: { width: f, height: f, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(SRC).resize(inner, inner).png().toBuffer(), gravity: 'center' }]).png().toFile(join(dir, 'ic_launcher_foreground.png'))
}
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`
writeFileSync(join(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive)
writeFileSync(join(RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive)
writeFileSync(join(RES, 'values/ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#C9443D</color>
</resources>`)

// заставка: фон приложения и знак по центру
for (const d of readdirSync(RES).filter((x) => x.startsWith('drawable'))) {
  const f = join(RES, d, 'splash.png')
  if (!existsSync(f)) continue
  const meta = await sharp(f).metadata()
  const w = meta.width, h = meta.height, s = Math.round(Math.min(w, h) * 0.28)
  await sharp({ create: { width: w, height: h, channels: 4, background: '#F4F4F6' } })
    .composite([{ input: await sharp('public/icons/icon-512.png').resize(s, s).png().toBuffer(), gravity: 'center' }]).png().toFile(f + '.tmp')
  await sharp(f + '.tmp').toFile(f)
  rmSync(f + '.tmp')
}
console.log('android assets ok')
