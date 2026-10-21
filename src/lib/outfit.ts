import type { Item, SavedOutfit } from '../data/types'

/** Копия вещей для сохранённого образа. Фото не дублируем: в localStorage остаётся лёгкий силуэт */
export const snapshotOf = (items: Item[]): Item[] => items.map((i) => ({ ...i, photo: undefined }))

export interface ResolvedItem { item: Item; deleted: boolean }

/** Вещи образа из гардероба; удалённые берутся из копии и помечаются */
export function resolveSaved(o: SavedOutfit, wardrobe: Item[]): ResolvedItem[] {
  return o.items.flatMap((id): ResolvedItem[] => {
    const live = wardrobe.find((i) => i.id === id)
    if (live) return [{ item: live, deleted: false }]
    const snap = o.snap?.find((i) => i.id === id)
    return snap ? [{ item: snap, deleted: true }] : []
  })
}
