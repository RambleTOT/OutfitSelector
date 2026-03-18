import type {
  GeneratedOutfit,
  OutfitGenerationOptions,
  UserProfile,
  WardrobeItem,
  WeatherSnapshot,
} from "../types";

export function buildStylistPrompt(args: {
  userProfile: UserProfile;
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  occasion: string;
  options: OutfitGenerationOptions;
  previousLooks: GeneratedOutfit[];
}) {
  const { userProfile, wardrobeItems, weather, occasion, options, previousLooks } = args;

  return [
    "Ты опытный AI-стилист мобильного приложения.",
    "Твоя задача: выдать реальный носибельный образ на сегодня только на основе вещей пользователя, погоды и опций генерации.",
    "Собери 5 слотов: верх, низ, верхняя одежда, обувь, аксессуары.",
    "Не используй вымышленные вещи. В slots должны попадать только itemId из гардероба пользователя.",
    "Учитывай температуру, ощущаемую температуру, ветер, осадки, любимый стиль пользователя и палитру гардероба.",
    "Если включена опция учитывать прошлые образы, старайся не повторять недавние комбинации.",
    "Если включена опция избегать повтора вещей, снижай повтор itemId из последних образов.",
    "Если включена опция preferClassicStyle, выбирай более классические и структурные вещи.",
    "Если includeStoreRecommendations=false, верни пустой массив storeRecommendations.",
    "Тон ответа: короткий, точный, практичный, на русском языке.",
    `Повод: ${occasion}.`,
    `Опции генерации: ${JSON.stringify(options)}.`,
    `Пользователь: ${JSON.stringify(userProfile)}.`,
    `Погода: ${JSON.stringify(weather)}.`,
    `Последние образы: ${JSON.stringify(
      previousLooks.slice(0, 5).map((look) => ({
        id: look.id,
        title: look.title,
        occasion: look.occasion,
        slots: look.slots.map((slot) => ({
          key: slot.key,
          itemId: slot.item?.id ?? null,
          itemName: slot.item?.name ?? null,
        })),
      })),
    )}.`,
    `Гардероб: ${JSON.stringify(
      wardrobeItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        warmth: item.warmth,
        palette: item.palette,
        styleTags: item.styleTags,
        note: item.note,
      })),
    )}.`,
    "Верни JSON с полями title, summary, weatherNote, stylistNote, slots, storeRecommendations.",
    "slots должен быть массивом объектов формата { key, reason, itemId }.",
    "storeRecommendations должен быть массивом максимум из 2 объектов.",
  ].join("\n");
}

export function buildDigitizationPrompt(fileName: string) {
  return [
    "Ты vision-модель для цифрового гардероба.",
    "По фото одежды верни JSON с категорией, названием вещи, материалом, силуэтом, палитрой, стилевыми тегами и кратким описанием.",
    "Важно: это мобильное fashion-приложение, поэтому ответ должен быть коротким и пригодным для карточки вещи.",
    `Имя файла: ${fileName}.`,
  ].join("\n");
}

export function buildSegmentationPrompt(fileName: string) {
  return [
    "Ты модель выделения одежды для цифрового гардероба.",
    "Тебе нужно убрать человека и фон, оставить только саму вещь.",
    "Результат должен быть как чистая product photo на однотонном фоне, пригодная для карточки товара.",
    `Имя файла: ${fileName}.`,
  ].join("\n");
}

export function buildSimilarImageSearchPrompt(args: {
  fileName: string;
  category: string;
  palette: string[];
}) {
  const { fileName, category, palette } = args;

  return [
    "Ты ассистент для интернет-поиска одежды.",
    "По фото пользователя найди в интернете похожие варианты одежды.",
    "Выбери только clean product photo без человека, без рук, без модели и без сложного фона.",
    "Подходят только фотографии, где видна одна вещь на однотонном фоне или в формате каталога.",
    "Верни JSON с полями results.",
    "results должен быть массивом максимум из 5 объектов формата { image, name, brand, category, palette, hasPerson }.",
    "hasPerson должен быть false для подходящих результатов.",
    `Имя файла: ${fileName}.`,
    `Ожидаемая категория: ${category}.`,
    `Ожидаемая палитра: ${palette.join(", ")}.`,
  ].join("\n");
}
