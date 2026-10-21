// Иконки, которых нет в пакете assets/icons (Phosphor regular, нарисованы в том же стиле: штрих 16 на сетке 256)
const s = 'fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"'

const thumbsUp =
  `<path ${s} d="M32 112h40v96H32z"/>` +
  `<path ${s} d="M72 112l32-72a24 24 0 0 1 24 24v32h64a16 16 0 0 1 15.7 19l-12 64A16 16 0 0 1 180 192H72"/>`

export const ICONS_EXTRA: Record<string, string> = {
  'thumbs-up': thumbsUp,
  'thumbs-down': `<g transform="rotate(180 128 128)">${thumbsUp}</g>`,
  'circle-notch': `<path ${s} d="M232 128a104 104 0 1 1-104-104"/>`,
  lightning: `<path ${s} d="M144 16L48 144h72l-8 96 96-128h-72z"/>`,
  image:
    `<rect ${s} x="40" y="40" width="176" height="176" rx="16"/>` +
    `<path ${s} d="M40 176l56-56 48 48 32-32 40 40"/>` +
    `<circle ${s} cx="164" cy="92" r="12"/>`,
  'camera-rotate':
    `<rect ${s} x="32" y="72" width="192" height="136" rx="20"/>` +
    `<path ${s} d="M96 72l12-24h40l12 24"/>` +
    `<path ${s} d="M156 128a28 28 0 1 1-8-20"/>` +
    `<path ${s} d="M156 98v14h-14"/>`,
  moon: `<path ${s} d="M216 140a88 88 0 0 1-100-100 88 88 0 1 0 100 100z"/>`,
  sun:
    `<circle ${s} cx="128" cy="128" r="48"/>` +
    `<path ${s} d="M128 24v24M128 208v24M24 128h24M208 128h24M54 54l17 17M185 185l17 17M54 202l17-17M185 71l17-17"/>`,
}
