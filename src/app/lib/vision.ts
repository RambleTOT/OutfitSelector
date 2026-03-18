import { mockShopCatalog, mockWardrobeItems } from "../data/mockData";
import {
  buildDigitizationPrompt,
  buildSegmentationPrompt,
  buildSimilarImageSearchPrompt,
} from "./prompts";
import type { WardrobeCategory, WardrobeItem } from "../types";

const remoteVisionApiUrl = import.meta.env.VITE_VISION_API_URL;
const remoteVisionApiToken = import.meta.env.VITE_VISION_API_TOKEN;
const segmentationApiUrl = import.meta.env.VITE_SEGMENTATION_API_URL;
const segmentationApiToken = import.meta.env.VITE_SEGMENTATION_API_TOKEN;
const segmentationModel = import.meta.env.VITE_SEGMENTATION_MODEL ?? "BiRefNet";
const similarSearchApiUrl = import.meta.env.VITE_SIMILAR_SEARCH_API_URL;
const similarSearchApiToken = import.meta.env.VITE_SIMILAR_SEARCH_API_TOKEN;
const similarSearchModel =
  import.meta.env.VITE_SIMILAR_SEARCH_MODEL ?? "Internet Similar Product Search";

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
  золотой: "#C3A35D",
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
  },
};

interface SimilarProductPhoto {
  image: string;
  name?: string;
  brand?: string;
  category?: WardrobeCategory;
  palette?: string[];
  sourceLabel: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function hashString(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function normalizePaletteValues(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

function normalizeCategory(value: unknown): WardrobeCategory | null {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized.includes("верхняя") || normalized.includes("outer") || normalized.includes("jacket")) {
    return "Верхняя одежда";
  }

  if (normalized.includes("обув") || normalized.includes("shoe") || normalized.includes("boot")) {
    return "Обувь";
  }

  if (normalized.includes("аксесс") || normalized.includes("access") || normalized.includes("bag")) {
    return "Аксессуары";
  }

  if (normalized.includes("низ") || normalized.includes("bottom") || normalized.includes("pant")) {
    return "Низ";
  }

  if (normalized.includes("верх") || normalized.includes("top") || normalized.includes("shirt")) {
    return "Верх";
  }

  return null;
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

async function extractPaletteNames(dataUrl: string, fallbackPalette: string[]) {
  if (typeof document === "undefined") {
    return fallbackPalette;
  }

  try {
    const image = await dataUrlToImage(dataUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return fallbackPalette;
    }

    const maxSize = 48;
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const { data } = context.getImageData(0, 0, width, height);
    const counts = new Map<string, number>();

    for (let index = 0; index < data.length; index += 16) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      const brightness = (r + g + b) / 3;

      if (a < 120 || brightness > 244) {
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

function buildLocalSimilarSearchPool(): SimilarProductPhoto[] {
  const wardrobePool = mockWardrobeItems.map((item) => ({
    image: item.image,
    name: item.name,
    brand: item.brand,
    category: item.category,
    palette: item.palette,
    sourceLabel: "Local Product Catalog",
  }));

  const shopPool = mockShopCatalog.map((item) => ({
    image: item.image,
    name: item.title,
    brand: item.brand,
    category: item.category,
    palette: item.palette,
    sourceLabel: "Local Product Catalog",
  }));

  return [...wardrobePool, ...shopPool];
}

function scoreSimilarSearchCandidate(args: {
  candidate: SimilarProductPhoto;
  category: WardrobeCategory;
  palette: string[];
  fileName: string;
}) {
  const { candidate, category, palette, fileName } = args;
  const normalizedFileName = fileName.toLowerCase();
  const keywordScore =
    candidate.name
      ?.toLowerCase()
      .split(/[\s/-]+/)
      .filter((word) => word.length > 3 && normalizedFileName.includes(word)).length ?? 0;
  const paletteOverlap = candidate.palette?.filter((value) => palette.includes(value)).length ?? 0;

  return (
    (candidate.category === category ? 8 : 0) +
    paletteOverlap * 3 +
    keywordScore * 2 +
    (candidate.brand ? 1 : 0)
  );
}

function findLocalSimilarProductPhoto(args: {
  category: WardrobeCategory;
  palette: string[];
  fileName: string;
}) {
  return buildLocalSimilarSearchPool()
    .sort(
      (left, right) =>
        scoreSimilarSearchCandidate({ candidate: right, ...args }) -
        scoreSimilarSearchCandidate({ candidate: left, ...args }),
    )[0];
}

function averageCornerColor(data: Uint8ClampedArray, width: number, height: number) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const result = points.reduce(
    (acc, [x, y]) => {
      const index = (y * width + x) * 4;
      acc.r += data[index];
      acc.g += data[index + 1];
      acc.b += data[index + 2];
      return acc;
    },
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: result.r / points.length,
    g: result.g / points.length,
    b: result.b / points.length,
  };
}

function colorDistance(
  r: number,
  g: number,
  b: number,
  background: { r: number; g: number; b: number },
) {
  return Math.sqrt(
    (r - background.r) ** 2 +
      (g - background.g) ** 2 +
      (b - background.b) ** 2,
  );
}

async function localSegmentClothing(file: File) {
  const originalDataUrl = await fileToDataUrl(file);

  if (typeof document === "undefined") {
    return originalDataUrl;
  }

  const image = await dataUrlToImage(originalDataUrl);
  const workingCanvas = document.createElement("canvas");
  const context = workingCanvas.getContext("2d");

  if (!context) {
    return originalDataUrl;
  }

  const maxSize = 900;
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  workingCanvas.width = width;
  workingCanvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const background = averageCornerColor(data, width, height);
  const bgMask = new Uint8Array(width * height);
  const queue: number[] = [];
  const threshold = 42;

  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const index = y * width + x;

    if (bgMask[index]) {
      return;
    }

    const offset = index * 4;
    const distance = colorDistance(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      background,
    );

    if (distance < threshold) {
      bgMask[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length) {
    const index = queue.shift()!;
    const x = index % width;
    const y = Math.floor(index / width);

    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;

    if (bgMask[index]) {
      data[offset + 3] = 0;
      continue;
    }

    const alpha = data[offset + 3];

    if (alpha < 40) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (minX >= maxX || minY >= maxY) {
    return originalDataUrl;
  }

  context.putImageData(imageData, 0, 0);

  const padding = Math.round(Math.max(maxX - minX, maxY - minY) * 0.14);
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + padding * 2);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 720;
  outputCanvas.height = 960;
  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    return originalDataUrl;
  }

  outputContext.fillStyle = "#F5F1EB";
  outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputContext.shadowColor = "rgba(0,0,0,0.14)";
  outputContext.shadowBlur = 34;
  outputContext.shadowOffsetY = 18;

  const targetScale = Math.min(
    (outputCanvas.width * 0.74) / cropWidth,
    (outputCanvas.height * 0.74) / cropHeight,
  );
  const drawWidth = cropWidth * targetScale;
  const drawHeight = cropHeight * targetScale;
  const drawX = (outputCanvas.width - drawWidth) / 2;
  const drawY = (outputCanvas.height - drawHeight) / 2;

  outputContext.drawImage(
    workingCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );

  return outputCanvas.toDataURL("image/png");
}

async function requestRemoteSegmentation(file: File) {
  if (!segmentationApiUrl) {
    return null;
  }

  const image = await fileToDataUrl(file);
  const response = await fetch(segmentationApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(segmentationApiToken ? { Authorization: `Bearer ${segmentationApiToken}` } : {}),
    },
    body: JSON.stringify({
      model: segmentationModel,
      prompt: buildSegmentationPrompt(file.name),
      image,
    }),
  });

  if (!response.ok) {
    throw new Error("Segmentation endpoint returned a non-200 response");
  }

  const payload = await response.json();
  return payload.image ?? payload.cutout ?? null;
}

async function segmentPhoto(file: File) {
  try {
    const remoteResult = await requestRemoteSegmentation(file);

    if (remoteResult) {
      return {
        image: remoteResult,
        model: segmentationModel,
      };
    }
  } catch (error) {
    console.error("segmentation:remote", error);
  }

  return {
    image: await localSegmentClothing(file),
    model: "Local Background Segmentation",
  };
}

function normalizeRemoteSearchPayload(
  payload: any,
  fallbackCategory: WardrobeCategory,
): SimilarProductPhoto | null {
  const normalizedPayload =
    payload?.choices?.[0]?.message?.content
      ? JSON.parse(payload.choices[0].message.content)
      : payload;

  if (!normalizedPayload) {
    return null;
  }

  const directImage = typeof normalizedPayload.image === "string" ? normalizedPayload.image : null;

  if (directImage) {
    return {
      image: directImage,
      name: normalizedPayload.name,
      brand: normalizedPayload.brand,
      category: normalizeCategory(normalizedPayload.category) ?? fallbackCategory,
      palette: normalizePaletteValues(normalizedPayload.palette),
      sourceLabel: similarSearchModel,
    };
  }

  if (!Array.isArray(normalizedPayload.results)) {
    return null;
  }

  const candidate = normalizedPayload.results
    .filter((item: any) => typeof item?.image === "string")
    .filter((item: any) => item?.hasPerson === false || item?.containsHuman === false)
    .map((item: any) => ({
      image: String(item.image),
      name: item.name ? String(item.name) : undefined,
      brand: item.brand ? String(item.brand) : undefined,
      category: normalizeCategory(item.category) ?? fallbackCategory,
      palette: normalizePaletteValues(item.palette),
      sourceLabel: similarSearchModel,
    } satisfies SimilarProductPhoto))[0];

  return candidate ?? null;
}

async function requestRemoteSimilarProductPhoto(args: {
  file: File;
  category: WardrobeCategory;
  palette: string[];
  segmentedImage: string;
}) {
  if (!similarSearchApiUrl) {
    return null;
  }

  const originalImage = await fileToDataUrl(args.file);
  const response = await fetch(similarSearchApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(similarSearchApiToken ? { Authorization: `Bearer ${similarSearchApiToken}` } : {}),
    },
    body: JSON.stringify({
      model: similarSearchModel,
      prompt: buildSimilarImageSearchPrompt({
        fileName: args.file.name,
        category: args.category,
        palette: args.palette,
      }),
      image: originalImage,
      segmentedImage: args.segmentedImage,
      category: args.category,
      palette: args.palette,
    }),
  });

  if (!response.ok) {
    throw new Error("Similar search endpoint returned a non-200 response");
  }

  return normalizeRemoteSearchPayload(await response.json(), args.category);
}

async function findBestCleanProductPhoto(args: {
  file: File;
  category: WardrobeCategory;
  palette: string[];
  segmentedImage: string;
}) {
  try {
    const remoteResult = await requestRemoteSimilarProductPhoto(args);

    if (remoteResult) {
      return remoteResult;
    }
  } catch (error) {
    console.error("similar-search:remote", error);
  }

  return findLocalSimilarProductPhoto({
    category: args.category,
    palette: args.palette,
    fileName: args.file.name,
  });
}

async function createLocalDigitizedItem(file: File) {
  const category = detectCategory(file.name);
  const base = categoryFallbacks[category];
  const seed = hashString(file.name);
  const extractedAt = new Date().toISOString();
  const confidence = 0.88 + (seed % 10) / 100;
  const segmented = await segmentPhoto(file);
  const segmentedPalette = await extractPaletteNames(segmented.image, base.palette);
  const similarProduct = await findBestCleanProductPhoto({
    file,
    category,
    palette: segmentedPalette,
    segmentedImage: segmented.image,
  });
  const resolvedCategory = similarProduct?.category ?? category;
  const resolvedBase = categoryFallbacks[resolvedCategory];
  const resolvedImage = similarProduct?.image ?? segmented.image;
  const palette = await extractPaletteNames(
    resolvedImage,
    similarProduct?.palette?.length ? similarProduct.palette : resolvedBase.palette,
  );

  return {
    id: crypto.randomUUID(),
    image: resolvedImage,
    name: similarProduct?.name ?? `${resolvedBase.name} ${seed % 7 + 1}`,
    brand: similarProduct?.brand ?? resolvedBase.brand,
    category: resolvedCategory,
    warmth: resolvedBase.warmth,
    seasons: resolvedBase.seasons,
    styleTags: [...resolvedBase.styleTags],
    palette,
    material: resolvedBase.material,
    fit: resolvedBase.fit,
    note: resolvedBase.note,
    waterResistant:
      resolvedCategory === "Обувь" || resolvedCategory === "Верхняя одежда",
    source: "digitized" as const,
    ai: {
      extractedAt,
      confidence: Number(confidence.toFixed(2)),
      silhouette: resolvedBase.fit,
      palette,
      summary: similarProduct
        ? "По исходному фото найден похожий товарный кадр без человека, и вещь сохранена как clean product card."
        : "Одежда вырезана из исходного фото, очищена от фона и сохранена как отдельная карточка вещи.",
      model: similarProduct
        ? `${segmented.model} + ${similarProduct.sourceLabel}`
        : segmented.model,
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
      model: payload.model ?? fallback.ai.model,
    },
  } satisfies WardrobeItem;
}

async function requestRemoteDigitization(segmentedImage: string, fileName: string, fallback: WardrobeItem) {
  if (!remoteVisionApiUrl) {
    return fallback;
  }

  const response = await fetch(remoteVisionApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(remoteVisionApiToken ? { Authorization: `Bearer ${remoteVisionApiToken}` } : {}),
    },
    body: JSON.stringify({
      prompt: buildDigitizationPrompt(fileName),
      image: segmentedImage,
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
    return await requestRemoteDigitization(fallback.image, file.name, fallback);
  } catch (error) {
    console.error("vision:error", error);
    return fallback;
  }
}
