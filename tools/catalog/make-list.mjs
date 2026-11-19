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
  // --- третья партия (18 ноября): добиваем до 500 ---
  ['top', 'футболка', 'футболка в полоску', 'f', 'horizontal striped short sleeve t-shirt, thin stripes', 'прямой', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['navy', 'black', 'red']],
  ['top', 'футболка', 'облегающая футболка', 'f', 'ribbed fitted tee', 'приталенный', 'f', 'хлопок', 'лёгкая', 'кэжуал', ['white', 'black', 'brown']],
  ['top', 'лонгслив', 'лонгслив оверсайз', 'm', 'oversized long sleeve t-shirt', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['white', 'black', 'gray', 'brown']],
  ['top', 'рубашка', 'рубашка с коротким рукавом', 'f', 'short sleeve camp collar shirt', 'прямой', 'u', 'вискоза', 'лёгкая', 'кэжуал', ['white', 'lightblue', 'beige', 'black']],
  ['top', 'рубашка', 'рубашка оксфорд', 'f', 'oxford button-down shirt', 'прямой', 'u', 'хлопок', 'демисезон', 'смарт-кэжуал', ['white', 'lightblue']],
  ['top', 'свитер', 'свитер с v-вырезом', 'm', 'v-neck merino sweater', 'прямой', 'u', 'шерсть', 'демисезон', 'смарт-кэжуал', ['navy', 'gray', 'black', 'beige']],
  ['top', 'свитер', 'свитер с горлом', 'm', 'chunky roll-neck sweater', 'оверсайз', 'u', 'шерсть', 'тёплая', 'кэжуал', ['beige', 'gray', 'black', 'white']],
  ['top', 'свитер', 'кардиган на молнии', 'm', 'zip-up knit cardigan', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['gray', 'black', 'navy']],
  ['top', 'свитер', 'свитер с косами', 'm', 'cable knit crewneck sweater', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['beige', 'navy', 'green']],
  ['top', 'худи', 'худи на молнии', 'n', 'zip-up hoodie', 'прямой', 'u', 'хлопок', 'демисезон', 'спорт', ['beige', 'burgundy', 'brown']],
  ['bottom', 'джинсы', 'зауженные джинсы', 'p', 'slim tapered jeans', 'приталенный', 'u', 'деним', 'демисезон', 'кэжуал', ['black', 'blue', 'lightblue']],
  ['bottom', 'джинсы', 'широкие джинсы', 'p', 'baggy wide-leg jeans', 'оверсайз', 'u', 'деним', 'демисезон', 'кэжуал', ['white', 'beige']],
  ['bottom', 'брюки', 'зауженные брюки', 'p', 'tailored slim trousers', 'приталенный', 'u', 'шерсть', 'демисезон', 'деловой', ['black', 'gray', 'navy', 'beige']],
  ['bottom', 'брюки', 'вельветовые брюки', 'p', 'corduroy straight-leg trousers', 'прямой', 'u', 'вельвет', 'тёплая', 'кэжуал', ['black', 'burgundy', 'navy']],
  ['bottom', 'брюки', 'брюки карго', 'p', 'cargo pants with side pockets', 'оверсайз', 'u', 'хлопок', 'демисезон', 'кэжуал', ['brown', 'navy']],
  ['bottom', 'брюки', 'спортивные штаны', 'p', 'wide-leg sweatpants', 'оверсайз', 'u', 'хлопок', 'демисезон', 'спорт', ['beige', 'green', 'burgundy']],
  ['bottom', 'брюки', 'брюки-парашюты', 'p', 'nylon parachute pants', 'оверсайз', 'u', 'нейлон', 'демисезон', 'спорт', ['gray', 'beige', 'navy']],
  ['bottom', 'брюки', 'льняные брюки', 'p', 'linen drawstring trousers', 'прямой', 'u', 'лён', 'лёгкая', 'кэжуал', ['white', 'beige']],
  ['bottom', 'юбка', 'юбка-трапеция', 'f', 'a-line mini skirt', 'прямой', 'f', 'хлопок', 'демисезон', 'кэжуал', ['black', 'red', 'pink', 'beige']],
  ['bottom', 'юбка', 'юбка-карандаш', 'f', 'pencil skirt', 'приталенный', 'f', 'шерсть', 'демисезон', 'деловой', ['black', 'gray', 'beige', 'navy']],
  ['bottom', 'шорты', 'шорты бермуды', 'p', 'tailored bermuda shorts', 'прямой', 'u', 'хлопок', 'лёгкая', 'смарт-кэжуал', ['beige', 'navy', 'black']],
  ['dress', 'платье', 'платье с длинным рукавом', 'n', 'long sleeve fitted midi dress', 'приталенный', 'f', 'трикотаж', 'демисезон', 'смарт-кэжуал', ['black', 'brown', 'green', 'burgundy']],
  ['dress', 'платье', 'мини-платье', 'n', 'simple fitted mini dress', 'приталенный', 'f', 'вискоза', 'лёгкая', 'вечерний', ['white', 'pink']],
  ['outer', 'куртка', 'пуховик оверсайз', 'm', 'oversized glossy puffer jacket', 'оверсайз', 'u', 'нейлон', 'тёплая', 'кэжуал', ['gray', 'brown']],
  ['outer', 'куртка', 'короткий пуховик', 'm', 'short cropped puffer jacket', 'прямой', 'f', 'нейлон', 'тёплая', 'кэжуал', ['green', 'burgundy', 'gray']],
  ['outer', 'куртка', 'бомбер', 'm', 'bomber jacket with ribbed cuffs', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['burgundy', 'gray', 'brown']],
  ['outer', 'куртка', 'флисовая куртка', 'f', 'fleece zip-up jacket', 'прямой', 'u', 'флис', 'тёплая', 'спорт', ['green', 'navy', 'brown']],
  ['outer', 'куртка', 'парка', 'f', 'hooded parka', 'прямой', 'u', 'хлопок', 'тёплая', 'кэжуал', ['navy', 'gray']],
  ['outer', 'куртка', 'кожаный бомбер', 'm', 'leather bomber jacket', 'прямой', 'u', 'кожа', 'демисезон', 'кэжуал', ['black', 'brown']],
  ['outer', 'куртка', 'джинсовая куртка', 'f', 'oversized denim jacket', 'оверсайз', 'u', 'деним', 'демисезон', 'кэжуал', ['white', 'gray']],
  ['outer', 'пальто', 'длинное пальто', 'n', 'long wool coat', 'прямой', 'u', 'шерсть', 'тёплая', 'смарт-кэжуал', ['green', 'burgundy']],
  ['outer', 'тренч', 'тренч', 'm', 'classic trench coat with belt', 'прямой', 'u', 'хлопок', 'демисезон', 'смарт-кэжуал', ['gray', 'navy']],
  ['outer', 'пиджак', 'пиджак оверсайз', 'm', 'oversized single-breasted blazer', 'оверсайз', 'u', 'шерсть', 'демисезон', 'смарт-кэжуал', ['burgundy', 'green']],
  ['shoes', 'кроссовки', 'кроссовки на массивной подошве', 'p', 'chunky dad sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'спорт', ['beige', 'navy']],
  ['shoes', 'кроссовки', 'ретро-кроссовки', 'p', 'retro running sneakers with suede panels', 'прямой', 'u', 'замша', 'демисезон', 'спорт', ['black', 'white', 'burgundy']],
  ['shoes', 'кроссовки', 'низкие кроссовки', 'p', 'low-profile suede terrace sneakers with gum sole', 'прямой', 'u', 'замша', 'демисезон', 'кэжуал', ['gray', 'beige', 'navy']],
  ['shoes', 'кеды', 'высокие кеды', 'p', 'canvas high-top sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'кэжуал', ['red', 'navy']],
  ['shoes', 'кеды', 'скейтерские кеды', 'p', 'padded skate shoes', 'прямой', 'u', 'замша', 'демисезон', 'спорт', ['gray', 'green']],
  ['shoes', 'ботинки', 'челси', 'p', 'chelsea boots', 'прямой', 'u', 'кожа', 'демисезон', 'смарт-кэжуал', ['beige', 'burgundy']],
  ['shoes', 'ботинки', 'трекинговые ботинки', 'p', 'hiking boots', 'прямой', 'u', 'кожа', 'тёплая', 'спорт', ['beige', 'green']],
  ['shoes', 'ботинки', 'угги', 'p', 'suede shearling boots', 'прямой', 'f', 'замша', 'тёплая', 'кэжуал', ['gray', 'pink']],
  ['shoes', 'лоферы', 'лоферы на массивной подошве', 'p', 'chunky penny loafers', 'прямой', 'u', 'кожа', 'демисезон', 'смарт-кэжуал', ['burgundy', 'beige']],
  ['shoes', 'лоферы', 'мэри джейн', 'p', 'mary jane flats with strap', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['black', 'burgundy']],
  ['bag', 'сумка', 'сумка-багет', 'f', 'small baguette shoulder bag with a strap', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['red', 'green', 'gray']],
  ['bag', 'сумка', 'шоппер', 'm', 'canvas tote shopper bag with two long handles', 'прямой', 'u', 'хлопок', 'демисезон', 'кэжуал', ['green', 'navy']],
  ['bag', 'сумка', 'сумка кроссбоди', 'f', 'small crossbody bag with strap', 'прямой', 'u', 'кожа', 'демисезон', 'кэжуал', ['beige', 'brown', 'white']],
  ['bag', 'сумка', 'рюкзак', 'm', 'urban backpack with two shoulder straps', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['beige', 'brown', 'burgundy']],
  ['bag', 'сумка', 'мини-сумка', 'f', 'mini top-handle bag', 'прямой', 'f', 'кожа', 'демисезон', 'вечерний', ['brown', 'beige']],
  ['bag', 'сумка', 'сумка-тоут', 'f', 'structured leather tote bag with two handles', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['gray', 'white']],
  ['accessory', 'шарф', 'шарф в клетку', 'm', 'large plaid wool scarf with fringe', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['navy', 'black']],
  ['accessory', 'шарф', 'вязаный шарф', 'm', 'chunky knit scarf', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['white', 'red', 'lightblue']],
  ['accessory', 'кепка', 'кепка', 'f', 'plain baseball cap', 'прямой', 'u', 'хлопок', 'лёгкая', 'спорт', ['pink', 'lightblue']],
  ['accessory', 'шляпа', 'шапка-бини', 'f', 'ribbed knit beanie', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['red', 'lightblue']],
  ['accessory', 'шляпа', 'шапка с помпоном', 'f', 'knit hat with a pom pom', 'прямой', 'u', 'шерсть', 'тёплая', 'кэжуал', ['white', 'red', 'gray']],
  ['accessory', 'шляпа', 'панама', 'f', 'bucket hat', 'прямой', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['gray', 'brown']],
  // --- четвёртая партия (19 ноября): добираем платья и то, что распознавание путало; 'force' = принимаем по моей визуальной проверке ---
  ['dress', 'платье', 'платье-свитер', 'n', 'oversized sweater dress', 'оверсайз', 'f', 'шерсть', 'тёплая', 'кэжуал', ['gray', 'beige', 'black', 'green', 'brown'], 'force'],
  ['dress', 'платье', 'платье-рубашка', 'n', 'shirt dress with belt', 'прямой', 'f', 'хлопок', 'демисезон', 'смарт-кэжуал', ['white', 'lightblue', 'beige', 'black'], 'force'],
  ['dress', 'платье', 'мини-платье', 'n', 'simple fitted mini dress', 'приталенный', 'f', 'вискоза', 'лёгкая', 'вечерний', ['burgundy', 'green', 'beige', 'gray']],
  ['dress', 'платье', 'атласное платье-комбинация', 'n', 'satin slip dress', 'приталенный', 'f', 'атлас', 'лёгкая', 'вечерний', ['navy', 'pink', 'white']],
  ['dress', 'платье', 'джинсовое платье', 'n', 'denim midi dress with buttons', 'прямой', 'f', 'деним', 'демисезон', 'кэжуал', ['blue', 'lightblue']],
  ['dress', 'платье', 'платье в цветочек', 'n', 'light midi dress with small floral print', 'прямой', 'f', 'вискоза', 'лёгкая', 'кэжуал', ['pink', 'blue']],
  ['outer', 'куртка', 'анорак', 'm', 'half-zip anorak windbreaker', 'прямой', 'u', 'нейлон', 'лёгкая', 'спорт', ['green', 'blue'], 'force'],
  ['outer', 'куртка', 'флисовая куртка', 'f', 'fleece zip-up jacket', 'прямой', 'u', 'флис', 'тёплая', 'спорт', ['gray', 'green', 'navy', 'brown'], 'force'],
  ['outer', 'куртка', 'стёганый жилет', 'm', 'quilted puffer vest without sleeves', 'прямой', 'u', 'нейлон', 'демисезон', 'кэжуал', ['black', 'beige', 'green'], 'force'],
  ['top', 'футболка', 'майка', 'f', 'ribbed tank top', 'приталенный', 'u', 'хлопок', 'лёгкая', 'кэжуал', ['white', 'black', 'gray'], 'force'],
  ['top', 'футболка', 'топ', 'm', 'cropped ribbed top with short sleeves', 'приталенный', 'f', 'трикотаж', 'лёгкая', 'кэжуал', ['white', 'black', 'pink'], 'force'],
  ['top', 'рубашка', 'рубашка в полоску', 'f', 'oversized vertical striped shirt, thin stripes', 'оверсайз', 'u', 'хлопок', 'лёгкая', 'смарт-кэжуал', ['lightblue', 'navy']],
  ['bottom', 'брюки', 'легинсы', 'p', 'high-waist sport leggings', 'приталенный', 'f', 'эластан', 'демисезон', 'спорт', ['black', 'gray', 'navy'], 'force'],
  ['bottom', 'брюки', 'спортивные штаны с лампасами', 'p', 'track pants with white side stripes', 'прямой', 'u', 'полиэстер', 'демисезон', 'спорт', ['black', 'navy', 'green']],
  ['bottom', 'шорты', 'велосипедки', 'p', 'biker shorts', 'приталенный', 'f', 'эластан', 'лёгкая', 'спорт', ['black', 'gray'], 'force'],
  ['bottom', 'юбка', 'кожаная мини-юбка', 'f', 'faux leather mini skirt', 'прямой', 'f', 'кожа', 'демисезон', 'вечерний', ['black', 'brown']],
  ['shoes', 'кеды', 'слипоны', 'p', 'slip-on canvas sneakers', 'прямой', 'u', 'текстиль', 'демисезон', 'кэжуал', ['black', 'white'], 'force'],
  ['shoes', 'ботинки', 'дутики', 'p', 'puffy snow boots', 'прямой', 'u', 'нейлон', 'тёплая', 'кэжуал', ['black', 'white'], 'force'],
  ['shoes', 'кеды', 'кеды на платформе', 'p', 'platform canvas sneakers', 'прямой', 'f', 'текстиль', 'демисезон', 'кэжуал', ['white', 'black'], 'force'],
  ['shoes', 'ботинки', 'ботинки на каблуке', 'p', 'heeled ankle boots', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['beige'], 'force'],
  ['shoes', 'лоферы', 'балетки', 'p', 'leather ballet flats', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['white'], 'force'],
  ['bag', 'сумка', 'сумка-ведро', 'f', 'drawstring bucket bag with a strap', 'прямой', 'f', 'кожа', 'демисезон', 'кэжуал', ['black', 'brown', 'beige']],
  ['bag', 'сумка', 'поясная сумка', 'f', 'belt bag sling, nylon', 'прямой', 'u', 'нейлон', 'лёгкая', 'спорт', ['black', 'gray'], 'force'],
  ['bag', 'сумка', 'спортивная сумка', 'f', 'duffle gym bag with shoulder strap', 'прямой', 'u', 'нейлон', 'лёгкая', 'спорт', ['black', 'navy'], 'force'],
  ['bag', 'сумка', 'сумка-тоут', 'f', 'structured leather tote bag with two handles, handles attached to the bag body', 'прямой', 'f', 'кожа', 'демисезон', 'смарт-кэжуал', ['white'], 'force'],
]

const adj = (ruColor, rod) => {
  const soft = ruColor.endsWith('яя')
  const base = ruColor.replace(/(ая|яя)$/, '')
  if (rod === 'f') return ruColor
  if (rod === 'm') return base + (soft ? 'ий' : 'ый')
  if (rod === 'p') return base + (soft ? 'ие' : 'ые')
  return base + (soft ? 'ее' : 'ое')
}
const BAD = new Set(['shoes-heeled-ankle-boots-beige', 'top-oversized-vertical-striped-shirt-navy', 'bag-structured-leather-tote-bag-white', 'bottom-high-waist-sport-leggings-black', 'outer-quilted-puffer-vest-without-black', 'outer-quilted-puffer-vest-without-beige', 'outer-quilted-puffer-vest-without-green', 'top-ribbed-tank-top-white', 'top-ribbed-tank-top-black', 'top-ribbed-tank-top-gray'])
const SKIP = new Set([...BAD, 'dress-shirt-dress-with-belt-white', 'dress-shirt-dress-with-belt-beige', 'outer-lightweight-nylon-windbreaker-navy', 'outer-fleece-zip-up-jacket-gray', 'accessory-bucket-hat-black', 'top-fitted-turtleneck-top-beige', 'shoes-heeled-ankle-boots-beige', 'top-oversized-vertical-striped-shirt-navy', 'bag-structured-leather-tote-bag-white', 'bottom-high-waist-sport-leggings-black', 'shoes-hiking-boots-green', 'bag-structured-leather-tote-bag-white'])
import { existsSync, readFileSync } from 'node:fs'
const rj = new URL('./rejected.json', import.meta.url)
if (existsSync(rj)) for (const r of JSON.parse(readFileSync(rj, 'utf8'))) if (/определили/.test(r.why)) SKIP.add(r.id)
const list = []
for (const [category, type, ru, rod, en, fit, sex, material, warmth, formality, colors, force] of T) {
  for (const ck of colors) {
    const [colorName, color, ruColor, enColor] = C[ck]
    const cn = adj(ruColor, rod)
    const who = sex === 'f' ? "women's " : ''
    const id0 = `${category}-${en.split(/[ ,]+/).slice(0, 4).join('-').replace(/[^a-z-]+/g, '')}-${ck}`
    if (SKIP.has(id0) && !(force && !BAD.has(id0))) continue
    list.push({
      id: `${category}-${en.split(/[ ,]+/).slice(0, 4).join('-').replace(/[^a-z-]+/g, '')}-${ck}`,
      force: force === 'force' || undefined, category, type, title: `${cn[0].toUpperCase()}${cn.slice(1)} ${ru}`.replace(/(Белая|Чёрная|Серая|Бежевая) (\S+)/, (m) => m), colorName, color, gender: sex,
      tags: [fit, material, formality], material, fit, warmth, formality,
      prompt: `Studio product photo of a single ${enColor} ${who}${en}, ${category === 'shoes' ? 'pair of shoes, side three-quarter view' : 'front view'}, centered, soft even daylight, plain light gray background, clean minimal design, no model, no text, no logo, no tag, realistic fabric texture, e-commerce style`,
    })
  }
}
const byId = new Map()
for (const e of list) { const o = byId.get(e.id); if (!o || (e.force && !o.force)) byId.set(e.id, e) }
const uniq = [...byId.values()]
writeFileSync(new URL('./list.json', import.meta.url), JSON.stringify(uniq, null, 1))
console.log(`в списке ${uniq.length}`)
