import type { Category, Fit, Formality, Item, Pattern, SilhouetteKind, Warmth } from './types'

export const CATEGORY_SINGULAR: Record<Category, string> = {
  top: 'Верх',
  bottom: 'Низ',
  dress: 'Платье',
  outer: 'Верхняя одежда',
  shoes: 'Обувь',
  accessory: 'Аксессуар',
  bag: 'Сумка',
}

type Gender = 'f' | 'm' | 'n' | 'p'

export interface TypeDef {
  type: string
  kind: SilhouetteKind
  gender: Gender
  material: string
  fit: Fit
  warmth: Warmth
  formality: Formality
}

const t = (type: string, kind: SilhouetteKind, gender: Gender, material: string, fit: Fit, warmth: Warmth, formality: Formality): TypeDef => ({
  type, kind, gender, material, fit, warmth, formality,
})

/** Каталог шаблонов: категория → тип. Для каждого типа есть силуэт и разумные значения по умолчанию */
export const TYPES: Record<Category, TypeDef[]> = {
  top: [
    t('футболка', 'tshirt', 'f', 'хлопок', 'прямой', 'лёгкая', 'кэжуал'),
    t('рубашка', 'shirt', 'f', 'хлопок', 'прямой', 'лёгкая', 'смарт-кэжуал'),
    t('свитер', 'sweater', 'm', 'шерсть', 'прямой', 'тёплая', 'кэжуал'),
    t('худи', 'hoodie', 'n', 'хлопок', 'оверсайз', 'демисезон', 'спорт'),
    t('лонгслив', 'sweater', 'm', 'хлопок', 'прямой', 'демисезон', 'кэжуал'),
    t('свитшот', 'sweater', 'm', 'хлопок', 'прямой', 'демисезон', 'кэжуал'),
  ],
  outer: [
    t('тренч', 'trench', 'm', 'хлопок', 'прямой', 'демисезон', 'смарт-кэжуал'),
    t('пальто', 'coat', 'n', 'шерсть', 'прямой', 'тёплая', 'смарт-кэжуал'),
    t('куртка', 'jacket', 'f', 'нейлон', 'прямой', 'демисезон', 'кэжуал'),
    t('пиджак', 'blazer', 'm', 'шерсть', 'приталенный', 'демисезон', 'деловой'),
  ],
  bottom: [
    t('джинсы', 'jeans', 'p', 'деним', 'прямой', 'демисезон', 'кэжуал'),
    t('брюки', 'trousers', 'p', 'хлопок', 'прямой', 'демисезон', 'смарт-кэжуал'),
    t('юбка', 'skirt', 'f', 'вискоза', 'приталенный', 'демисезон', 'смарт-кэжуал'),
    t('шорты', 'shorts', 'p', 'деним', 'прямой', 'лёгкая', 'кэжуал'),
  ],
  dress: [t('платье', 'dress', 'n', 'вискоза', 'приталенный', 'демисезон', 'вечерний')],
  shoes: [
    t('кеды', 'sneakers', 'p', 'кожа', 'прямой', 'демисезон', 'кэжуал'),
    t('кроссовки', 'sneakers', 'p', 'текстиль', 'прямой', 'демисезон', 'спорт'),
    t('лоферы', 'loafers', 'p', 'кожа', 'прямой', 'демисезон', 'деловой'),
    t('ботинки', 'boots', 'p', 'кожа', 'прямой', 'тёплая', 'смарт-кэжуал'),
  ],
  bag: [t('сумка', 'bag', 'f', 'кожа', 'прямой', 'демисезон', 'кэжуал')],
  accessory: [
    t('шарф', 'scarf', 'm', 'шерсть', 'прямой', 'тёплая', 'кэжуал'),
    t('кепка', 'cap', 'f', 'хлопок', 'прямой', 'лёгкая', 'спорт'),
    t('шляпа', 'cap', 'f', 'солома', 'прямой', 'лёгкая', 'кэжуал'),
  ],
}

export const COLORS: { name: string; hex: string }[] = [
  { name: 'Белый', hex: '#F3F3F0' },
  { name: 'Чёрный', hex: '#2A2B30' },
  { name: 'Серый', hex: '#8E9097' },
  { name: 'Бежевый', hex: '#D9C7AE' },
  { name: 'Синий', hex: '#3D5A99' },
  { name: 'Красный', hex: '#C4453F' },
  { name: 'Зелёный', hex: '#5E8C61' },
  { name: 'Коричневый', hex: '#7A5A43' },
  { name: 'Жёлтый', hex: '#E8B923' },
]

/** Группа цвета для фильтра: оттенки сводятся к базовой палитре */
export function colorGroup(colorName: string): string {
  const n = colorName.toLowerCase()
  if (n.includes('бел')) return 'Белый'
  if (n.includes('чёрн') || n.includes('черн')) return 'Чёрный'
  if (n.includes('сер')) return 'Серый'
  if (n.includes('беж')) return 'Бежевый'
  if (n.includes('син') || n.includes('голуб') || n.includes('фиолет')) return 'Синий'
  if (n.includes('красн') || n.includes('бордов') || n.includes('розов')) return 'Красный'
  if (n.includes('зел') || n.includes('зёл') || n.includes('оливк')) return 'Зелёный'
  if (n.includes('коричн') || n.includes('рыж') || n.includes('терракот') || n.includes('оранж')) return 'Коричневый'
  if (n.includes('жёлт') || n.includes('желт')) return 'Жёлтый'
  return 'Серый'
}

export const hexOfColorName = (name: string): string =>
  COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase())?.hex ?? '#8E9097'

/** «Белый» + женский род → «белая» */
export function colorForm(name: string, gender: Gender): string {
  const n = name.toLowerCase()
  const soft = n.endsWith('ий')
  const stem = n.slice(0, -2)
  const end = soft
    ? { f: 'яя', m: 'ий', n: 'ее', p: 'ие' }
    : { f: 'ая', m: 'ый', n: 'ое', p: 'ые' }
  return stem + end[gender]
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const typeDef = (category: Category, type: string): TypeDef =>
  TYPES[category].find((d) => d.type === type) ?? TYPES[category][0]

export function makeTitle(colorName: string, type: string, category: Category): string {
  const d = typeDef(category, type)
  return cap(`${colorForm(colorName, d.gender)} ${d.type}`)
}

export function makeDescription(i: Pick<Item, 'title' | 'material' | 'fit' | 'formality' | 'warmth'>): string {
  return `${i.title}: ${i.material}, ${i.fit} крой, ${i.warmth === 'тёплая' ? 'тёплая' : i.warmth === 'лёгкая' ? 'лёгкая' : 'на межсезонье'}. Стиль: ${i.formality}`
}

let seq = 0
/** Вещь из шаблона: категория, тип, цвет. Остальные поля заполняются по умолчанию для типа */
export function buildTemplateItem(category: Category, type: string, colorName: string): Item {
  const d = typeDef(category, type)
  const title = makeTitle(colorName, d.type, category)
  const base: Item = {
    id: `t${Date.now().toString(36)}${(seq++).toString(36)}`,
    category,
    type: d.type,
    kind: d.kind,
    title,
    color: hexOfColorName(colorName),
    colorName: colorName.toLowerCase(),
    pattern: 'однотон',
    material: d.material,
    fit: d.fit,
    warmth: d.warmth,
    formality: d.formality,
    description: '',
    available: true,
    source: 'template',
  }
  return { ...base, description: makeDescription(base) }
}

export const FIELD_OPTIONS = {
  pattern: ['однотон', 'полоска', 'клетка', 'принт'] as Pattern[],
  material: ['хлопок', 'деним', 'шерсть', 'кожа', 'лён', 'вискоза', 'нейлон', 'синтетика'],
  fit: ['оверсайз', 'прямой', 'приталенный'] as Fit[],
  warmth: ['лёгкая', 'демисезон', 'тёплая'] as Warmth[],
  formality: ['спорт', 'кэжуал', 'смарт-кэжуал', 'деловой', 'вечерний'] as Formality[],
}

/** Правка полей в карточке вещи: пересчитывает силуэт, цвет и название */
export function applyItemEdit(item: Item, patch: Partial<Item> & { colorNameTo?: string }): Item {
  let next: Item = { ...item, ...patch }
  if (patch.category && patch.category !== item.category) {
    const d = TYPES[patch.category][0]
    next = { ...next, type: d.type, kind: d.kind }
  }
  if (patch.type && patch.type !== item.type) {
    const d = typeDef(next.category, patch.type)
    next = { ...next, type: d.type, kind: d.kind }
  }
  if (patch.colorNameTo) {
    next = { ...next, colorName: patch.colorNameTo.toLowerCase(), color: hexOfColorName(patch.colorNameTo) }
  }
  delete (next as Partial<typeof next> & { colorNameTo?: string }).colorNameTo
  if (patch.category || patch.type || patch.colorNameTo) next.title = makeTitle(next.colorName, next.type, next.category)
  return next
}
