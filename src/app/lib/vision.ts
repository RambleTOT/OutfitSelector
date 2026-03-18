import { buildDigitizationPrompt } from "./prompts";
import type { WardrobeCategory, WardrobeItem } from "../types";

const remoteVisionApiUrl = import.meta.env.VITE_VISION_API_URL;
const remoteVisionApiToken = import.meta.env.VITE_VISION_API_TOKEN;

const categoryFallbacks: Record<
  WardrobeCategory,
  {
    name: string;
    brand: string;
    material: string;
    fit: string;
    note: string;
    warmth: number;
    seasons: string[];
    styleTags: string[];
    palette: string[];
  }
> = {
  Верх: {
    name: "Базовый верх",
    brand: "AI Capsule",
    material: "Хлопок",
    fit: "Regular fit",
    note: "Хорошая база для городских и офисных образов.",
    warmth: 2,
    seasons: ["весна", "лето", "осень"],
    styleTags: ["город", "минимализм", "повседневный"],
    palette: ["молочный", "серый"],
  },
  Низ: {
    name: "Структурированный низ",
    brand: "AI Capsule",
    material: "Смесовая ткань",
    fit: "Straight fit",
    note: "Собирает капсулу и поддерживает многослойность.",
    warmth: 3,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "офис", "минимализм"],
    palette: ["серый", "черный"],
  },
  "Верхняя одежда": {
    name: "Внешний слой",
    brand: "AI Capsule",
    material: "Плотный хлопок",
    fit: "Relaxed fit",
    note: "Добавляет структурный слой и помогает при ветре.",
    warmth: 4,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "офис", "минимализм"],
    palette: ["бежевый", "черный"],
  },
  Обувь: {
    name: "Городская обувь",
    brand: "AI Capsule",
    material: "Кожа",
    fit: "Classic",
    note: "Подходит под быстрый городской ритм.",
    warmth: 3,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "повседневный", "минимализм"],
    palette: ["черный", "белый"],
  },
  Аксессуары: {
    name: "Акцентный аксессуар",
    brand: "AI Capsule",
    material: "Смесовая ткань",
    fit: "Soft",
    note: "Завершает образ без перегруза.",
    warmth: 1,
    seasons: ["весна", "лето", "осень", "зима"],
    styleTags: ["акцент", "город", "минимализм"],
    palette: ["черный", "красный"],
  },
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function hashString(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function detectCategory(fileName: string): WardrobeCategory {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("shoe") || normalized.includes("sneaker") || normalized.includes("boot")) {
    return "Обувь";
  }

  if (normalized.includes("coat") || normalized.includes("jacket") || normalized.includes("trench")) {
    return "Верхняя одежда";
  }

  if (normalized.includes("pant") || normalized.includes("jean") || normalized.includes("skirt")) {
    return "Низ";
  }

  if (normalized.includes("bag") || normalized.includes("scarf") || normalized.includes("belt")) {
    return "Аксессуары";
  }

  return "Верх";
}

function createLocalDigitizedItem(file: File) {
  const category = detectCategory(file.name);
  const base = categoryFallbacks[category];
  const seed = hashString(file.name);
  const extractedAt = new Date().toISOString();
  const confidence = 0.88 + (seed % 10) / 100;
  const accents = [
    "молочный",
    "черный",
    "графит",
    "бежевый",
    "пудровый",
    "красный",
  ];
  const accent = accents[seed % accents.length];
  const derivedName =
    category === "Верх"
      ? "Оцифрованный верх"
      : category === "Низ"
        ? "Оцифрованный низ"
        : category === "Обувь"
          ? "Оцифрованная обувь"
          : category === "Аксессуары"
            ? "Оцифрованный аксессуар"
            : "Оцифрованная верхняя одежда";

  return {
    id: crypto.randomUUID(),
    image: URL.createObjectURL(file),
    name: `${derivedName} ${seed % 7 + 1}`,
    brand: base.brand,
    category,
    warmth: base.warmth,
    seasons: base.seasons,
    styleTags: [...base.styleTags],
    palette: Array.from(new Set([...base.palette, accent])),
    material: base.material,
    fit: base.fit,
    note: base.note,
    waterResistant: category === "Обувь" || category === "Верхняя одежда",
    source: "digitized" as const,
    ai: {
      extractedAt,
      confidence: Number(confidence.toFixed(2)),
      silhouette: base.fit,
      palette: Array.from(new Set([...base.palette, accent])),
      summary: `AI-модель выделила вещь с фото, определила категорию "${category}" и подготовила цифровую карточку.`,
      model: "Wardrobe Vision Demo",
    },
  } satisfies WardrobeItem;
}

function normalizeVisionPayload(payload: any, fallback: WardrobeItem) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return {
    ...fallback,
    name: payload.name ?? fallback.name,
    brand: payload.brand ?? fallback.brand,
    category: payload.category ?? fallback.category,
    warmth: payload.warmth ?? fallback.warmth,
    seasons: payload.seasons ?? fallback.seasons,
    styleTags: payload.styleTags ?? fallback.styleTags,
    palette: payload.palette ?? fallback.palette,
    material: payload.material ?? fallback.material,
    fit: payload.fit ?? fallback.fit,
    note: payload.note ?? fallback.note,
    ai: {
      extractedAt: new Date().toISOString(),
      confidence: payload.confidence ?? fallback.ai.confidence,
      silhouette: payload.silhouette ?? fallback.ai.silhouette,
      palette: payload.palette ?? fallback.ai.palette,
      summary: payload.summary ?? fallback.ai.summary,
      model: payload.model ?? "Remote Vision",
    },
  } satisfies WardrobeItem;
}

async function requestRemoteDigitization(file: File, fallback: WardrobeItem) {
  if (!remoteVisionApiUrl) {
    return fallback;
  }

  const image = await fileToDataUrl(file);
  const response = await fetch(remoteVisionApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(remoteVisionApiToken ? { Authorization: `Bearer ${remoteVisionApiToken}` } : {}),
    },
    body: JSON.stringify({
      prompt: buildDigitizationPrompt(file.name),
      image,
    }),
  });

  if (!response.ok) {
    throw new Error("Vision endpoint returned a non-200 response");
  }

  const payload = await response.json();
  return normalizeVisionPayload(payload, fallback);
}

export async function digitizeWardrobePhoto(file: File) {
  const fallback = createLocalDigitizedItem(file);

  await wait(1400);

  try {
    return await requestRemoteDigitization(file, fallback);
  } catch (error) {
    console.error("vision:error", error);
    return fallback;
  }
}
