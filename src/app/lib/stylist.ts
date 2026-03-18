import { mockShopCatalog } from "../data/mockData";
import { buildStylistPrompt } from "./prompts";
import type {
  GeneratedOutfit,
  OutfitSlot,
  OutfitSlotKey,
  ShopRecommendation,
  UserProfile,
  WardrobeCategory,
  WardrobeItem,
  WeatherSnapshot,
} from "../types";

const slotConfig: Array<{ key: OutfitSlotKey; title: string; category: WardrobeCategory }> = [
  { key: "top", title: "Верх", category: "Верх" },
  { key: "bottom", title: "Низ", category: "Низ" },
  { key: "outerwear", title: "Верхняя одежда", category: "Верхняя одежда" },
  { key: "shoes", title: "Обувь", category: "Обувь" },
  { key: "accessories", title: "Аксессуары", category: "Аксессуары" },
];

const remoteApiUrl = import.meta.env.VITE_STYLIST_API_URL;
const remoteApiToken = import.meta.env.VITE_STYLIST_API_TOKEN;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTargetWarmth(weather: WeatherSnapshot) {
  if (weather.apparentTemperature <= 0) return 5;
  if (weather.apparentTemperature <= 7) return 4;
  if (weather.apparentTemperature <= 14) return 3;
  if (weather.apparentTemperature <= 21) return 2;
  return 1;
}

function getOccasionTags(occasion: string) {
  const normalized = occasion.toLowerCase();

  if (normalized.includes("офис")) {
    return ["офис", "минимализм", "город"];
  }

  if (normalized.includes("встреч")) {
    return ["вечер", "офис", "акцент"];
  }

  if (normalized.includes("прогул")) {
    return ["город", "повседневный", "travel"];
  }

  return ["город", "повседневный", "минимализм"];
}

function scoreItem(
  item: WardrobeItem,
  weather: WeatherSnapshot,
  preferredTags: string[],
  userProfile: UserProfile,
) {
  const targetWarmth = getTargetWarmth(weather);
  const warmthScore = 12 - Math.abs(item.warmth - targetWarmth) * 3;
  const styleScore = item.styleTags.filter((tag) => preferredTags.includes(tag)).length * 4;
  const personalScore = item.note
    .toLowerCase()
    .includes(userProfile.fitPreference.toLowerCase().split(" ")[0] ?? "")
    ? 2
    : 0;
  const rainScore =
    weather.mood === "rain" && item.waterResistant
      ? 6
      : weather.mood === "rain" && !item.waterResistant && item.category !== "Верх"
        ? -2
        : 0;
  const paletteScore = item.palette.includes("черный") || item.palette.includes("молочный") ? 2 : 0;

  return warmthScore + styleScore + personalScore + rainScore + paletteScore;
}

function pickItem(
  wardrobeItems: WardrobeItem[],
  category: WardrobeCategory,
  weather: WeatherSnapshot,
  preferredTags: string[],
  userProfile: UserProfile,
) {
  const options = wardrobeItems.filter((item) => item.category === category);

  if (!options.length) {
    return null;
  }

  return [...options].sort(
    (left, right) =>
      scoreItem(right, weather, preferredTags, userProfile) -
      scoreItem(left, weather, preferredTags, userProfile),
  )[0];
}

function buildSlotReason(
  item: WardrobeItem | null,
  slotTitle: string,
  weather: WeatherSnapshot,
  preferredTags: string[],
) {
  if (!item) {
    return `Для категории "${slotTitle}" сейчас нет подходящей вещи в цифровом гардеробе.`;
  }

  const tag = item.styleTags.find((value) => preferredTags.includes(value)) ?? item.styleTags[0];
  const weatherHint =
    weather.mood === "rain"
      ? "держит дождливый сценарий"
      : weather.apparentTemperature <= 8
        ? "помогает закрыть прохладную температуру"
        : "не перегружает образ по теплу";

  return `${item.name} поддерживает стиль "${tag}" и ${weatherHint}.`;
}

function buildStoreRecommendations(
  weather: WeatherSnapshot,
  preferredTags: string[],
  chosenItems: WardrobeItem[],
) {
  const pickedCategories = new Set(chosenItems.map((item) => item.category));

  return [...mockShopCatalog]
    .map((item) => ({
      item,
      score:
        (item.weatherTags.includes(weather.mood) ? 5 : 0) +
        item.styleTags.filter((tag) => preferredTags.includes(tag)).length * 3 +
        (pickedCategories.has(item.category) ? 1 : 4),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map(({ item }) => item);
}

function buildLocalOutfit(args: {
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  userProfile: UserProfile;
  occasion: string;
}): GeneratedOutfit {
  const { wardrobeItems, weather, userProfile, occasion } = args;
  const preferredTags = getOccasionTags(occasion);

  const slots: OutfitSlot[] = slotConfig.map((slot) => {
    const item = pickItem(
      wardrobeItems,
      slot.category,
      weather,
      preferredTags,
      userProfile,
    );

    return {
      key: slot.key,
      title: slot.title,
      item,
      reason: buildSlotReason(item, slot.title, weather, preferredTags),
    };
  });

  const chosenItems = slots.flatMap((slot) => (slot.item ? [slot.item] : []));
  const storeRecommendations = buildStoreRecommendations(weather, preferredTags, chosenItems);
  const baseTitle = `${occasion}: образ на ${weather.temperature}°C`;
  const accentRecommendation =
    weather.mood === "rain"
      ? "держи сумку и обувь в гладкой коже"
      : "оставь акцент на аксессуаре цвета FC7070";

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    occasion,
    title: baseTitle,
    summary: `Собрала капсулу из твоих вещей с учетом погоды в ${weather.city.toLowerCase()} и твоего стиля "${userProfile.styleFocus}".`,
    weatherNote: `${weather.condition}, ощущается как ${weather.apparentTemperature}°C. ${weather.advice}`,
    stylistNote: `Главная идея образа: спокойная база, собранный внешний слой и ${accentRecommendation}.`,
    source: "local-llm",
    slots,
    storeRecommendations,
  };
}

function normalizeRemoteRecommendations(payload: unknown): ShopRecommendation[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => item as Partial<ShopRecommendation>)
    .filter((item) => item.id && item.title && item.brand && item.category)
    .map((item) => ({
      id: item.id!,
      image: item.image ?? "",
      title: item.title!,
      brand: item.brand!,
      price: item.price ?? "По запросу",
      category: item.category as WardrobeCategory,
      palette: item.palette ?? [],
      weatherTags: item.weatherTags ?? ["clouds"],
      styleTags: item.styleTags ?? [],
      reason: item.reason ?? "Подобрано LLM-моделью.",
    }));
}

function normalizeRemoteOutfit(
  payload: any,
  fallback: GeneratedOutfit,
  wardrobeItems: WardrobeItem[],
): GeneratedOutfit {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const slotMap = new Map(wardrobeItems.map((item) => [item.id, item]));
  const remoteRecommendations = normalizeRemoteRecommendations(payload.storeRecommendations);
  const slots = Array.isArray(payload.slots)
    ? payload.slots
        .map((slot: any) => {
          const template = slotConfig.find((entry) => entry.key === slot?.key);

          if (!template) {
            return null;
          }

          return {
            key: template.key,
            title: template.title,
            reason: slot.reason ?? fallback.slots.find((item) => item.key === template.key)?.reason ?? "",
            item: slot.itemId ? slotMap.get(slot.itemId) ?? null : null,
          };
        })
        .filter(Boolean)
    : fallback.slots;

  return {
    ...fallback,
    title: payload.title ?? fallback.title,
    summary: payload.summary ?? fallback.summary,
    weatherNote: payload.weatherNote ?? fallback.weatherNote,
    stylistNote: payload.stylistNote ?? fallback.stylistNote,
    source: "remote-llm",
    slots: slots.length ? slots : fallback.slots,
    storeRecommendations:
      remoteRecommendations.length > 0 ? remoteRecommendations : fallback.storeRecommendations,
  };
}

async function requestRemoteOutfit(args: {
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  userProfile: UserProfile;
  occasion: string;
  fallback: GeneratedOutfit;
}) {
  if (!remoteApiUrl) {
    return args.fallback;
  }

  const response = await fetch(remoteApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(remoteApiToken ? { Authorization: `Bearer ${remoteApiToken}` } : {}),
    },
    body: JSON.stringify({
      prompt: buildStylistPrompt(args),
      wardrobeItems: args.wardrobeItems,
      weather: args.weather,
      userProfile: args.userProfile,
      occasion: args.occasion,
    }),
  });

  if (!response.ok) {
    throw new Error("LLM endpoint returned a non-200 response");
  }

  const payload = await response.json();
  return normalizeRemoteOutfit(payload, args.fallback, args.wardrobeItems);
}

export async function generateStylistOutfit(args: {
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  userProfile: UserProfile;
  occasion: string;
}) {
  const fallback = buildLocalOutfit(args);

  await wait(1200);

  try {
    return await requestRemoteOutfit({
      ...args,
      fallback,
    });
  } catch (error) {
    console.error("stylist:error", error);
    return {
      ...fallback,
      source: remoteApiUrl ? "fallback" : "local-llm",
    };
  }
}

export function createInitialOutfit(args: {
  wardrobeItems: WardrobeItem[];
  weather: WeatherSnapshot;
  userProfile: UserProfile;
}) {
  return buildLocalOutfit({
    ...args,
    occasion: "На каждый день",
  });
}
