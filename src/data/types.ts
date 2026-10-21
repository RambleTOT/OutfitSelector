export type Category = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'accessory' | 'bag'

export type SilhouetteKind =
  | 'tshirt' | 'shirt' | 'sweater' | 'hoodie'
  | 'blazer' | 'coat' | 'trench' | 'jacket'
  | 'jeans' | 'trousers' | 'skirt' | 'shorts'
  | 'dress'
  | 'sneakers' | 'loafers' | 'boots'
  | 'bag' | 'scarf' | 'cap'

export type Pattern = 'однотон' | 'полоска' | 'клетка' | 'принт'
export type Fit = 'оверсайз' | 'прямой' | 'приталенный'
export type Warmth = 'лёгкая' | 'демисезон' | 'тёплая'
export type Formality = 'спорт' | 'кэжуал' | 'смарт-кэжуал' | 'деловой' | 'вечерний'
export type Season = 'весна' | 'лето' | 'осень' | 'зима'

export interface Item {
  id: string
  category: Category
  type: string
  kind: SilhouetteKind
  title: string
  color: string // hex заливки силуэта
  colorName: string
  color2?: string
  pattern: Pattern
  material: string
  fit: Fit
  warmth: Warmth
  formality: Formality
  description: string
  available: boolean // false = «Недоступна сейчас» (в стирке)
  source: 'template' | 'photo'
  photo?: string // dataURL вырезанной вещи (после «обработки»)
  queued?: boolean // ждёт сеть
  addedAt?: number
}

export type OccasionId = 'every' | 'work' | 'study' | 'date' | 'walk' | 'party'

export interface Occasion {
  id: OccasionId
  label: string
  emoji: string
}

/** Слот заготовки: предпочтительные вещи по порядку, иначе берётся любая подходящая из той же категории */
export interface TemplateSlot {
  category: Category
  prefer: string[]
}

export interface OutfitTemplate {
  id: string
  occasion: OccasionId
  slots: TemplateSlot[]
  explanation: string
}

export interface MissingSlot {
  category: Category
  hint: string
}

export interface SavedOutfit {
  id: string
  name: string
  occasion: OccasionId
  items: string[]
  createdAt: number
  note?: string
  explanation?: string
  // положение вещей на холсте, если образ правился в конструкторе
  layout?: CanvasLayoutItem[]
  bg?: string
  worn?: boolean
}

export interface CanvasLayoutItem {
  itemId: string
  x: number // центр, доли холста 0..1
  y: number
  scale: number
  rotate: number
  z: number
}
