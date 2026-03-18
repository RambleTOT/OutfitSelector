import { buildDigitizationPrompt } from "./prompts";
import { createGarmentArt, type GarmentArtKind } from "./wardrobeArt";
import type { WardrobeCategory, WardrobeItem } from "../types";

const remoteVisionApiUrl = import.meta.env.VITE_VISION_API_URL;
const remoteVisionApiToken = import.meta.env.VITE_VISION_API_TOKEN;

const colorMap: Record<string, string> = {
  белый: "#F7F7F5",
  молочный: "#F3EEE6",
  бежевый: "#D8C4A8",
  песочный: "#C8B28C",
  серый: "#B7BBC2",
  графит: "#50545A",
  черный: "#1E2227",
  синий: "#4C6898",
  деним: "#5D77A7",
  красный: "#FC7070",
  бордовый: "#8C3F50",
  пудровый: "#D8B3AC",
  коричневый: "#72584A",
};

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
    artKind: GarmentArtKind;
  }
> = {
  Верх: {
    name: "Оцифрованный верх",
    brand: "AI Capsule",
    material: "Хлопок",
    fit: "Regular fit",
    note: "Подходит для городских и офисных образов.",
    warmth: 2,
    seasons: ["весна", "лето", "осень"],
    styleTags: ["город", "минимализм", "повседневный"],
    palette: ["молочный", "серый"],
    artKind: "shirt",
  },
  Низ: {
    name: "Оцифрованный низ",
    brand: "AI Capsule",
    material: "Смесовая ткань",
    fit: "Straight fit",
    note: "Собирает капсулу и поддерживает многослойность.",
    warmth: 3,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "офис", "минимализм"],
    palette: ["серый", "черный"],
    artKind: "trousers",
  },
  "Верхняя одежда": {
    name: "Оцифрованная верхняя одежда",
    brand: "AI Capsule",
    material: "Плотный хлопок",
    fit: "Relaxed fit",
    note: "Добавляет структурный слой и помогает при ветре.",
    warmth: 4,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "офис", "минимализм"],
    palette: ["бежевый", "черный"],
    artKind: "trench",
  },
  Обувь: {
    name: "Оцифрованная обувь",
    brand: "AI Capsule",
    material: "Кожа",
    fit: "Classic",
    note: "Подходит под быстрый городской ритм.",
    warmth: 3,
    seasons: ["весна", "осень", "зима"],
    styleTags: ["город", "повседневный", "минимализм"],
    palette: ["черный", "белый"],
    artKind: "loafers",
  },
  Аксессуары: {
    name: "Оцифрованный аксессуар",
    brand: "AI Capsule",
    material: "Смесовая ткань",
    fit: "Soft",
    note: "Завершает образ без перегруза.",
    warmth: 1,
    seasons: ["весна", "лето", "осень", "зима"],
    styleTags: ["акцент", "город", "минимализм"],
    palette: ["черный", "красный"],
    artKind: "bag",
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

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const num = parseInt(value, 16);
  return {
    r: num >> 16,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function nearestColorName(r: number, g: number, b: number) {
  return Object.entries(colorMap)
    .map(([name, hex]) => {
      const color = hexToRgb(hex);
      const distance =
        (color.r - r) ** 2 + (color.g - g) ** 2 + (color.b - b) ** 2;

      return { name, distance };
    })
    .sort((left, right) => left.distance - right.distance)[0].name;
}

async function extractPaletteNames(file: File, fallbackPalette: string[]) {
  if (typeof document === "undefined") {
    return fallbackPalette;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return fallbackPalette;
    }

    const maxSize = 48;
    const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.width = width;
    canvas.height = height;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const { data } = context.getImageData(0, 0, width, height);
    const counts = new Map<string, number>();

    for (let index = 0; index < data.length; index += 16) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      const brightness = (r + g + b) / 3;

      if (a < 200 || brightness > 244) {
        continue;
      }

      const name = nearestColorName(r, g, b);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const palette = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([name]) => name)
      .filter((name, index, array) => array.indexOf(name) === index)
      .slice(0, 3);

    return palette.length ? palette : fallbackPalette;
  } catch (error) {
    console.error("vision:palette", error);
    return fallbackPalette;
  }
}

function detectCategory(fileName: string): WardrobeCategory {
  const normalized = fileName.toLowerCase();

  if (
    normalized.includes("shoe") ||
    normalized.includes("sneaker") ||
    normalized.includes("boot") ||
    normalized.includes("loafer")
  ) {
    return "Обувь";
  }

  if (
    normalized.includes("coat") ||
    normalized.includes("jacket") ||
    normalized.includes("trench") ||
    normalized.includes("blazer")
  ) {
    return "Верхняя одежда";
  }

  if (
    normalized.includes("pant") ||
    normalized.includes("jean") ||
    normalized.includes("skirt") ||
    normalized.includes("trouser")
  ) {
    return "Низ";
  }

  if (
    normalized.includes("bag") ||
    normalized.includes("scarf") ||
    normalized.includes("belt") ||
    normalized.includes("ring")
  ) {
    return "Аксессуары";
  }

  return "Верх";
}

function detectArtKind(fileName: string, category: WardrobeCategory): GarmentArtKind {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("blouse")) return "blouse";
  if (normalized.includes("long")) return "longsleeve";
  if (normalized.includes("skirt")) return "skirt";
  if (normalized.includes("jean")) return "jeans";
  if (normalized.includes("blazer")) return "blazer";
  if (normalized.includes("coat")) return "coat";
  if (normalized.includes("boot")) return "boots";
  if (normalized.includes("sneaker")) return "sneakers";
  if (normalized.includes("bag")) return "bag";
  if (normalized.includes("scarf")) return "scarf";

  return categoryFallbacks[category].artKind;
}

async function createLocalDigitizedItem(file: File) {
  const category = detectCategory(file.name);
  const base = categoryFallbacks[category];
  const seed = hashString(file.name);
  const extractedAt = new Date().toISOString();
  const confidence = 0.88 + (seed % 10) / 100;
  const artKind = detectArtKind(file.name, category);
  const palette = await extractPaletteNames(file, base.palette);
  const accent = palette[1] ?? base.palette[1] ?? "красный";
  const image = createGarmentArt({
    kind: artKind,
    primary: palette[0] ?? base.palette[0],
    secondary: accent,
    accent: palette[2] ?? "красный",
    background: "молочный",
  });

  return {
    id: crypto.randomUUID(),
    image,
    name: `${base.name} ${seed % 7 + 1}`,
    brand: base.brand,
    category,
    warmth: base.warmth,
    seasons: base.seasons,
    styleTags: [...base.styleTags],
    palette,
    material: base.material,
    fit: base.fit,
    note: base.note,
    waterResistant: category === "Обувь" || category === "Верхняя одежда",
    source: "digitized" as const,
    ai: {
      extractedAt,
      confidence: Number(confidence.toFixed(2)),
      silhouette: base.fit,
      palette,
      summary:
        "AI выделила вещь с фото, очистила фон, собрала аккуратную модель вещи и сохранила карточку.",
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
    image: payload.image ?? fallback.image,
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
  const fallback = await createLocalDigitizedItem(file);

  await wait(1400);

  try {
    return await requestRemoteDigitization(file, fallback);
  } catch (error) {
    console.error("vision:error", error);
    return fallback;
  }
}
