import type { Category, Item, Occasion, OutfitTemplate, SilhouetteKind } from './types'

export const CATEGORY_LABEL: Record<Category, string> = {
  top: 'Верх',
  bottom: 'Низ',
  dress: 'Платья',
  outer: 'Верхняя одежда',
  shoes: 'Обувь',
  accessory: 'Аксессуары',
  bag: 'Сумки',
}

export const CATEGORY_ICON: Record<Category, string> = {
  top: 't-shirt',
  outer: 'hoodie',
  bottom: 'pants',
  dress: 'dress',
  shoes: 'sneaker',
  bag: 'handbag',
  accessory: 'sunglasses',
}

export const CATEGORY_ORDER: Category[] = ['top', 'outer', 'bottom', 'dress', 'shoes', 'bag', 'accessory']

export const OCCASIONS: Occasion[] = [
  { id: 'every', label: 'Каждый день', emoji: '☀️' },
  { id: 'work', label: 'Работа', emoji: '💼' },
  { id: 'study', label: 'Учёба', emoji: '📚' },
  { id: 'date', label: 'Свидание', emoji: '❤️' },
  { id: 'walk', label: 'Прогулка', emoji: '🌿' },
  { id: 'party', label: 'Вечеринка', emoji: '🎉' },
]

export const WISH_SUGGESTIONS = ['Что-то яркое', 'Удобно', 'Теплее', 'Без каблуков']

export const WEATHER = { city: 'Москва', temp: 8, label: 'Облачно', icon: 'cloud-sun', note: 'ветер, без дождя' }

const mk = (
  id: string,
  category: Category,
  kind: SilhouetteKind,
  title: string,
  type: string,
  color: string,
  colorName: string,
  rest: Partial<Item> & Pick<Item, 'material' | 'fit' | 'warmth' | 'formality' | 'description'>,
): Item => ({
  id,
  category,
  kind,
  title,
  type,
  color,
  colorName,
  pattern: 'однотон',
  available: true,
  source: 'template',
  ...rest,
})

/** Рисованные вещи (силуэт без фото) больше не поддерживаем: в гардеробе только вещи с настоящим фото. Нужен, чтобы убрать старые шаблоны из сохранений */
export const hasPhoto = (i: Item): boolean => !!i.photo || /^i\d{2}$/.test(i.id)

/** 24 вещи демо-гардероба. Если в public/items/ лежит {id}.png, он показывается вместо силуэта */
export const MOCK_ITEMS: Item[] = [
  mk('i01', 'top', 'tshirt', 'Белая футболка', 'футболка', '#F3F3F0', 'белый', { material: 'хлопок', fit: 'прямой', warmth: 'лёгкая', formality: 'кэжуал', description: 'Базовая белая футболка из плотного хлопка. Подходит под любую верхнюю одежду' }),
  mk('i02', 'top', 'shirt', 'Голубая рубашка', 'рубашка', '#A9C2DE', 'голубой', { material: 'хлопок', fit: 'приталенный', warmth: 'лёгкая', formality: 'смарт-кэжуал', description: 'Светлая рубашка с длинным рукавом. Освежает образ и держит деловой тон' }),
  mk('i03', 'top', 'sweater', 'Серый свитер', 'свитер', '#8E9097', 'серый', { material: 'шерсть', fit: 'прямой', warmth: 'тёплая', formality: 'кэжуал', description: 'Мягкий свитер в резинку. Хорошо смотрится под пальто и пиджаком' }),
  mk('i04', 'top', 'sweater', 'Чёрный свитшот', 'свитшот', '#2A2B30', 'чёрный', { material: 'хлопок', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Чёрный свитшот с длинным рукавом и маленьким принтом. Спокойная база на каждый день' }),
  mk('i05', 'top', 'hoodie', 'Белое худи', 'худи', '#F3F3F0', 'белый', { material: 'хлопок', fit: 'оверсайз', warmth: 'демисезон', formality: 'кэжуал', description: 'Белое худи свободного кроя с карманом. Тёплое, но не тяжёлое' }),
  mk('i06', 'top', 'shirt', 'Синяя рубашка', 'рубашка', '#3D5A99', 'синий', { material: 'хлопок', fit: 'приталенный', warmth: 'лёгкая', formality: 'деловой', description: 'Насыщенная синяя рубашка для работы и вечера. Хорошо смотрится под пиджаком' }),
  mk('i07', 'top', 'sweater', 'Коричневый свитер', 'свитер', '#8A4B3A', 'коричневый', { material: 'шерсть', fit: 'прямой', warmth: 'тёплая', formality: 'кэжуал', description: 'Мягкий свитер терракотового цвета. Тёплый акцент в спокойном гардеробе' }),
  mk('i08', 'outer', 'jacket', 'Рыжая куртка', 'куртка', '#C06A45', 'рыжий', { material: 'нейлон', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Лёгкая куртка-бомбер на молнии. Закрывает от ветра и добавляет цвет' }),
  mk('i09', 'outer', 'blazer', 'Чёрный пиджак', 'пиджак', '#2D2E33', 'чёрный', { material: 'шерсть', fit: 'приталенный', warmth: 'демисезон', formality: 'деловой', description: 'Строгий пиджак на одной пуговице. Собирает образ для работы и вечера' }),
  mk('i10', 'outer', 'jacket', 'Синяя куртка', 'куртка', '#34507A', 'синий', { material: 'нейлон', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Короткая куртка на молнии. Лёгкая, удобная на каждый день' }),
  mk('i11', 'outer', 'coat', 'Чёрное пальто', 'пальто', '#2A2B30', 'чёрный', { material: 'шерсть', fit: 'прямой', warmth: 'тёплая', formality: 'смарт-кэжуал', description: 'Чёрное пальто прямого кроя. Тёплое и нарядное' }),
  mk('i12', 'bottom', 'jeans', 'Синие джинсы', 'джинсы', '#4F6F9C', 'синий', { material: 'деним', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Прямые джинсы средней посадки. Подходят почти ко всему' }),
  mk('i13', 'bottom', 'trousers', 'Чёрные брюки', 'брюки', '#2A2A2E', 'чёрный', { material: 'шерсть', fit: 'прямой', warmth: 'демисезон', formality: 'деловой', description: 'Брюки со стрелками. Для работы и вечера' }),
  mk('i14', 'bottom', 'trousers', 'Бежевые чиносы', 'брюки', '#CDB894', 'бежевый', { material: 'хлопок', fit: 'прямой', warmth: 'демисезон', formality: 'смарт-кэжуал', description: 'Светлые чиносы. Смягчают тёмный верх и добавляют лёгкости' }),
  mk('i15', 'bottom', 'jeans', 'Тёмные джинсы', 'джинсы', '#3F5F8C', 'синий', { material: 'деним', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Тёмно-синие джинсы классического кроя. Подходят к любому верху' }),
  mk('i16', 'bottom', 'shorts', 'Джинсовые шорты', 'шорты', '#86A3C6', 'голубой', { material: 'деним', fit: 'прямой', warmth: 'лёгкая', formality: 'кэжуал', description: 'Короткие джинсовые шорты. Для тёплой погоды' }),
  mk('i17', 'dress', 'dress', 'Платье в полоску', 'платье', '#2A2B30', 'чёрный', { pattern: 'полоска', material: 'хлопок', fit: 'прямой', warmth: 'лёгкая', formality: 'кэжуал', description: 'Платье-футболка в чёрно-белую полоску. Сверху нужен тёплый слой' }),
  mk('i18', 'shoes', 'sneakers', 'Тёмные кроссовки', 'кроссовки', '#1F2A44', 'синий', { material: 'текстиль', fit: 'прямой', warmth: 'демисезон', formality: 'спорт', description: 'Тёмно-синие кроссовки на белой подошве. Удобны на весь день' }),
  mk('i19', 'shoes', 'loafers', 'Чёрные лоферы', 'лоферы', '#1F1F23', 'чёрный', { material: 'кожа', fit: 'прямой', warmth: 'демисезон', formality: 'деловой', description: 'Классические лоферы. Держат образ деловым' }),
  mk('i20', 'shoes', 'boots', 'Замшевые ботинки', 'ботинки', '#B8733A', 'рыжий', { material: 'замша', fit: 'прямой', warmth: 'тёплая', formality: 'смарт-кэжуал', description: 'Рыжие замшевые челси на устойчивой подошве. Для холода и слякоти' }),
  mk('i21', 'bag', 'bag', 'Чёрная сумка', 'сумка', '#2A2A2E', 'чёрный', { material: 'кожа', fit: 'прямой', warmth: 'демисезон', formality: 'деловой', description: 'Сумка с одной ручкой и клапаном. Помещается ноутбук' }),
  mk('i22', 'bag', 'bag', 'Коричневая сумка', 'сумка', '#9A6B48', 'коричневый', { material: 'кожа', fit: 'прямой', warmth: 'демисезон', formality: 'кэжуал', description: 'Сумка цвета карамели. Добавляет тепла в спокойный образ' }),
  mk('i23', 'accessory', 'cap', 'Соломенная шляпа', 'шляпа', '#D9C7A0', 'бежевый', { material: 'солома', fit: 'прямой', warmth: 'лёгкая', formality: 'кэжуал', description: 'Широкая соломенная шляпа с чёрной лентой. Для солнечных дней' }),
  mk('i24', 'accessory', 'cap', 'Жёлтая кепка', 'кепка', '#E8B923', 'жёлтый', { material: 'хлопок', fit: 'прямой', warmth: 'лёгкая', formality: 'спорт', description: 'Кепка с изогнутым козырьком. Яркий акцент для прогулок' }),
]

/** 6 заготовок образов, по одной на повод. «Другой вариант» берёт следующую */
export const OUTFIT_TEMPLATES: OutfitTemplate[] = [
  {
    id: 't-every',
    occasion: 'every',
    explanation: 'Куртка закроет от ветра, светлый верх освежит, кроссовки держат образ на каждый день',
    slots: [
      { category: 'outer', prefer: ['i08', 'i10'] },
      { category: 'top', prefer: ['i01', 'i05'] },
      { category: 'bottom', prefer: ['i12', 'i14'] },
      { category: 'shoes', prefer: ['i18'] },
    ],
  },
  {
    id: 't-work',
    occasion: 'work',
    explanation: 'Пиджак задаёт деловой тон, светлая рубашка освежит, лоферы держат образ строгим',
    slots: [
      { category: 'outer', prefer: ['i09'] },
      { category: 'top', prefer: ['i02', 'i06'] },
      { category: 'bottom', prefer: ['i13', 'i14'] },
      { category: 'shoes', prefer: ['i19'] },
      { category: 'bag', prefer: ['i21'] },
    ],
  },
  {
    id: 't-study',
    occasion: 'study',
    explanation: 'Куртка и худи согреют на +8, джинсы с кроссовками удобны на весь день',
    slots: [
      { category: 'outer', prefer: ['i10'] },
      { category: 'top', prefer: ['i05', 'i04'] },
      { category: 'bottom', prefer: ['i12'] },
      { category: 'shoes', prefer: ['i18'] },
      { category: 'bag', prefer: ['i22'] },
    ],
  },
  {
    id: 't-date',
    occasion: 'date',
    explanation: 'Платье в полоску с чёрным пальто выглядит собранно и не даёт замёрзнуть, лоферы добавляют изящества',
    slots: [
      { category: 'dress', prefer: ['i17'] },
      { category: 'outer', prefer: ['i11'] },
      { category: 'shoes', prefer: ['i19'] },
      { category: 'bag', prefer: ['i21'] },
    ],
  },
  {
    id: 't-walk',
    occasion: 'walk',
    explanation: 'Худи и широкие джинсы для долгой прогулки, кепка на случай солнца',
    slots: [
      { category: 'top', prefer: ['i05', 'i04'] },
      { category: 'bottom', prefer: ['i12', 'i15'] },
      { category: 'shoes', prefer: ['i18', 'i20'] },
      { category: 'accessory', prefer: ['i24'] },
    ],
  },
  {
    id: 't-party',
    occasion: 'party',
    explanation: 'Синяя рубашка и чёрные брюки дают вечерний тон, пиджак добавляет строгости',
    slots: [
      { category: 'outer', prefer: ['i09'] },
      { category: 'top', prefer: ['i06'] },
      { category: 'bottom', prefer: ['i13'] },
      { category: 'shoes', prefer: ['i19'] },
      { category: 'bag', prefer: ['i21'] },
    ],
  },
]

export const MISSING_HINT: Partial<Record<Category, string>> = {
  shoes: 'светлые кеды или лоферы',
  top: 'базовая футболка или рубашка',
  bottom: 'джинсы или брюки',
  outer: 'тренч или лёгкая куртка',
  bag: 'сумка на каждый день',
}
