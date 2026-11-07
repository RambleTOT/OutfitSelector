// Картинка для превью ссылки (Telegram, VK): node tools/og.mjs
import sharp from 'sharp'
const W = 1200, H = 630
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD9CC"/><stop offset=".55" stop-color="#F7B3A8"/><stop offset="1" stop-color="#D8A0B6"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>
<text x="80" y="170" font-family="Georgia, serif" font-size="64" fill="#111114">Atelier</text>
<text x="80" y="300" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="68" fill="#111114">Новые образы</text>
<text x="80" y="378" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="68" fill="#111114">из твоего шкафа</text>
<text x="80" y="450" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#4a3f3f">AI-стилист в телефоне. Бесплатно</text></svg>`)
const shot = await sharp('public/landing/outfit-result.webp').resize({ width: 250 }).png().toBuffer()
const m = await sharp(shot).metadata()
const frame = await sharp({ create: { width: m.width + 16, height: m.height + 16, channels: 4, background: '#111114' } }).composite([{ input: shot, left: 8, top: 8 }]).png().toBuffer()
await sharp(bg).composite([{ input: frame, left: 800, top: 36 }]).png().toFile('public/landing/og.png')
console.log('ok')
