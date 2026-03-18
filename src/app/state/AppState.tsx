import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mockFavoriteLooks,
  mockFeedItems,
  mockUserProfile,
  mockWardrobeItems,
} from "../data/mockData";
import { createInitialOutfit, generateStylistOutfit } from "../lib/stylist";
import { digitizeWardrobePhoto } from "../lib/vision";
import { createFallbackWeather, getWeatherForCurrentLocation } from "../lib/weather";
import type {
  FavoriteLook,
  FeedItem,
  GeneratedOutfit,
  UserProfile,
  WardrobeItem,
  WeatherSnapshot,
} from "../types";

interface AppStateValue {
  userProfile: UserProfile;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  wardrobeItems: WardrobeItem[];
  feedItems: FeedItem[];
  favoriteLooks: FavoriteLook[];
  addLookToFavorites: (look: GeneratedOutfit) => void;
  latestOutfit: GeneratedOutfit | null;
  generateLook: (occasion: string) => Promise<GeneratedOutfit>;
  isGeneratingLook: boolean;
  generationError: string | null;
  weather: WeatherSnapshot;
  weatherLoading: boolean;
  weatherError: string | null;
  refreshWeather: () => Promise<WeatherSnapshot>;
  digitizeItem: (file: File) => Promise<WardrobeItem>;
  isDigitizing: boolean;
  lastDigitizedItem: WardrobeItem | null;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>(mockWardrobeItems);
  const [feedItems] = useState<FeedItem[]>(mockFeedItems);
  const [favoriteLooks, setFavoriteLooks] = useState<FavoriteLook[]>(mockFavoriteLooks);
  const [weather, setWeather] = useState<WeatherSnapshot>(createFallbackWeather);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [lastDigitizedItem, setLastDigitizedItem] = useState<WardrobeItem | null>(null);
  const [isGeneratingLook, setIsGeneratingLook] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [latestOutfit, setLatestOutfit] = useState<GeneratedOutfit | null>(() =>
    createInitialOutfit({
      wardrobeItems: mockWardrobeItems,
      weather: createFallbackWeather(),
      userProfile: mockUserProfile,
    }),
  );

  const updateUserProfile = useCallback((patch: Partial<UserProfile>) => {
    startTransition(() => {
      setUserProfile((current) => ({
        ...current,
        ...patch,
      }));
    });
  }, []);

  const refreshWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const payload = await getWeatherForCurrentLocation();

      startTransition(() => {
        setWeather(payload);
      });

      return payload;
    } catch (error) {
      console.error("weather:refresh", error);
      const fallback = createFallbackWeather();

      startTransition(() => {
        setWeather(fallback);
        setWeatherError("Не удалось обновить погоду, используется локальный прогноз.");
      });

      return fallback;
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWeather();
  }, [refreshWeather]);

  const digitizeItem = useCallback(async (file: File) => {
    setIsDigitizing(true);

    try {
      const item = await digitizeWardrobePhoto(file);

      startTransition(() => {
        setWardrobeItems((current) => [item, ...current]);
        setLastDigitizedItem(item);
      });

      return item;
    } finally {
      setIsDigitizing(false);
    }
  }, []);

  const generateLook = useCallback(
    async (occasion: string) => {
      setIsGeneratingLook(true);
      setGenerationError(null);

      try {
        const effectiveWeather =
          Date.now() - new Date(weather.fetchedAt).getTime() > 1000 * 60 * 30
            ? await refreshWeather()
            : weather;
        const outfit = await generateStylistOutfit({
          wardrobeItems,
          weather: effectiveWeather,
          userProfile,
          occasion,
        });

        startTransition(() => {
          setLatestOutfit(outfit);
        });

        return outfit;
      } catch (error) {
        console.error("outfit:generate", error);
        const message =
          "Не удалось собрать новый образ. Проверь LLM endpoint или используй локальный режим.";
        setGenerationError(message);
        throw error;
      } finally {
        setIsGeneratingLook(false);
      }
    },
    [refreshWeather, userProfile, wardrobeItems, weather],
  );

  const addLookToFavorites = useCallback((look: GeneratedOutfit) => {
    const previewItem = look.slots.find((slot) => slot.item)?.item;

    if (!previewItem) {
      return;
    }

    startTransition(() => {
      setFavoriteLooks((current) => {
        if (current.some((item) => item.title === look.title)) {
          return current;
        }

        return [
          {
            id: `favorite-${look.id}`,
            image: previewItem.image,
            title: look.title,
            brand: previewItem.brand,
            note: look.summary,
          },
          ...current,
        ];
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      userProfile,
      updateUserProfile,
      wardrobeItems,
      feedItems,
      favoriteLooks,
      addLookToFavorites,
      latestOutfit,
      generateLook,
      isGeneratingLook,
      generationError,
      weather,
      weatherLoading,
      weatherError,
      refreshWeather,
      digitizeItem,
      isDigitizing,
      lastDigitizedItem,
    }),
    [
      addLookToFavorites,
      digitizeItem,
      favoriteLooks,
      feedItems,
      generateLook,
      generationError,
      isDigitizing,
      isGeneratingLook,
      lastDigitizedItem,
      latestOutfit,
      refreshWeather,
      updateUserProfile,
      userProfile,
      wardrobeItems,
      weather,
      weatherError,
      weatherLoading,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return value;
}
