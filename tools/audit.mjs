// Автоматический аудит экранов: ошибки консоли, axe (контраст, имена, aria), размеры зон нажатия, мелкий текст, горизонтальный скролл.
// Запуск: npm run build && node tools/audit.mjs [ширина=390] > audit.json
import { chromium } from 'playwright-core'
import http from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const W = Number(process.argv[2] ?? 390)
const H = W === 360 ? 780 : 844
const PORT = 4190
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const root = existsSync('dist/app/index.html') ? 'dist' : 'dist'
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0])
  if (url.endsWith('/')) url += 'index.html'
  const file = normalize(join(root, url))
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.statusCode = 404; res.end('404'); return }
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(res)
}).listen(PORT)

const APP = existsSync('dist/app/index.html') ? '/app/' : '/'
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const ROUTES = [
  '#/login', '#/outfit', '#/wardrobe', '#/favorites', '#/profile', '#/item/i01', '#/profile/data', '#/profile/docs', '#/profile/subscription',
  '#/profile/delete', '#/paywall', '#/paywall/success', '#/paywall/error', '#/constructor', '#/add/template', '#/add/photo', '#/install', '#/install/notify',
  '#/favorites/seed1', '#/onboarding/quiz', '#/onboarding/items',
]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { width: W, console: [], routes: {} }
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block', colorScheme: theme })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.console.push(`[${theme}] ${m.type()}: ${m.text().slice(0, 200)}`) })
  page.on('pageerror', (e) => report.console.push(`[${theme}] pageerror: ${e.message}`))
  page.on('requestfailed', (r) => report.console.push(`[${theme}] requestfailed: ${r.url().slice(0, 120)}`))
  page.on('response', (r) => { if (r.status() >= 400) report.console.push(`[${theme}] HTTP ${r.status()} ${r.url().slice(0, 120)}`) })
  await page.goto(`http://localhost:${PORT}${APP}?demo`)
  await page.waitForFunction(() => window.__atelier)
  await page.evaluate((t) => {
    const a = window.__atelier.app.getState()
    a.skipOnboarding(); a.setTheme(t)
    for (const k of ['coach-outfit', 'coach-wardrobe', 'coach-favorites', 'coach-profile', 'install-offered']) a.markSeen(k)
    window.__atelier.app.setState({ plan: 'sub' })
  }, theme)
  for (const r of ROUTES) {
    if (r === '#/login') await page.evaluate(() => window.__atelier.app.setState({ signedIn: false }))
    else await page.evaluate(() => window.__atelier.app.setState({ signedIn: true, quizDone: true, onboarded: true }))
    if (r.startsWith('#/onboarding')) await page.evaluate(() => window.__atelier.app.setState({ signedIn: true, quizDone: false, onboarded: false }))
    await page.evaluate((h) => { location.hash = h }, r)
    await page.waitForTimeout(r === '#/wardrobe' ? 1500 : 900)
    await page.addScriptTag({ content: axeSrc }).catch(() => {})
    const res = await page.evaluate(async () => {
      const out = { small: [], tiny: [], noname: [], overflow: null, axe: [] }
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth }
      for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]):not([hidden]), textarea, [role=button], [role=switch], [role=checkbox], [role=tab]')) {
        if (!vis(el)) continue
        const r = el.getBoundingClientRect()
        const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.title || '').trim()
        const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')
        if ((r.width < 43.5 || r.height < 43.5) && !el.classList.contains('chip') && !el.classList.contains('fbtn') && !el.classList.contains('field__input')) out.small.push(`${tag} "${name.slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
        if (!name && el.tagName !== 'INPUT') out.noname.push(tag)
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const n = walker.currentNode
        if (!n.textContent.trim()) continue
        const el = n.parentElement
        if (!el || !vis(el)) continue
        const fs = parseFloat(getComputedStyle(el).fontSize)
        if (fs < 10.9) out.tiny.push(`${fs}px "${n.textContent.trim().slice(0, 28)}"`)
      }
      if (document.documentElement.scrollWidth > innerWidth + 1) out.overflow = `${document.documentElement.scrollWidth} > ${innerWidth}`
      try {
        const a = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], resultTypes: ['violations'] })
        out.axe = a.violations.filter((v) => !['region', 'landmark-one-main', 'page-has-heading-one', 'landmark-unique'].includes(v.id)).map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0].target.join(' ').slice(0, 70)}`)
      } catch (e) { out.axe = ['axe error ' + e.message] }
      return out
    })
    report.routes[`${theme} ${r}`] = res
  }
  await ctx.close()
}
await browser.close()
server.close()
const uniq = (a) => [...new Set(a)]
report.console = uniq(report.console)
console.log(JSON.stringify(report, null, 1))
