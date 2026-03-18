import type { UserProfile, WardrobeItem, WeatherSnapshot } from "../types";

export function buildStylistPrompt(args: {
  userProfile: UserProfile;
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  occasion: string;
}) {
  const { userProfile, wardrobeItems, weather, occasion } = args;

  return [
    "Ты AI-стилист мобильного приложения. Ответ должен опираться только на вещи пользователя и текущую погоду.",
    "Собери 5 слотов: верх, низ, верхняя одежда, обувь, аксессуары.",
    "Учитывай температуру, ветер, вероятность осадков, любимый стиль пользователя и палитру гардероба.",
    "Дай краткое объяснение по каждому слоту и 2 рекомендации из магазинов, если хочешь усилить образ.",
    "Тон ответа: короткий, практичный, на русском.",
    `Повод: ${occasion}.`,
    `Пользователь: ${JSON.stringify(userProfile)}.`,
    `Погода: ${JSON.stringify(weather)}.`,
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
