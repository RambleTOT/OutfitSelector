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
import {
  clearCurrentSession,
  getCurrentSession,
  getPhoneKey,
  getStoredUser,
  hashPassword,
  saveCurrentSession,
  saveStoredUser,
} from "../lib/localDb";
import {
  createInitialOutfit,
  defaultGenerationOptions,
  generateStylistOutfit,
} from "../lib/stylist";
import { digitizeWardrobePhoto } from "../lib/vision";
import { createFallbackWeather, getWeatherForCurrentLocation } from "../lib/weather";
import type {
  AuthCredentials,
  FavoriteLook,
  FeedItem,
  GeneratedOutfit,
  OutfitGenerationOptions,
  StoredUserRecord,
  UserProfile,
  WardrobeItem,
  WeatherSnapshot,
} from "../types";

interface AppStateValue {
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  registerUser: (credentials: AuthCredentials) => Promise<boolean>;
  loginUser: (phone: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  wardrobeItems: WardrobeItem[];
  feedItems: FeedItem[];
  favoriteLooks: FavoriteLook[];
  addLookToFavorites: (look: GeneratedOutfit) => void;
  latestOutfit: GeneratedOutfit | null;
  outfitHistory: GeneratedOutfit[];
  generateLook: (
    occasion: string,
    options?: OutfitGenerationOptions,
  ) => Promise<GeneratedOutfit>;
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

const guestProfile: UserProfile = {
  ...mockUserProfile,
  name: "",
  email: "",
  phone: "",
  height: "",
  weight: "",
  size: "",
  fitPreference: "",
};

const AppStateContext = createContext<AppStateValue | null>(null);

function buildUserRecord(args: {
  phoneKey: string;
  passwordHash: string;
  profile: UserProfile;
  wardrobeItems: WardrobeItem[];
  favoriteLooks: FavoriteLook[];
  latestOutfit: GeneratedOutfit | null;
  outfitHistory: GeneratedOutfit[];
  lastDigitizedItem: WardrobeItem | null;
  createdAt?: string;
}) {
  const now = new Date().toISOString();

  return {
    phoneKey: args.phoneKey,
    passwordHash: args.passwordHash,
    profile: args.profile,
    wardrobeItems: args.wardrobeItems,
    favoriteLooks: args.favoriteLooks,
    latestOutfit: args.latestOutfit,
    outfitHistory: args.outfitHistory,
    lastDigitizedItem: args.lastDigitizedItem,
    createdAt: args.createdAt ?? now,
    updatedAt: now,
  } satisfies StoredUserRecord;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPhoneKey, setCurrentPhoneKey] = useState<string | null>(null);
  const [currentPasswordHash, setCurrentPasswordHash] = useState("");
  const [currentCreatedAt, setCurrentCreatedAt] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(guestProfile);
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
  const [outfitHistory, setOutfitHistory] = useState<GeneratedOutfit[]>([]);
  const [latestOutfit, setLatestOutfit] = useState<GeneratedOutfit | null>(() =>
    createInitialOutfit({
      wardrobeItems: mockWardrobeItems,
      weather: createFallbackWeather(),
      userProfile: mockUserProfile,
    }),
  );

  const hydrateFromRecord = useCallback((record: StoredUserRecord) => {
    startTransition(() => {
      setUserProfile(record.profile);
      setWardrobeItems(record.wardrobeItems);
      setFavoriteLooks(record.favoriteLooks);
      setLatestOutfit(
        record.latestOutfit ??
          createInitialOutfit({
            wardrobeItems: record.wardrobeItems,
            weather: createFallbackWeather(),
            userProfile: record.profile,
          }),
      );
      setOutfitHistory(record.outfitHistory ?? []);
      setLastDigitizedItem(record.lastDigitizedItem ?? null);
      setCurrentPhoneKey(record.phoneKey);
      setCurrentPasswordHash(record.passwordHash);
      setCurrentCreatedAt(record.createdAt);
      setIsAuthenticated(true);
    });
  }, []);

  const resetGuestState = useCallback(() => {
    startTransition(() => {
      setUserProfile(guestProfile);
      setWardrobeItems(mockWardrobeItems);
      setFavoriteLooks(mockFavoriteLooks);
      setLatestOutfit(
        createInitialOutfit({
          wardrobeItems: mockWardrobeItems,
          weather: createFallbackWeather(),
          userProfile: mockUserProfile,
        }),
      );
      setOutfitHistory([]);
      setLastDigitizedItem(null);
      setCurrentPhoneKey(null);
      setCurrentPasswordHash("");
      setCurrentCreatedAt(null);
      setIsAuthenticated(false);
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const sessionPhoneKey = await getCurrentSession();

        if (sessionPhoneKey) {
          const record = await getStoredUser(sessionPhoneKey);

          if (record) {
            hydrateFromRecord(record);
          }
        }
      } catch (error) {
        console.error("auth:hydrate", error);
      } finally {
        setAuthReady(true);
      }
    })();
  }, [hydrateFromRecord]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !currentPhoneKey || !currentPasswordHash) {
      return;
    }

    const record = buildUserRecord({
      phoneKey: currentPhoneKey,
      passwordHash: currentPasswordHash,
      profile: userProfile,
      wardrobeItems,
      favoriteLooks,
      latestOutfit,
      outfitHistory,
      lastDigitizedItem,
      createdAt: currentCreatedAt ?? undefined,
    });

    void saveStoredUser(record);
  }, [
    authReady,
    currentCreatedAt,
    currentPasswordHash,
    currentPhoneKey,
    favoriteLooks,
    isAuthenticated,
    lastDigitizedItem,
    latestOutfit,
    outfitHistory,
    userProfile,
    wardrobeItems,
  ]);

  const registerUser = useCallback(
    async (credentials: AuthCredentials) => {
      setAuthBusy(true);
      setAuthError(null);

      try {
        const existing = await getStoredUser(credentials.phone);

        if (existing) {
          setAuthError("Пользователь с таким номером уже существует.");
          return false;
        }

        const profile: UserProfile = {
          ...guestProfile,
          name: credentials.name,
          email: credentials.email,
          phone: credentials.phone,
          city: mockUserProfile.city,
          styleFocus: mockUserProfile.styleFocus,
        };
        const passwordHash = await hashPassword(credentials.password);
        const initialOutfit = createInitialOutfit({
          wardrobeItems: mockWardrobeItems,
          weather: createFallbackWeather(),
          userProfile: {
            ...mockUserProfile,
            ...profile,
          },
        });
        const record = buildUserRecord({
          phoneKey: getPhoneKey(credentials.phone),
          passwordHash,
          profile,
          wardrobeItems: mockWardrobeItems,
          favoriteLooks: mockFavoriteLooks,
          latestOutfit: initialOutfit,
          outfitHistory: initialOutfit ? [initialOutfit] : [],
          lastDigitizedItem: null,
        });

        await saveStoredUser(record);
        await saveCurrentSession(credentials.phone);
        hydrateFromRecord(record);

        return true;
      } catch (error) {
        console.error("auth:register", error);
        setAuthError("Не удалось сохранить пользователя локально.");
        return false;
      } finally {
        setAuthBusy(false);
      }
    },
    [hydrateFromRecord],
  );

  const loginUser = useCallback(
    async (phone: string, password: string) => {
      setAuthBusy(true);
      setAuthError(null);

      try {
        const record = await getStoredUser(phone);

        if (!record) {
          setAuthError("Пользователь с таким номером не найден.");
          return false;
        }

        const passwordHash = await hashPassword(password);

        if (record.passwordHash !== passwordHash) {
          setAuthError("Неверный пароль.");
          return false;
        }

        await saveCurrentSession(phone);
        hydrateFromRecord(record);
        return true;
      } catch (error) {
        console.error("auth:login", error);
        setAuthError("Не удалось выполнить вход.");
        return false;
      } finally {
        setAuthBusy(false);
      }
    },
    [hydrateFromRecord],
  );

  const logoutUser = useCallback(async () => {
    await clearCurrentSession();
    resetGuestState();
  }, [resetGuestState]);

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
    async (occasion: string, options: OutfitGenerationOptions = defaultGenerationOptions) => {
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
          options,
          previousLooks: outfitHistory,
        });

        startTransition(() => {
          setLatestOutfit(outfit);
          setOutfitHistory((current) => [outfit, ...current].slice(0, 15));
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
    [outfitHistory, refreshWeather, userProfile, wardrobeItems, weather],
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
      authReady,
      authBusy,
      authError,
      isAuthenticated,
      userProfile,
      registerUser,
      loginUser,
      logoutUser,
      updateUserProfile,
      wardrobeItems,
      feedItems,
      favoriteLooks,
      addLookToFavorites,
      latestOutfit,
      outfitHistory,
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
      authBusy,
      authError,
      authReady,
      digitizeItem,
      favoriteLooks,
      feedItems,
      generateLook,
      generationError,
      isAuthenticated,
      isDigitizing,
      isGeneratingLook,
      lastDigitizedItem,
      latestOutfit,
      loginUser,
      logoutUser,
      outfitHistory,
      refreshWeather,
      registerUser,
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
