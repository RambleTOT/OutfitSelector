// Список вещей каталога (около 220 позиций) под аудиторию 16–30 лет, актуальные тренды осени–зимы 2026.
// Это редакторский список: каждая строка — вид вещи в конкретном крое со списком цветов. Запуск: node tools/catalog/make-list.mjs
// Результат: tools/catalog/list.json (build.mjs читает его). Названия видов (type) должны совпадать со словарём vision/app/labels.py
import { writeFileSync } from 'node:fs'

// ключ: [название цвета для приложения, hex, русское прилагательное (жен.), английское]
const C = {
  white: ['Белый', '#F3F3F0', 'белая', 'white'], black: ['Чёрный', '#2A2B30', 'чёрная', 'black'], gray: ['Серый', '#8E9097', 'серая', 'heather gray'],
  navy: ['Тёмно-синий', '#24304F', 'тёмно-синяя', 'navy blue'], blue: ['Синий', '#3D5A99', 'синяя', 'mid-blue washed'], lightblue: ['Голубой', '#A9C4E2', 'голубая', 'light blue washed'],
  beige: ['Бежевый', '#D9C7AE', 'бежевая', 'beige'], green: ['Оливковый', '#5E7048', 'оливковая', 'olive green'], red: ['Красный', '#C4453F', 'красная', 'red'],
  brown: ['Коричневый', '#7A5A43', 'коричневая', 'chocolate brown'], pink: ['Розовый', '#E8A5B3', 'розовая', 'soft pink'], burgundy: ['Бордовый', '#6E2A35', 'бордовая', 'burgundy'],
}
// [категория, вид по словарю vision, название (ru), род (f/m/n/p), описание (en), крой, для кого, материал, тепло, формальность, цвета]
const T = [
  // верх
  ['top', 'футболка', 'футболка оверсайз', 'f', 'oversized boxy heavyweight cotton t-shirt', 'оверсайз', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['white', 'black', 'gray', 'navy', 'brown', 'green']],
  ['top', 'футболка', 'укороченная футболка', 'f', 'fitted cropped baby tee', 'приталенный', 'f', 'хлопок', 'лёгкая', 'кэжуал', ['white', 'black', 'pink']],
  ['top', 'футболка', 'поло', 'n', 'retro knit polo shirt', 'прямой', 'u', 'трикотаж', 'лёгкая', 'смарт-кэжуал', ['navy', 'white', 'green']],
  ['top', 'лонгслив', 'лонгслив в полоску', 'm', 'horizontal striped breton long sleeve top, thin stripes', 'прямой', 'u', 'хлопок', 'демисезон', 'кэжуал', ['navy', 'black']],
  ['top', 'лонгслив', 'лонгслив', 'm', 'fitted long sleeve t-shirt', 'приталенный', 'u', 'хлопок', 'демисезон', 'кэжуал', ['black', 'white', 'gray']],
  ['top', 'рубашка', 'рубашка оверсайз', 'f', 'oversized poplin button-up shirt', 'оверсайз', 'u', 'хлопок', 'лёгкая', 'смарт-кэжуал', ['white', 'lightblue', 'black']],
  ['top', 'рубашка', 'рубашка в клетку', 'f', 'flannel plaid button-up shirt', 'прямой', 'u', 'фланель', 'демисезон', 'кэжуал', ['red', 'green']],
  ['top', 'рубашка', 'джинсовая рубашка', 'f', 'denim button-up shirt', 'прямой', 'u', 'деним', 'демисезон', 'кэжуал', ['blue', 'black']],
  ['top', 'рубашка', 'блузка', 'f', 'satin blouse with collar', 'приталенный', 'f', 'атлас', 'лёгкая', 'смарт-кэжуал', ['white', 'black', 'beige']],
  ['top', 'свитер', 'вязаный свитер', 'm', 'chunky knit sweater', 'оверсайз', 'u', 'шерсть', 'тёплая', 'кэжуал', ['beige', 'gray', 'black', 'brown', 'green', 'burgundy']],
  ['top', 'свитер', 'кардиган', 'm', 'knit button-up cardigan', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['beige', 'gray', 'black', 'brown', 'pink', 'green']],
  ['top', 'свитер', 'жилет вязаный', 'm', 'knit sweater vest with v-neck', 'прямой', 'u', 'шерсть', 'демисезон', 'смарт-кэжуал', ['navy', 'gray', 'beige']],
  ['top', 'худи', 'худи оверсайз', 'n', 'oversized heavyweight pullover hoodie', 'оверсайз', 'u', 'хлопок', 'демисезон', 'спорт', ['gray', 'black', 'white', 'brown', 'green', 'navy', 'burgundy']],
  ['top', 'худи', 'худи на молнии', 'n', 'zip-up hoodie', 'прямой', 'u', 'хлопок', 'демисезон', 'спорт', ['gray', 'black', 'navy', 'green']],
  ['top', 'свитшот', 'свитшот', 'm', 'boxy crewneck sweatshirt', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['gray', 'black', 'navy', 'burgundy', 'green', 'white', 'lightblue']],
  // низ
  ['bottom', 'джинсы', 'широкие джинсы', 'p', 'baggy wide-leg jeans', 'оверсайз', 'u', 'деним', 'демисезон', 'кэжуал', ['lightblue', 'blue', 'black', 'gray']],
  ['bottom', 'джинсы', 'прямые джинсы', 'p', 'straight-leg jeans', 'прямой', 'u', 'деним', 'демисезон', 'кэжуал', ['blue', 'lightblue', 'black']],
  ['bottom', 'джинсы', 'джинсы клёш', 'p', 'flared bootcut jeans', 'приталенный', 'f', 'деним', 'демисезон', 'кэжуал', ['blue', 'black']],
  ['bottom', 'брюки', 'широкие брюки', 'p', 'wide-leg pleated trousers', 'прямой', 'u', 'хлопок', 'демисезон', 'смарт-кэжуал', ['black', 'gray', 'beige', 'brown', 'navy']],
  ['bottom', 'брюки', 'брюки карго', 'p', 'cargo pants with side pockets', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['green', 'black', 'gray', 'beige']],
  ['bottom', 'брюки', 'спортивные штаны', 'p', 'wide-leg sweatpants', 'оверсайз', 'u', 'хлопок', 'демисезон', 'спорт', ['gray', 'black', 'navy']],
  ['bottom', 'брюки', 'вельветовые брюки', 'p', 'corduroy straight-leg trousers', 'прямой', 'u', 'вельвет', 'тёплая', 'кэжуал', ['brown', 'beige', 'green']],
  ['bottom', 'брюки', 'брюки-парашюты', 'p', 'nylon parachute pants', 'оверсайз', 'u', 'нейлон', 'демисезон', 'спорт', ['black']],
  ['bottom', 'юбка', 'плиссированная мини-юбка', 'f', 'pleated mini skirt', 'прямой', 'f', 'вискоза', 'демисезон', 'кэжуал', ['black', 'gray', 'navy', 'red']],
  ['bottom', 'юбка', 'атласная юбка миди', 'f', 'satin slip midi skirt', 'прямой', 'f', 'атлас', 'демисезон', 'смарт-кэжуал', ['black', 'beige', 'burgundy']],
  ['bottom', 'юбка', 'джинсовая юбка', 'f', 'denim midi skirt', 'прямой', 'f', 'деним', 'демисезон', 'кэжуал', ['blue', 'lightblue', 'black']],
  ['bottom', 'шорты', 'джинсовые шорты', 'p', 'long baggy denim jorts', 'оверсайз', 'u', 'деним', 'лёгкая', 'кэжуал', ['blue', 'lightblue', 'black']],
  ['bottom', 'шорты', 'баскетбольные шорты', 'p', 'mesh basketball shorts', 'оверсайз', 'u', 'полиэстер', 'лёгкая', 'спорт', ['black', 'white', 'navy']],
  // платья
  ['dress', 'платье', 'атласное платье-комбинация', 'n', 'satin slip dress', 'приталенный', 'f', 'атлас', 'лёгкая', 'вечерний', ['black', 'beige', 'green', 'burgundy']],
  ['dress', 'платье', 'мини-платье', 'n', 'simple fitted mini dress', 'приталенный', 'f', 'вискоза', 'лёгкая', 'вечерний', ['black', 'red']],
  ['dress', 'платье', 'вязаное платье', 'n', 'knit midi dress', 'прямой', 'f', 'шерсть', 'тёплая', 'кэжуал', ['gray', 'black', 'beige']],
  ['dress', 'платье', 'платье-рубашка', 'n', 'shirt dress with belt', 'прямой', 'f', 'хлопок', 'демисезон', 'смарт-кэжуал', ['white', 'lightblue', 'beige']],
  // верхняя одежда
  ['outer', 'куртка', 'бомбер', 'm', 'bomber jacket with ribbed cuffs', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['black', 'green', 'navy', 'beige']],
  ['outer', 'куртка', 'пуховик оверсайз', 'm', 'oversized glossy puffer jacket', 'оверсайз', 'u', 'нейлон', 'тёплая', 'кэжуал', ['black', 'beige', 'white', 'green', 'burgundy']],
  ['outer', 'куртка', 'короткий пуховик', 'm', 'short cropped puffer jacket', 'прямой', 'f', 'нейлон', 'тёплая', 'кэжуал', ['black', 'beige', 'pink']],
  ['outer', 'куртка', 'кожаная куртка', 'f', 'leather biker jacket', 'прямой', 'u', 'кожа', 'демисезон', 'кэжуал', ['black', 'brown']],
  ['outer', 'куртка', 'джинсовая куртка', 'f', 'oversized denim jacket', 'оверсайз', 'u', 'деним', 'демисезон', 'кэжуал', ['lightblue', 'blue', 'black']],
  ['outer', 'куртка', 'ветровка', 'f', 'lightweight nylon windbreaker', 'прямой', 'u', 'нейлон', 'лёгкая', 'спорт', ['black', 'navy', 'green']],
  ['outer', 'куртка', 'флисовая куртка', 'f', 'fleece zip-up jacket', 'прямой', 'u', 'флис', 'тёплая', 'спорт', ['beige', 'gray', 'black']],
  ['outer', 'куртка', 'парка', 'f', 'hooded parka', 'прямой', 'u', 'хлопок', 'тёплая', 'кэжуал', ['green', 'black', 'beige']],
  ['outer', 'пальто', 'длинное пальто', 'n', 'long wool coat', 'прямой', 'u', 'шерсть', 'тёплая', 'смарт-кэжуал', ['beige', 'black', 'gray', 'brown', 'navy']],
  ['outer', 'пальто', 'пуховое пальто', 'n', 'long puffer coat', 'оверсайз', 'f', 'нейлон', 'тёплая', 'кэжуал', ['black', 'beige', 'white']],
  ['outer', 'пиджак', 'пиджак оверсайз', 'm', 'oversized single-breasted blazer', 'оверсайз', 'u', 'шерсть', 'демисезон', 'смарт-кэжуал', ['black', 'gray', 'beige', 'brown', 'navy']],
  ['outer', 'тренч', 'тренч', 'm', 'classic trench coat with belt', 'прямой', 'u', 'хлопок', 'демисезон', 'смарт-кэжуал', ['beige', 'black', 'green']],
  // обувь
  ['shoes', 'кроссовки', 'кроссовки на массивной подошве', 'p', 'chunky dad sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'спорт', ['white', 'gray', 'black']],
  ['shoes', 'кроссовки', 'ретро-кроссовки', 'p', 'retro running sneakers with suede panels', 'прямой', 'u', 'замша', 'демисезон', 'спорт', ['gray', 'beige', 'navy', 'green']],
  ['shoes', 'кроссовки', 'низкие кроссовки', 'p', 'low-profile suede terrace sneakers with gum sole', 'прямой', 'u', 'замша', 'демисезон', 'кэжуал', ['white', 'black', 'green', 'burgundy']],
  ['shoes', 'кроссовки', 'кроссовки на платформе', 'p', 'platform sneakers', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['white', 'black']],
  ['shoes', 'кеды', 'высокие кеды', 'p', 'canvas high-top sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'кэжуал', ['black', 'white']],
  ['shoes', 'кеды', 'скейтерские кеды', 'p', 'padded skate shoes', 'прямой', 'u', 'замша', 'демисезон', 'спорт', ['black', 'white']],
  ['shoes', 'ботинки', 'грубые ботинки', 'p', 'chunky lace-up combat boots', 'прямой', 'u', 'кожа', 'тёплая', 'кэжуал', ['black', 'brown', 'burgundy']],
  ['shoes', 'ботинки', 'челси', 'p', 'chelsea boots', 'прямой', 'u', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'brown']],
  ['shoes', 'ботинки', 'трекинговые ботинки', 'p', 'hiking boots', 'прямой', 'u', 'кожа', 'тёплая', 'спорт', ['brown', 'black', 'gray']],
  ['shoes', 'ботинки', 'угги', 'p', 'suede shearling boots', 'прямой', 'f', 'замша', 'тёплая', 'кэжуал', ['beige', 'brown', 'black']],
  ['shoes', 'ботинки', 'казаки', 'p', 'western cowboy boots', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['brown', 'black']],
  ['shoes', 'лоферы', 'лоферы на массивной подошве', 'p', 'chunky penny loafers', 'прямой', 'u', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'brown']],
  // сумки
  ['bag', 'сумка', 'сумка-багет', 'f', 'small baguette shoulder bag with a strap', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['black', 'brown', 'white', 'beige']],
  ['bag', 'сумка', 'шоппер', 'm', 'canvas tote shopper bag with two long handles', 'прямой', 'u', 'хлопок', 'демисезон', 'кэжуал', ['beige', 'black', 'white']],
  ['bag', 'сумка', 'сумка кроссбоди', 'f', 'small nylon crossbody bag with strap', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['black', 'gray', 'green']],
  ['bag', 'сумка', 'рюкзак', 'm', 'urban backpack with two shoulder straps', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['black', 'gray', 'navy', 'green']],
  // аксессуары
  ['accessory', 'шарф', 'вязаный шарф', 'm', 'chunky knit scarf', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['gray', 'black', 'beige', 'burgundy', 'green']],
  ['accessory', 'шарф', 'шарф в клетку', 'm', 'large plaid wool scarf with fringe', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['red', 'gray', 'beige']],
  ['accessory', 'кепка', 'кепка', 'f', 'plain baseball cap', 'прямой', 'u', 'хлопок', 'лёгкая', 'спорт', ['black', 'white', 'navy', 'beige', 'green', 'gray']],
  ['accessory', 'шляпа', 'шапка-бини', 'f', 'ribbed knit beanie', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['black', 'gray', 'beige', 'burgundy', 'green', 'navy']],
  ['accessory', 'шляпа', 'панама', 'f', 'bucket hat', 'прямой', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['black', 'beige', 'green']],
  // --- вторая партия (18 ноября): больше кроев, цветов и обуви ---
  ['top', 'лонгслив', 'водолазка', 'f', 'fitted turtleneck top', 'приталенный', 'u', 'трикотаж', 'демисезон', 'смарт-кэжуал', ['black', 'white', 'gray', 'beige', 'brown']],
  ['top', 'свитер', 'свитер с молнией у ворота', 'm', 'quarter-zip knit sweater', 'прямой', 'u', 'шерсть', 'тёплая', 'смарт-кэжуал', ['navy', 'gray', 'green', 'black']],
  ['top', 'худи', 'укороченное худи', 'n', 'cropped boxy hoodie', 'оверсайз', 'f', 'хлопок', 'демисезон', 'спорт', ['pink', 'gray', 'black', 'white']],
  ['top', 'рубашка', 'льняная рубашка', 'f', 'relaxed linen shirt', 'оверсайз', 'u', 'лён', 'лёгкая', 'кэжуал', ['white', 'beige', 'lightblue', 'green']],
  ['top', 'футболка', 'футболка оверсайз', 'f', 'oversized boxy heavyweight cotton t-shirt', 'оверсайз', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['beige', 'red', 'lightblue', 'pink', 'burgundy']],
  ['top', 'свитшот', 'свитшот', 'm', 'boxy crewneck sweatshirt', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['beige', 'brown', 'pink']],
  ['top', 'свитер', 'вязаный свитер', 'm', 'chunky knit sweater', 'оверсайз', 'u', 'шерсть', 'тёплая', 'кэжуал', ['navy', 'white', 'pink', 'lightblue']],
  ['bottom', 'джинсы', 'джинсы мом', 'p', 'high-waisted mom jeans', 'прямой', 'f', 'деним', 'демисезон', 'кэжуал', ['lightblue', 'blue', 'black', 'white']],
  ['bottom', 'джинсы', 'джинсы-бочонки', 'p', 'barrel leg jeans', 'оверсайз', 'u', 'деним', 'демисезон', 'кэжуал', ['blue', 'black', 'lightblue']],
  ['bottom', 'брюки', 'чиносы', 'p', 'straight chino pants', 'прямой', 'u', 'хлопок', 'демисезон', 'смарт-кэжуал', ['beige', 'navy', 'green', 'gray', 'black']],
  ['bottom', 'брюки', 'джоггеры', 'p', 'tapered joggers with cuffs', 'прямой', 'u', 'хлопок', 'демисезон', 'спорт', ['gray', 'black', 'navy', 'beige']],
  ['bottom', 'юбка', 'юбка-карго', 'f', 'long cargo midi skirt', 'прямой', 'f', 'хлопок', 'демисезон', 'кэжуал', ['green', 'black', 'beige']],
  ['bottom', 'юбка', 'плиссированная юбка миди', 'f', 'pleated midi skirt', 'прямой', 'f', 'вискоза', 'демисезон', 'смарт-кэжуал', ['black', 'beige', 'green', 'navy', 'burgundy']],
  ['bottom', 'юбка', 'джинсовая мини-юбка', 'f', 'denim mini skirt', 'прямой', 'f', 'деним', 'лёгкая', 'кэжуал', ['blue', 'black', 'lightblue']],
  ['bottom', 'шорты', 'шорты карго', 'p', 'knee-length cargo shorts', 'оверсайз', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['green', 'beige', 'black']],
  ['dress', 'платье', 'платье в рубчик', 'n', 'ribbed knit mini dress', 'приталенный', 'f', 'трикотаж', 'демисезон', 'кэжуал', ['black', 'white', 'pink', 'brown']],
  ['dress', 'платье', 'платье-свитер', 'n', 'oversized sweater dress', 'оверсайз', 'f', 'шерсть', 'тёплая', 'кэжуал', ['gray', 'beige', 'black', 'green']],
  ['outer', 'куртка', 'куртка харрингтон', 'f', 'harrington jacket', 'прямой', 'u', 'хлопок', 'демисезон', 'кэжуал', ['beige', 'navy', 'black', 'green']],
  ['outer', 'куртка', 'университетская куртка', 'f', 'varsity bomber jacket with leather sleeves, no letters', 'прямой', 'u', 'шерсть', 'демисезон', 'кэжуал', ['navy', 'green', 'burgundy', 'black']],
  ['outer', 'куртка', 'куртка-рубашка', 'f', 'oversized overshirt shacket', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['brown', 'green', 'black', 'beige', 'navy']],
  ['outer', 'куртка', 'замшевая куртка', 'f', 'suede trucker jacket', 'прямой', 'u', 'замша', 'демисезон', 'кэжуал', ['brown', 'beige', 'black']],
  ['outer', 'куртка', 'куртка тедди', 'f', 'sherpa teddy fleece jacket', 'оверсайз', 'u', 'флис', 'тёплая', 'кэжуал', ['beige', 'white', 'brown', 'gray']],
  ['outer', 'куртка', 'анорак', 'm', 'half-zip anorak windbreaker', 'прямой', 'u', 'нейлон', 'лёгкая', 'спорт', ['black', 'green', 'beige', 'blue']],
  ['outer', 'пальто', 'двубортное пальто', 'n', 'double-breasted wool coat', 'прямой', 'u', 'шерсть', 'тёплая', 'смарт-кэжуал', ['black', 'gray', 'beige', 'brown', 'burgundy']],
  ['outer', 'пальто', 'дублёнка', 'f', 'shearling aviator coat', 'прямой', 'u', 'овчина', 'тёплая', 'кэжуал', ['brown', 'beige', 'black']],
  ['outer', 'пиджак', 'двубортный пиджак', 'm', 'double-breasted blazer', 'прямой', 'f', 'шерсть', 'демисезон', 'смарт-кэжуал', ['black', 'gray', 'beige']],
  ['shoes', 'кроссовки', 'кожаные кроссовки', 'p', 'minimalist leather court sneakers', 'прямой', 'u', 'кожа', 'демисезон', 'кэжуал', ['white', 'black', 'beige', 'green']],
  ['shoes', 'кроссовки', 'беговые кроссовки', 'p', 'technical running sneakers with mesh upper', 'прямой', 'u', 'текстиль', 'демисезон', 'спорт', ['gray', 'black', 'white', 'blue', 'pink']],
  ['shoes', 'кеды', 'низкие кеды', 'p', 'low-top canvas sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'кэжуал', ['white', 'black', 'navy', 'red', 'green']],
  ['shoes', 'ботинки', 'ботинки на каблуке', 'p', 'heeled ankle boots', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'brown', 'beige']],
  ['shoes', 'ботинки', 'сапоги', 'p', 'knee-high leather boots with flat heel', 'прямой', 'f', 'кожа', 'тёплая', 'смарт-кэжуал', ['black', 'brown']],
  ['shoes', 'ботинки', 'зимние ботинки', 'p', 'insulated winter boots with lug sole', 'прямой', 'u', 'нейлон', 'тёплая', 'кэжуал', ['black', 'beige', 'gray']],
  ['shoes', 'лоферы', 'лоферы', 'p', 'classic leather loafers', 'прямой', 'u', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'brown', 'burgundy']],
  ['shoes', 'лоферы', 'балетки', 'p', 'leather ballet flats', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'beige', 'red', 'white']],
  ['bag', 'сумка', 'сумка-тоут', 'f', 'structured leather tote bag with two handles', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'brown', 'beige']],
  ['bag', 'сумка', 'мини-сумка', 'f', 'mini top-handle bag', 'прямой', 'f', 'кожа', 'демисезон', 'вечерний', ['black', 'pink', 'red', 'white']],
  ['bag', 'сумка', 'сумка-хобо', 'f', 'soft slouchy hobo shoulder bag', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['black', 'brown', 'beige']],
  ['accessory', 'шарф', 'вязаный шарф', 'm', 'chunky knit scarf', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['navy', 'brown', 'pink']],
  ['accessory', 'кепка', 'кепка', 'f', 'plain baseball cap', 'прямой', 'u', 'хлопок', 'лёгкая', 'спорт', ['brown', 'red', 'burgundy']],
  ['accessory', 'шляпа', 'шапка-бини', 'f', 'ribbed knit beanie', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['pink', 'brown', 'white']],
  ['accessory', 'шляпа', 'панама', 'f', 'bucket hat', 'прямой', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['white', 'navy']],
]

const adj = (ruColor, rod) => {
  const soft = ruColor.endsWith('яя')
  const base = ruColor.replace(/(ая|яя)$/, '')
  if (rod === 'f') return ruColor
  if (rod === 'm') return base + (soft ? 'ий' : 'ый')
  if (rod === 'p') return base + (soft ? 'ие' : 'ые')
  return base + (soft ? 'ее' : 'ое')
}
const SKIP = new Set(['dress-shirt-dress-with-belt-white', 'dress-shirt-dress-with-belt-beige', 'outer-lightweight-nylon-windbreaker-navy', 'outer-fleece-zip-up-jacket-gray', 'accessory-bucket-hat-black'])
const list = []
for (const [category, type, ru, rod, en, fit, sex, material, warmth, formality, colors] of T) {
  for (const ck of colors) {
    const [colorName, color, ruColor, enColor] = C[ck]
    const cn = adj(ruColor, rod)
    const who = sex === 'f' ? "women's " : ''
    const id0 = `${category}-${en.split(/[ ,]+/).slice(0, 4).join('-').replace(/[^a-z-]+/g, '')}-${ck}`
    if (SKIP.has(id0)) continue
    list.push({
      id: `${category}-${en.split(/[ ,]+/).slice(0, 4).join('-').replace(/[^a-z-]+/g, '')}-${ck}`,
      category, type, title: `${cn[0].toUpperCase()}${cn.slice(1)} ${ru}`.replace(/(Белая|Чёрная|Серая|Бежевая) (\S+)/, (m) => m), colorName, color, gender: sex,
      tags: [fit, material, formality], material, fit, warmth, formality,
      prompt: `Studio product photo of a single ${enColor} ${who}${en}, ${category === 'shoes' ? 'pair of shoes, side three-quarter view' : 'front view'}, centered, soft even daylight, plain light gray background, clean minimal design, no model, no text, no logo, no tag, realistic fabric texture, e-commerce style`,
    })
  }
}
writeFileSync(new URL('./list.json', import.meta.url), JSON.stringify(list, null, 1))
console.log(`в списке ${list.length}`)
const ids = new Set(list.map((e) => e.id)); if (ids.size !== list.length) console.log('ВНИМАНИЕ: повторяются id')
