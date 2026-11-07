// Скриншоты приложения для лендинга: node tools/shots.mjs (нужна сборка в dist)
import { chromium } from 'playwright-core'
import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import sharp from 'sharp'

const PORT = 4191
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0])
  if (url.endsWith('/')) url += 'index.html'
  const file = normalize(join('dist', url))
  if (!existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; res.end(); return }
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(res)
}).listen(PORT)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block' })
const page = await ctx.newPage()
await page.goto(`http://localhost:${PORT}/app/?demo`)
await page.waitForFunction(() => window.__atelier)
await page.evaluate(() => {
  const a = window.__atelier.app.getState()
  a.skipOnboarding()
  for (const k of ['coach-outfit', 'coach-wardrobe', 'coach-favorites', 'coach-profile', 'install-offered', 'outfit-visited']) a.markSeen(k)
  window.__atelier.app.setState({ plan: 'sub' })
})
const shot = async (name) => {
  const buf = await page.screenshot({ type: 'png' })
  await sharp(buf).resize(540).webp({ quality: 82 }).toFile(`public/landing/${name}.webp`)
  console.log(name)
}
const go = async (h, ms = 1000) => { await page.evaluate((x) => { location.hash = x }, h); await page.waitForTimeout(ms) }
await go('#/outfit'); await shot('outfit-home')
await page.locator('.bottom-actions .btn', { hasText: 'Собрать образ' }).click()
await page.waitForTimeout(4200); await shot('outfit-result')
await go('#/wardrobe', 1800); await shot('wardrobe')
await go('#/constructor', 1500); await shot('constructor')
await go('#/favorites', 1200); await shot('favorites')
await go('#/paywall', 1200); await shot('paywall')
await browser.close(); server.close()
