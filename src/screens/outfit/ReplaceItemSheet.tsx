import { useEffect, useState } from 'react'
import { BottomSheet, Button, Chip, ItemTile } from '../../ui'
import { accusative, cap } from '../../lib/format'
import type { Item } from '../../data/types'

/** OUT-08 ReplaceItemSheet: бесплатная замена одной вещи на другую из той же категории */
export function ReplaceItemSheet({
  open, onClose, outfitItems, wardrobe, onReplace,
}: { open: boolean; onClose: () => void; outfitItems: Item[]; wardrobe: Item[]; onReplace: (oldId: string, newId: string) => void }) {
  const [slotId, setSlotId] = useState<string>(outfitItems[0]?.id ?? '')
  const [pick, setPick] = useState<string | null>(null)
  useEffect(() => {
    if (open) { setSlotId(outfitItems[0]?.id ?? ''); setPick(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const slot = outfitItems.find((i) => i.id === slotId) ?? outfitItems[0]
  if (!slot) return null
  const options = wardrobe.filter((i) => i.category === slot.category)
  const inOutfit = new Set(outfitItems.map((i) => i.id))
  return (
    <BottomSheet
      open={open} onClose={onClose}
      title={`Заменить ${accusative(slot.type)}`} subtitle="Бесплатно, лимит образов не тратится"
    >
      <div className="scroll-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px', flexShrink: 0 }}>
        {outfitItems.map((i) => (
          <Chip key={i.id} label={cap(i.type)} selected={i.id === slot.id} onClick={() => { setSlotId(i.id); setPick(null) }} />
        ))}
      </div>
      <div className="grid3">
        {options.map((it) => {
          const current = it.id === slot.id
          return (
            <ItemTile
              key={it.id} item={it} label={it.title}
              unavailable={!it.available} selected={pick ? pick === it.id : current}
              onClick={() => it.available && !current && !(inOutfit.has(it.id)) && setPick(it.id)}
            />
          )
        })}
      </div>
      {options.length < 2 && <p className="t-callout muted">Других вещей в этой категории пока нет</p>}
      <Button full icon="swap" disabled={!pick} onClick={() => { if (pick) { onReplace(slot.id, pick); onClose() } }}>Заменить</Button>
    </BottomSheet>
  )
}
