// Собирает иконки Phosphor из design_handoff/assets/icons в TS-модуль (без метаданных c2pa)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = 'design_handoff/assets/icons'
const read = (dir) => {
  const out = {}
  for (const f of readdirSync(join(root, dir))) {
    if (!f.endsWith('.svg')) continue
    const svg = readFileSync(join(root, dir, f), 'utf8')
    const inner = svg
      .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .trim()
    out[f.replace(/\.svg$/, '').replace(/-fill$/, '')] = inner
  }
  return out
}
const regular = read('regular')
const fill = read('fill')
const body =
  `// Сгенерировано scripts/build-icons.mjs, не править руками\n` +
  `export const ICONS_REGULAR: Record<string, string> = ${JSON.stringify(regular, null, 1)}\n\n` +
  `export const ICONS_FILL: Record<string, string> = ${JSON.stringify(fill, null, 1)}\n`
writeFileSync('src/ui/icons.generated.ts', body)
console.log('icons:', Object.keys(regular).length, 'fill:', Object.keys(fill).length)
