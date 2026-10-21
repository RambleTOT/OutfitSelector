import type { CanvasLayoutItem, Category, Item } from '../../data/types'

/** Рабочая область холста: ширина экрана на 1.2 по высоте. Позиции хранятся долями области, поэтому не зависят от размера экрана */
export const BOX_ASPECT = 1.2
export const BASE = 0.36 // базовая сторона вещи как доля ширины холста

export const BACKGROUNDS = [
  { id: 'theme', label: 'Как тема', color: 'var(--bg-base)', swatch: 'var(--bg-elevated)' },
  { id: 'milk', label: 'Молочный', color: '#F4F4F6', swatch: '#F4F4F6' },
  { id: 'sand', label: 'Песочный', color: '#EFE6DC', swatch: '#EFE6DC' },
  { id: 'powder', label: 'Пудровый', color: '#F6E4E1', swatch: '#F6E4E1' },
]
export const bgColor = (id?: string) => (BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]).color

// «Как на кровати», те же слоты, что в коллаже образа: левый верх, ширина, высота в долях, поворот
const SLOT: Record<Category, { l: number; t: number; w: number; h: number; r: number }> = {
  outer: { l: 0.06, t: 0.04, w: 0.46, h: 0.46, r: -6 },
  top: { l: 0.38, t: 0.06, w: 0.4, h: 0.4, r: 4 },
  bottom: { l: 0.24, t: 0.4, w: 0.38, h: 0.5, r: -2 },
  dress: { l: 0.27, t: 0.06, w: 0.44, h: 0.82, r: -2 },
  shoes: { l: 0.56, t: 0.66, w: 0.3, h: 0.26, r: 8 },
  accessory: { l: 0.74, t: 0.3, w: 0.22, h: 0.24, r: 10 },
  bag: { l: 0.04, t: 0.58, w: 0.26, h: 0.28, r: -8 },
}
const Z: Record<Category, number> = { bottom: 1, outer: 2, dress: 2, top: 3, shoes: 4, bag: 4, accessory: 5 }

/** Раскладка по умолчанию для набора вещей (образ из AI или выбор в гардеробе) */
export function autoLayout(items: Item[]): CanvasLayoutItem[] {
  const seen: Partial<Record<Category, number>> = {}
  return items.map((it) => {
    const s = SLOT[it.category]
    const n = seen[it.category] ?? 0
    seen[it.category] = n + 1
    const scale = Math.min((s.w * 0.92) / BASE, (s.h * BOX_ASPECT * 0.92) / BASE)
    return {
      itemId: it.id,
      x: Math.min(0.92, s.l + s.w / 2 + n * 0.07),
      y: Math.min(0.92, s.t + s.h / 2 + n * 0.05),
      scale: Math.max(0.5, scale),
      rotate: s.r + n * 6,
      z: Z[it.category] * 10 + n,
    }
  })
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const topZ = (l: CanvasLayoutItem[]) => (l.length ? Math.max(...l.map((i) => i.z)) + 1 : 1)
export const bottomZ = (l: CanvasLayoutItem[]) => (l.length ? Math.min(...l.map((i) => i.z)) - 1 : 1)
