// Иконка приложения: буква A из Cormorant Garamond переводится в контуры (opentype.js), затем PNG через sharp
import opentype from 'opentype.js'
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const font = (() => { const b = readFileSync('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff'); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) })()
const grad = '<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB199"/><stop offset=".52" stop-color="#F2665E"/><stop offset="1" stop-color="#B5627F"/></linearGradient></defs>'

function glyphPath(size, cx, baseline) {
  const w = font.getAdvanceWidth('A', size)
  return font.getPath('A', cx - w / 2, baseline, size).toPathData(2)
}
const svg = (px, rx, fontSize, baseline) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">${grad}<rect width="${px}" height="${px}" rx="${rx}" fill="url(#s)"/><path d="${glyphPath(fontSize, px / 2, baseline)}" fill="#fff"/></svg>`

const out = async (name, s, size) => sharp(Buffer.from(s)).resize(size, size).png().toFile(`public/icons/${name}`)
await out('icon-512.png', svg(512, 112, 300, 350), 512)
await out('icon-192.png', svg(512, 112, 300, 350), 192)
await out('apple-touch-icon.png', svg(512, 0, 300, 350), 180) // iOS скругляет сам
await out('maskable-512.png', svg(512, 0, 230, 330), 512) // безопасная зона 80 %
writeFileSync('public/favicon.svg', svg(64, 14, 38, 45).replace('width="64" height="64"', 'width="64" height="64"'))
console.log('icons ok')
