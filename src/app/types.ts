export type WardrobeCategory =
  | "Верх"
  | "Низ"
  | "Верхняя одежда"
  | "Обувь"
  | "Аксессуары";

export type WeatherMood = "clear" | "clouds" | "rain" | "snow";

export type OutfitSlotKey =
  | "top"
  | "bottom"
  | "outerwear"
  | "shoes"
  | "accessories";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  height: string;
  weight: string;
  size: string;
  styleFocus: string;
  fitPreference: string;
  city: string;
}

export interface WardrobeAIData {
  extractedAt: string;
  confidence: number;
  silhouette: string;
  palette: string[];
  summary: string;
  model: string;
}

export interface WardrobeItem {
  id: string;
  image: string;
  name: string;
  brand: string;
  category: WardrobeCategory;
  warmth: number;
  seasons: string[];
  styleTags: string[];
  palette: string[];
  material: string;
  fit: string;
  note: string;
  waterResistant?: boolean;
  source: "mock" | "digitized";
  ai: WardrobeAIData;
}

export interface FeedItem {
  id: string;
  image: string;
  title: string;
  brand: string;
  likes: number;
  note: string;
}

export interface FavoriteLook {
  id: string;
  image: string;
  title: string;
  brand: string;
  note: string;
}

export interface ShopRecommendation {
  id: string;
  image: string;
  title: string;
  brand: string;
  price: string;
  category: WardrobeCategory;
  palette: string[];
  weatherTags: Array<WeatherMood | "wind">;
  styleTags: string[];
  reason: string;
}

export interface WeatherSnapshot {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
  precipitationProbability: number;
  condition: string;
  mood: WeatherMood;
  advice: string;
  fetchedAt: string;
  source: "live" | "fallback";
}

export interface OutfitSlot {
  key: OutfitSlotKey;
  title: string;
  reason: string;
  item: WardrobeItem | null;
}

export interface GeneratedOutfit {
  id: string;
  createdAt: string;
  occasion: string;
  title: string;
  summary: string;
  weatherNote: string;
  stylistNote: string;
  source: "local-llm" | "remote-llm" | "fallback";
  slots: OutfitSlot[];
  storeRecommendations: ShopRecommendation[];
}

export interface OutfitGenerationOptions {
  considerPreviousLooks: boolean;
  avoidRepeatingItems: boolean;
  includeStoreRecommendations: boolean;
  preferClassicStyle: boolean;
}

export interface AuthCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface StoredUserRecord {
  phoneKey: string;
  passwordHash: string;
  profile: UserProfile;
  wardrobeItems: WardrobeItem[];
  favoriteLooks: FavoriteLook[];
  latestOutfit: GeneratedOutfit | null;
  outfitHistory: GeneratedOutfit[];
  lastDigitizedItem: WardrobeItem | null;
  createdAt: string;
  updatedAt: string;
}
