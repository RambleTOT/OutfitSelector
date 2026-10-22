// Превью с сеткой 10% для выбора кропов: node tools/grid-preview.mjs <файл> <выход.jpg> [ширина]
import sharp from 'sharp'
const [file, out, wArg] = process.argv.slice(2)
const W = Number(wArg ?? 560)
const meta = await sharp(file).metadata()
const H = Math.round((W * meta.height) / meta.width)
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`
for (let i = 1; i < 10; i++) {
  svg += `<line x1="${(W * i) / 10}" y1="0" x2="${(W * i) / 10}" y2="${H}" stroke="#f0f" stroke-width="1" opacity=".7"/><text x="${(W * i) / 10 + 2}" y="12" font-size="11" fill="#f0f" font-family="Arial">${i * 10}</text>`
  svg += `<line x1="0" y1="${(H * i) / 10}" x2="${W}" y2="${(H * i) / 10}" stroke="#f0f" stroke-width="1" opacity=".7"/><text x="2" y="${(H * i) / 10 - 2}" font-size="11" fill="#f0f" font-family="Arial">${i * 10}</text>`
}
svg += '</svg>'
await sharp(file).resize(W, H).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 80 }).toFile(out)
