// Записывает ролик: сцена video/stage + приложение из dist, управляются Playwright.
// Запуск: npm run build && node tools/build-stage.mjs && node tools/record-video.mjs <папка-вывода>
import { chromium } from 'playwright-core'
import http from 'node:http'
import { createReadStream, existsSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const OUT = process.argv[2] ?? 'video/out'
mkdirSync(OUT, { recursive: true })
const PORT = 4180
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0])
  const base = url.startsWith('/app/') || url === '/app' ? 'dist' : 'video/stage'
  if (base === 'dist') url = url.replace(/^\/app/, '') || '/'
  if (url.endsWith('/')) url += 'index.html'
  const file = normalize(join(base, url))
  if (!file.startsWith(base) || !existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; res.end('404'); return }
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(res)
}).listen(PORT)

const TOTAL = 60.5
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-device-scale-factor=1'] })
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto(`http://localhost:${PORT}/index.html`)
await page.evaluate(() => document.fonts.ready)

const frame = page.frames().find((f) => f.url().includes('/app/'))
const F = page.frameLocator('#app')
await frame.waitForFunction(() => window.__atelier)

// --- подготовка приложения: демо-гардероб, подсказки уже показаны, свободный тариф
await frame.evaluate(() => {
  const a = window.__atelier.app.getState()
  a.resetDemo()
  window.__atelier.app.getState().setTheme('light')
  window.__atelier.app.getState().skipOnboarding()
  window.__atelier.app.setState({ name: 'Анна', quiz: { who: 'Женская', city: 'Москва', occasions: ['Работа'], styles: [], nogo: [] } })
  for (const k of ['coach-outfit', 'coach-wardrobe', 'coach-favorites', 'coach-profile', 'install-offered', 'outfit-visited']) window.__atelier.app.getState().markSeen(k)
})
await frame.evaluate(() => { location.hash = '#/wardrobe' })
await page.waitForTimeout(1500)

// --- часы ролика
let t0 = 0
const T = () => (Date.now() - t0) / 1000
const until = async (s) => { const d = s - T(); if (d > 0) await page.waitForTimeout(d * 1000); else if (d < -0.6) console.log(`  ! опоздание ${(-d).toFixed(1)} с на ${s}`) }
const log = (m) => console.log(`[${T().toFixed(1)}] ${m}`)
const safe = async (name, fn) => { try { await fn() } catch (e) { console.log(`  ! ${name}: ${String(e.message).split('\n')[0]}`) } }

const center = async (loc, dx = 0, dy = 0) => {
  const b = await loc.boundingBox({ timeout: 4000 })
  if (!b) throw new Error('нет bbox')
  return { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 + dy }
}
const tap = async (loc, opts = {}) => {
  const { x, y } = await center(loc, opts.dx, opts.dy)
  await page.evaluate(([a, b]) => window.stage.tap(a, b), [x, y])
  await page.waitForTimeout(200)
  await page.mouse.click(x, y)
  await page.waitForTimeout(opts.after ?? 350)
}
const drag = async (from, to, ms = 700) => {
  await page.evaluate(([a, b]) => window.stage.tap(a, b), [from.x, from.y])
  await page.waitForTimeout(150)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  const n = Math.max(12, Math.round(ms / 22))
  for (let i = 1; i <= n; i++) {
    const k = i / n, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    await page.mouse.move(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e)
    await page.waitForTimeout(ms / n)
  }
  await page.mouse.up()
}
const scrollTo = (top, ms = 1200) => F.locator('.screen').first().evaluate((el, [t, d]) => new Promise((r) => {
  const s = el.scrollTop, t0 = performance.now()
  const f = (n) => { const p = Math.min(1, (n - t0) / d); el.scrollTop = s + (t - s) * (1 - Math.pow(1 - p, 3)); p < 1 ? requestAnimationFrame(f) : r() }
  requestAnimationFrame(f)
}), [top, ms])

// ===== запись кадров через CDP-скринкаст (системный ffmpeg соберёт видео)
const FR = join(OUT, 'frames')
rmSync(FR, { recursive: true, force: true })
mkdirSync(FR, { recursive: true })
const cdp = await ctx.newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async (ev) => {
  const i = frames.length
  frames.push({ t: ev.metadata.timestamp })
  writeFileSync(join(FR, `f${String(i).padStart(6, '0')}.jpg`), Buffer.from(ev.data, 'base64'))
  await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
await page.waitForTimeout(400)

// ===== старт
t0 = Date.now()
await page.evaluate((total) => { const s = performance.now(); const f = () => { window.stage.progress(Math.min(1, (performance.now() - s) / 1000 / total)); requestAnimationFrame(f) }; f() }, TOTAL)
await page.evaluate(() => window.stage.intro())
log('интро')

// ===== 1. Гардероб
await until(3.0)
await page.evaluate(() => window.stage.go('wardrobe'))
log('гардероб')
await until(4.7)
await safe('scroll', () => scrollTo(420, 1300))
await until(6.2)
await safe('scroll up', () => scrollTo(0, 700))
await until(7.1)
await safe('search', async () => {
  await tap(F.locator('.field__input'), { after: 200 })
  await F.locator('.field__input').pressSequentially('джинс', { delay: 140 })
})
await until(9.0)
await safe('clear', async () => { await F.locator('.field__input').fill('') })
await until(9.4)
await safe('filter', async () => {
  await tap(F.locator('button.fbtn', { hasText: 'Цвет' }), { after: 650 })
  await tap(F.locator('.sw[aria-label="Синий"]'), { after: 450 })
})
await until(10.9)
await safe('close filter', async () => { await tap(F.locator('.sheet .btn', { hasText: 'Показать' }), { after: 350 }) })
await until(11.5)
await safe('reset', async () => { await tap(F.locator('button', { hasText: 'Сбросить' }).first(), { after: 250 }) })

// ===== 2. Фото → вещь
await until(12.0)
await page.evaluate(() => window.stage.go('photo'))
log('фото')
await until(12.9)
await safe('fab', async () => { await tap(F.locator('.fab'), { after: 550 }) })
await until(13.9)
await safe('sfotkat', async () => { await tap(F.locator('.answer', { hasText: 'Сфоткать' }), { after: 800 }) })
await until(15.0)
await safe('upload', async () => { await F.locator('input[capture]').setInputFiles('video/stage/assets/photos/sneakers-orange.jpg') })
await until(18.5)
await safe('save item', async () => { await tap(F.locator('.cta-plate .btn', { hasText: 'Сохранить' }), { after: 350 }) })

// ===== 3. Образ
await until(19.4)
await page.evaluate(() => window.stage.go('outfit'))
log('образ')
await until(21.0)
await safe('tab outfit', async () => { await tap(F.locator('.tabbar__btn', { hasText: 'Образ' }), { after: 500 }) })
await until(22.0)
await safe('wish', async () => { await tap(F.locator('.chip', { hasText: 'Что-то яркое' }), { after: 350 }) })
await until(22.9)
await safe('build', async () => { await tap(F.locator('.bottom-actions .btn', { hasText: 'Собрать образ' }), { after: 200 }) })
log('ждём результат')
await until(26.6)
await safe('replace', async () => { await tap(F.locator('.tool', { hasText: 'Заменить вещь' }), { after: 900 }) })
await until(27.9)
await safe('pick', async () => { await tap(F.locator('.sheet .tile__btn').nth(0), { after: 450 }) })
await until(28.7)
await safe('replace ok', async () => { await tap(F.locator('.sheet .btn', { hasText: 'Заменить' }), { after: 450 }) })
await until(29.9)
await safe('other', async () => { await tap(F.locator('.tool', { hasText: 'Другой вариант' }), { after: 200 }) })

// ===== 4. Избранное
await until(32.6)
await page.evaluate(() => window.stage.go('favorites'))
log('избранное')
await until(34.2)
await safe('save', async () => { await tap(F.locator('.cta-plate .btn', { hasText: 'Сохранить' }), { after: 300 }) })
await until(35.6)
await safe('to favorites', async () => { await frame.evaluate(() => { location.hash = '#/favorites' }) })
await until(36.9)
await safe('open saved', async () => { await tap(F.locator('.saved-card').first(), { after: 450 }) })

// ===== 5. Конструктор
await until(38.2)
await page.evaluate(() => window.stage.go('constructor'))
log('конструктор')
await until(39.8)
await safe('edit', async () => { await tap(F.locator('.btn', { hasText: 'Редактировать' }), { after: 900 }) })
await until(41.2)
await safe('drag item', async () => {
  const c = await center(F.locator('.ci').nth(1))
  await drag(c, { x: c.x - 70, y: c.y + 40 }, 800)
})
await until(42.4)
await safe('rotate', async () => {
  const h = await center(F.locator('.ci__hit').first())
  await drag(h, { x: h.x + 90, y: h.y + 30 }, 800)
})
await until(43.6)
await safe('scale', async () => {
  const h = await center(F.locator('.ci__hit').nth(1))
  await drag(h, { x: h.x + 40, y: h.y + 50 }, 700)
})
await until(44.6)
await safe('bg', async () => { await tap(F.locator('.cv__bg button[aria-label="Песочный"]'), { after: 450 }) })
await until(45.4)
await safe('drag from dock', async () => {
  const t = await center(F.locator('.dock__strip .dock__tile').nth(9))
  const cv = await center(F.locator('.cv'))
  await drag(t, { x: cv.x + 40, y: cv.y - 40 }, 1000)
})
await until(47.1)
await safe('save constructor', async () => { await tap(F.locator('button[aria-label="Сохранить"]'), { after: 350 }) })

// ===== 6. Тарифы
await until(48.0)
await page.evaluate(() => window.stage.go('plans'))
log('тарифы')
await until(48.6)
await safe('profile', async () => { await frame.evaluate(() => { location.hash = '#/profile' }) })
await until(50.0)
await safe('more', async () => { await tap(F.locator('.btn', { hasText: 'Больше с подпиской' }), { after: 550 }) })
await until(51.6)
await safe('agree', async () => { await tap(F.locator('.check'), { after: 300 }) })
await until(52.4)
await safe('pay', async () => { await tap(F.locator('.pay-btn'), { after: 300 }) })

// ===== финал
await until(55.4)
await frame.evaluate(() => { window.__atelier.app.getState().setTheme('dark'); location.hash = '#/favorites' })
await page.evaluate(() => { window.stage.darkApp(true); window.stage.outro() })
log('финал')
await until(TOTAL)

await cdp.send('Page.stopScreencast')
await page.waitForTimeout(300)
// список кадров для ffmpeg (concat) с реальными длительностями; кадры до старта отбрасываем
const start = t0 / 1000
let list = ''
let kept = 0
for (let i = 0; i < frames.length; i++) {
  const end = i + 1 < frames.length ? frames[i + 1].t : frames[i].t + 0.04
  if (end <= start) continue
  const from = Math.max(frames[i].t, start)
  list += `file 'frames/f${String(i).padStart(6, '0')}.jpg'\nduration ${Math.max(0.001, end - from).toFixed(4)}\n`
  kept++
}
list += `file 'frames/f${String(frames.length - 1).padStart(6, '0')}.jpg'\n`
writeFileSync(join(OUT, 'frames.txt'), list)
console.log('frames', frames.length, 'kept', kept, 'длина', (frames.at(-1).t - start).toFixed(1), 'c')
await ctx.close()
await browser.close()
server.close()
