// Готовит ассеты сцены для ролика: токены, шрифты, иконки, картинки «до / после»
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = 'video/stage/assets'
mkdirSync(join(out, 'fonts'), { recursive: true })
copyFileSync('src/styles/tokens.css', join(out, 'tokens.css'))

// шрифты рядом со сценой, пути в @font-face переписаны
let css = readFileSync('src/styles/fonts.css', 'utf8')
for (const m of css.matchAll(/url\('\.\.\/\.\.\/node_modules\/([^']+)'\)/g)) {
  const name = m[1].split('/').pop()
  copyFileSync(join('node_modules', m[1]), join(out, 'fonts', name))
  css = css.replace(m[0], `url('fonts/${name}')`)
}
writeFileSync(join(out, 'fonts.css'), css)

// иконки Phosphor (regular + fill) в один JS
const read = (dir) => Object.fromEntries(readdirSync(join('design_handoff/assets/icons', dir)).filter((f) => f.endsWith('.svg')).map((f) => [
  f.replace(/\.svg$/, '').replace(/-fill$/, ''),
  readFileSync(join('design_handoff/assets/icons', dir, f), 'utf8').replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim(),
]))
writeFileSync(join(out, 'icons.js'), `window.ICONS=${JSON.stringify({ regular: read('regular'), fill: read('fill') })}\nwindow.icon=(n,s=24,fill=false)=>'<svg viewBox="0 0 256 256" width="'+s+'" height="'+s+'" fill="currentColor">'+((fill&&ICONS.fill[n])||ICONS.regular[n]||'')+'</svg>'\n`)
console.log('stage assets ok')
