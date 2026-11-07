// docs/legal/*.md -> public/legal/*.html (простая вёрстка, значения {{…}} подставляются из docs/legal/values.json, если он есть)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'

const vals = existsSync('docs/legal/values.json') ? JSON.parse(readFileSync('docs/legal/values.json', 'utf8')) : {}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
const fill = (s) => s.replace(/\{\{(.+?)\}\}/g, (m, k) => vals[k] ?? m)

mkdirSync('public/legal', { recursive: true })
for (const f of readdirSync('docs/legal').filter((x) => x.endsWith('.md'))) {
  const lines = fill(readFileSync(`docs/legal/${f}`, 'utf8')).split('\n')
  let html = '', list = false, title = ''
  for (const l of lines) {
    if (l.startsWith('- ')) { if (!list) { html += '<ul>'; list = true } html += `<li>${inline(l.slice(2))}</li>`; continue }
    if (list) { html += '</ul>'; list = false }
    if (l.startsWith('# ')) { title = l.slice(2); html += `<h1>${inline(title)}</h1>` }
    else if (l.startsWith('## ')) html += `<h2>${inline(l.slice(3))}</h2>`
    else if (l.trim()) html += `<p>${inline(l)}</p>`
  }
  if (list) html += '</ul>'
  const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Atelier</title><meta name="robots" content="index,follow"><meta name="color-scheme" content="light dark">
<style>:root{--bg:#F4F4F6;--fg:#111114;--mut:#6B6B74;--ac:#BF3D37}@media(prefers-color-scheme:dark){:root{--bg:#0F0F11;--fg:#F5F2EE;--mut:#A8A29C;--ac:#FF8F86}}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:720px;margin:0 auto;padding:24px 20px 80px}a{color:var(--ac)}h1{font-size:30px;line-height:1.2;margin:24px 0 8px}h2{font-size:20px;margin:32px 0 8px}p,li{color:var(--fg)}ul{padding-left:22px}.back{display:inline-block;padding:12px 0;font-weight:600;text-decoration:none}</style></head>
<body><main><a class="back" href="/">← Atelier</a>${html}</main></body></html>`
  writeFileSync(`public/legal/${f.replace('.md', '.html')}`, page)
  console.log('legal', f)
}
