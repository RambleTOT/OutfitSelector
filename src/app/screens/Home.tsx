import { useState } from "react";
import { Link } from "react-router";
import {
  BookmarkPlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Store,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { outfitOccasions } from "../data/mockData";
import { useAppState } from "../state/AppState";

function getSourceLabel(source: string) {
  if (source === "remote-llm") {
    return "LLM endpoint";
  }

  if (source === "fallback") {
    return "Fallback режим";
  }

  return "Demo AI";
}

export function Home() {
  const {
    userProfile,
    wardrobeItems,
    weather,
    weatherLoading,
    weatherError,
    refreshWeather,
    latestOutfit,
    generateLook,
    isGeneratingLook,
    generationError,
    addLookToFavorites,
    lastDigitizedItem,
  } = useAppState();
  const [selectedOccasion, setSelectedOccasion] = useState(outfitOccasions[0]);

  return (
    <div className="min-h-full bg-[#f7f7f8] px-5 pb-8 pt-7">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-500">AI Outfit Selector</p>
          <h1 className="text-[30px] leading-[1.15] text-black">
            Привет, {userProfile.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-[280px] text-sm text-gray-500">
            AI-стилист собирает образ из твоих вещей и подстраивается под погоду.
          </p>
        </div>
        <Badge className="rounded-full bg-[#FC7070]/10 px-3 py-1 text-[#FC7070]">
          {wardrobeItems.length} вещей
        </Badge>
      </div>

      <div className="mb-5 rounded-[28px] bg-[linear-gradient(135deg,#ffffff_0%,#f0f0f0_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={15} />
              <span>{weather.city}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-medium text-black">{weather.temperature}°</span>
              <span className="pb-1 text-sm text-gray-500">
                ощущается как {weather.apparentTemperature}°
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{weather.condition}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void refreshWeather()}
            className="rounded-full bg-white text-gray-600 shadow-sm"
          >
            <RefreshCw className={weatherLoading ? "animate-spin" : ""} size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white px-3 py-3">
            <p className="text-xs text-gray-500">Макс</p>
            <p className="mt-1 text-lg text-black">{weather.tempMax}°</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3">
            <p className="text-xs text-gray-500">Мин</p>
            <p className="mt-1 text-lg text-black">{weather.tempMin}°</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3">
            <p className="text-xs text-gray-500">Осадки</p>
            <p className="mt-1 text-lg text-black">{weather.precipitationProbability}%</p>
          </div>
        </div>

        {weatherError ? <p className="mt-3 text-xs text-[#FC7070]">{weatherError}</p> : null}
      </div>

      <div className="mb-5 rounded-[30px] bg-[#111111] p-5 text-white shadow-[0_22px_48px_rgba(17,17,17,0.18)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <Sparkles size={22} className="text-[#FC7070]" />
          </div>
          <div>
            <h2 className="text-xl">AI-стилист</h2>
            <p className="mt-1 text-sm text-white/70">
              Анализирует погоду, твой гардероб, силуэт и собирает готовый образ.
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {outfitOccasions.map((occasion) => (
            <button
              key={occasion}
              type="button"
              onClick={() => setSelectedOccasion(occasion)}
              className={`rounded-full border px-3 py-2 text-sm whitespace-nowrap transition ${
                selectedOccasion === occasion
                  ? "border-[#FC7070] bg-[#FC7070] text-white"
                  : "border-white/15 bg-white/5 text-white/75"
              }`}
            >
              {occasion}
            </button>
          ))}
        </div>

        <Button
          onClick={() => void generateLook(selectedOccasion)}
          disabled={isGeneratingLook}
          className="h-12 w-full rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]"
        >
          {isGeneratingLook ? (
            <>
              <LoaderCircle className="animate-spin" size={18} />
              Идет подбор образа
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Собрать образ на сегодня
            </>
          )}
        </Button>

        <p className="mt-3 text-xs text-white/65">
          Обязательные слоты: верх, низ, верхняя одежда, обувь и аксессуары.
        </p>
        {generationError ? <p className="mt-2 text-xs text-[#FC7070]">{generationError}</p> : null}
      </div>

      {latestOutfit ? (
        <div className="mb-5 rounded-[28px] bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[#FC7070]/30 text-[#FC7070]">
                  {getSourceLabel(latestOutfit.source)}
                </Badge>
                <Badge variant="outline" className="rounded-full border-black/10 text-gray-600">
                  {latestOutfit.occasion}
                </Badge>
              </div>
              <h3 className="text-xl text-black">{latestOutfit.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{latestOutfit.summary}</p>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => addLookToFavorites(latestOutfit)}
              className="rounded-full border-gray-200 bg-white"
            >
              <BookmarkPlus size={18} />
            </Button>
          </div>

          <div className="mb-4 rounded-2xl bg-[#f4f4f5] p-4">
            <p className="text-sm font-medium text-black">Комментарий стилиста</p>
            <p className="mt-2 text-sm text-gray-600">{latestOutfit.weatherNote}</p>
            <p className="mt-2 text-sm text-gray-600">{latestOutfit.stylistNote}</p>
          </div>

          <div className="space-y-3">
            {latestOutfit.slots.map((slot) => (
              <div key={slot.key} className="rounded-2xl border border-gray-100 bg-[#fafafa] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-black">{slot.title}</p>
                  <Badge variant="outline" className="rounded-full border-black/10 text-gray-500">
                    {slot.item ? slot.item.category : "Нет вещи"}
                  </Badge>
                </div>

                {slot.item ? (
                  <div className="flex gap-3">
                    <div className="h-24 w-20 overflow-hidden rounded-2xl bg-gray-100">
                      <ImageWithFallback
                        src={slot.item.image}
                        alt={slot.item.name}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-black">{slot.item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{slot.item.brand}</p>
                      <p className="mt-2 text-sm text-gray-600">{slot.reason}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{slot.reason}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Store size={16} className="text-[#FC7070]" />
              <p className="text-sm font-medium text-black">2 рекомендации из магазинов</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {latestOutfit.storeRecommendations.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl bg-[#f7f7f8]">
                  <div className="aspect-[3/4]">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-black">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.brand} · {item.price}
                    </p>
                    <p className="mt-2 text-xs text-gray-600">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="h-auto rounded-[24px] bg-white px-4 py-4 text-left text-black shadow-[0_16px_32px_rgba(15,23,42,0.06)] hover:bg-white">
          <Link to="/digitize" className="flex flex-col items-start gap-2">
            <span className="rounded-2xl bg-[#FC7070]/10 p-2 text-[#FC7070]">
              <ScanSearch size={18} />
            </span>
            <span className="text-sm font-medium">Оцифровать новую вещь</span>
            <span className="text-xs font-normal text-gray-500">
              Загрузить фото и получить AI-карточку вещи
            </span>
          </Link>
        </Button>

        <Link
          to="/app/wardrobe"
          className="block rounded-[24px] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-medium text-black">Последняя AI-вещь</p>
          {lastDigitizedItem ? (
            <>
              <p className="mt-2 text-sm text-black">{lastDigitizedItem.name}</p>
              <p className="mt-1 text-xs text-gray-500">{lastDigitizedItem.ai.summary}</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Пока нет новых сканов. Загрузи фото, и приложение выделит вещь отдельно.
            </p>
          )}
        </Link>
      </div>
    </div>
  );
}
