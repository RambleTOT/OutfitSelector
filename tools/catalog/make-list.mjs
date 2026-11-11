// Составляет список вещей каталога (около 200 позиций): вид × цвет × крой × для кого. Запуск: node tools/catalog/make-list.mjs
// Результат: tools/catalog/list.json. Список можно править руками, build.mjs читает его.
import { writeFileSync } from 'node:fs'

const C = {
  white: ['Белый', '#F3F3F0', 'белая', 'white'], black: ['Чёрный', '#2A2B30', 'чёрная', 'black'], gray: ['Серый', '#8E9097', 'серая', 'gray'],
  navy: ['Тёмно-синий', '#24304F', 'тёмно-синяя', 'navy blue'], blue: ['Синий', '#3D5A99', 'синяя', 'blue'], beige: ['Бежевый', '#D9C7AE', 'бежевая', 'beige'],
  green: ['Зелёный', '#5E8C61', 'зелёная', 'olive green'], red: ['Красный', '#C4453F', 'красная', 'red'], brown: ['Коричневый', '#7A5A43', 'коричневая', 'brown'],
  pink: ['Розовый', '#E8A5B3', 'розовая', 'pink'],
}
// вид: [категория, русское название (ж/м/мн), род, английское название, крои, пол, цвета, материал, тепло, формальность]
const T = [
  ['top', 'футболка', 'f', 't-shirt', ['прямой', 'оверсайз', 'приталенный'], ['u'], ['white', 'black', 'gray', 'navy', 'beige', 'green', 'red', 'pink'], 'хлопок', 'лёгкая', 'кэжуал'],
  ['top', 'рубашка', 'f', 'button-up shirt', ['прямой', 'приталенный'], ['m', 'f'], ['white', 'blue', 'black', 'beige', 'pink'], 'хлопок', 'лёгкая', 'смарт-кэжуал'],
  ['top', 'свитер', 'm', 'knit sweater', ['прямой', 'оверсайз'], ['u'], ['gray', 'black', 'beige', 'navy', 'brown', 'green', 'white'], 'шерсть', 'тёплая', 'кэжуал'],
  ['top', 'худи', 'n', 'hoodie', ['оверсайз', 'прямой'], ['u'], ['gray', 'black', 'white', 'navy', 'beige', 'green'], 'хлопок', 'демисезон', 'спорт'],
  ['top', 'свитшот', 'm', 'crewneck sweatshirt', ['прямой', 'оверсайз'], ['u'], ['gray', 'black', 'white', 'navy', 'green'], 'хлопок', 'демисезон', 'кэжуал'],
  ['top', 'лонгслив', 'm', 'long sleeve t-shirt', ['прямой', 'приталенный'], ['u'], ['white', 'black', 'gray', 'navy'], 'хлопок', 'демисезон', 'кэжуал'],
  ['bottom', 'джинсы', 'p', 'jeans', ['прямой', 'приталенный', 'оверсайз'], ['u'], ['blue', 'black', 'gray', 'white'], 'деним', 'демисезон', 'кэжуал'],
  ['bottom', 'брюки', 'p', 'trousers', ['прямой', 'приталенный'], ['m', 'f'], ['black', 'gray', 'navy', 'beige', 'brown'], 'хлопок', 'демисезон', 'смарт-кэжуал'],
  ['bottom', 'шорты', 'p', 'shorts', ['прямой'], ['u'], ['blue', 'black', 'beige', 'gray'], 'хлопок', 'лёгкая', 'кэжуал'],
  ['bottom', 'юбка', 'f', 'skirt', ['приталенный', 'прямой'], ['f'], ['black', 'beige', 'gray', 'navy', 'pink', 'brown'], 'вискоза', 'демисезон', 'смарт-кэжуал'],
  ['dress', 'платье', 'n', 'dress', ['приталенный', 'прямой'], ['f'], ['black', 'white', 'navy', 'red', 'green', 'beige', 'pink'], 'вискоза', 'демисезон', 'вечерний'],
  ['outer', 'куртка', 'f', 'jacket', ['прямой', 'оверсайз'], ['u'], ['black', 'navy', 'green', 'beige', 'brown'], 'нейлон', 'демисезон', 'кэжуал'],
  ['outer', 'пальто', 'n', 'wool coat', ['прямой', 'оверсайз'], ['m', 'f'], ['black', 'gray', 'beige', 'brown', 'navy'], 'шерсть', 'тёплая', 'смарт-кэжуал'],
  ['outer', 'пиджак', 'm', 'blazer', ['приталенный', 'прямой'], ['m', 'f'], ['black', 'gray', 'navy', 'beige'], 'шерсть', 'демисезон', 'деловой'],
  ['outer', 'тренч', 'm', 'trench coat', ['прямой'], ['u'], ['beige', 'black'], 'хлопок', 'демисезон', 'смарт-кэжуал'],
  ['shoes', 'кроссовки', 'p', 'sneakers', ['прямой'], ['u'], ['white', 'black', 'gray', 'beige', 'navy'], 'текстиль', 'демисезон', 'спорт'],
  ['shoes', 'кеды', 'p', 'canvas low-top sneakers', ['прямой'], ['u'], ['white', 'black', 'navy', 'red'], 'кожа', 'демисезон', 'кэжуал'],
  ['shoes', 'лоферы', 'p', 'loafers', ['прямой'], ['m', 'f'], ['black', 'brown', 'beige'], 'кожа', 'демисезон', 'деловой'],
  ['shoes', 'ботинки', 'p', 'leather boots', ['прямой'], ['m', 'f'], ['black', 'brown', 'beige'], 'кожа', 'тёплая', 'смарт-кэжуал'],
  ['bag', 'сумка', 'f', 'handbag', ['прямой'], ['f'], ['black', 'brown', 'beige', 'red'], 'кожа', 'демисезон', 'кэжуал'],
  ['bag', 'рюкзак', 'm', 'backpack', ['прямой'], ['u'], ['black', 'gray', 'navy', 'green'], 'нейлон', 'демисезон', 'кэжуал'],
  ['accessory', 'шарф', 'm', 'wool scarf', ['прямой'], ['u'], ['gray', 'black', 'beige', 'red', 'navy'], 'шерсть', 'тёплая', 'кэжуал'],
  ['accessory', 'кепка', 'f', 'baseball cap', ['прямой'], ['u'], ['black', 'white', 'navy', 'beige'], 'хлопок', 'лёгкая', 'спорт'],
]
const adj = (colorKey, gender, ruColor) => {
  // «белая футболка», «белый свитер», «белые джинсы», «белое худи/платье»
  const base = ruColor.replace(/ая$/, '')
  return gender === 'f' ? ruColor : gender === 'm' ? base + 'ый' : gender === 'p' ? base + 'ые' : base + 'ое'
}
const list = []
for (const [category, type, rod, en, fits, sexes, colors, material, warmth, formality] of T) {
  for (const ck of colors) {
    for (const fit of fits) {
      for (const sex of sexes) {
        if (fits.length > 1 && colors.indexOf(ck) > 3 && fit !== fits[0]) continue // меньше повторов у редких цветов
        let [colorName, color, ruColor, enColor] = C[ck]
        const cn = adj(ck, rod, ruColor)
        const tags = [fit, material, formality]
        const who = sex === 'f' ? "women's " : sex === 'm' ? "men's " : ''
        const fitEn = fit === 'оверсайз' ? 'oversized ' : fit === 'приталенный' ? 'slim fit ' : ''
        const title = `${cn[0].toUpperCase()}${cn.slice(1)} ${type}${fit === 'оверсайз' ? ' оверсайз' : ''}`
        list.push({
          id: `${category}-${en.replace(/[^a-z]+/g, '-')}-${ck}-${fit === 'оверсайз' ? 'over' : fit === 'приталенный' ? 'slim' : 'reg'}-${sex}`,
          category, type, title, colorName, color, gender: sex, tags, material, fit, warmth, formality,
          query: `${enColor} ${fitEn}${who}${en} flat lay plain background`,
          prompt: `Studio product photo of a single ${enColor} ${fitEn}${who}${en}, laid flat or on an invisible mannequin, front view, centered, soft even daylight lighting, plain light gray background, no model, no text, no logo, realistic fabric texture, e-commerce catalog style`,
        })
      }
    }
  }
}
// чтобы получилось около 200, берём равномерную выборку, если вышло больше
const max = Number(process.argv[2] ?? 200)
const step = list.length > max ? list.length / max : 1
const out = []
for (let i = 0; i < list.length && out.length < max; i += step) out.push(list[Math.floor(i)])
writeFileSync(new URL('./list.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`всего комбинаций ${list.length}, в списке ${out.length}`)
