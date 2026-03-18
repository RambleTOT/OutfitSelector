import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Filter, Plus, ScanSearch } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useAppState } from "../state/AppState";
import type { WardrobeCategory, WardrobeItem } from "../types";

const wardrobeCategories: Array<WardrobeCategory | "Все"> = [
  "Все",
  "Верх",
  "Низ",
  "Верхняя одежда",
  "Обувь",
  "Аксессуары",
];

export function DigitalWardrobe() {
  const { wardrobeItems, lastDigitizedItem } = useAppState();
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "Все">("Все");
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  const filteredItems = useMemo(
    () =>
      activeCategory === "Все"
        ? wardrobeItems
        : wardrobeItems.filter((item) => item.category === activeCategory),
    [activeCategory, wardrobeItems],
  );

  return (
    <div className="min-h-full bg-[#f7f7f8] px-5 pb-8 pt-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Цифровой гардероб</p>
          <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Мои вещи</h1>
          <p className="mt-2 text-sm text-gray-500">
            {wardrobeItems.length} вещей уже доступны для AI-стилиста
          </p>
        </div>
        <Button asChild size="icon" className="rounded-full bg-[#FC7070] hover:bg-[#f45d5d]">
          <Link to="/digitize">
            <Plus size={22} />
          </Link>
        </Button>
      </div>

      {lastDigitizedItem ? (
        <div className="mb-5 rounded-[26px] bg-[#111111] p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <ScanSearch size={16} className="text-[#FC7070]" />
            <p className="text-sm font-medium">Новая AI-карточка готова</p>
          </div>
          <p className="text-base">{lastDigitizedItem.name}</p>
          <p className="mt-1 text-sm text-white/65">{lastDigitizedItem.ai.summary}</p>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
          <Filter size={14} className="mr-2 inline-block" />
          Категории
        </div>
        {wardrobeCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full border px-3 py-2 text-sm whitespace-nowrap transition ${
              activeCategory === category
                ? "border-[#FC7070] bg-[#FC7070] text-white"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs text-gray-500">Всего</p>
          <p className="mt-1 text-2xl text-black">{wardrobeItems.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs text-gray-500">AI-сканы</p>
          <p className="mt-1 text-2xl text-black">
            {wardrobeItems.filter((item) => item.source === "digitized").length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs text-gray-500">Категорий</p>
          <p className="mt-1 text-2xl text-black">
            {new Set(wardrobeItems.map((item) => item.category)).size}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedItem(item)}
            className="overflow-hidden rounded-[24px] bg-white text-left shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
          >
            <div className="aspect-[3/4] bg-gray-100">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <Badge
                variant="outline"
                className="mb-2 rounded-full border-black/10 text-[11px] text-gray-500"
              >
                {item.category}
              </Badge>
              <p className="text-sm font-medium text-black">{item.name}</p>
              <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] rounded-t-[32px] border-0 px-0">
          {selectedItem ? (
            <>
              <SheetHeader className="px-5 pt-6">
                <SheetTitle>{selectedItem.name}</SheetTitle>
                <SheetDescription>{selectedItem.brand}</SheetDescription>
              </SheetHeader>

              <div className="overflow-y-auto px-5 pb-6">
                <div className="mb-4 overflow-hidden rounded-[28px] bg-[#f3f3f4]">
                  <div className="aspect-[4/5]">
                    <ImageWithFallback
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedItem.palette.map((color) => (
                    <Badge
                      key={color}
                      variant="outline"
                      className="rounded-full border-black/10 text-gray-600"
                    >
                      {color}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f7f8] p-4">
                    <p className="text-xs text-gray-500">Материал</p>
                    <p className="mt-1 text-sm text-black">{selectedItem.material}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f8] p-4">
                    <p className="text-xs text-gray-500">Посадка</p>
                    <p className="mt-1 text-sm text-black">{selectedItem.fit}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f8] p-4">
                    <p className="text-xs text-gray-500">Теплота</p>
                    <p className="mt-1 text-sm text-black">{selectedItem.warmth}/5</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f8] p-4">
                    <p className="text-xs text-gray-500">AI confidence</p>
                    <p className="mt-1 text-sm text-black">
                      {Math.round(selectedItem.ai.confidence * 100)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#111111] p-4 text-white">
                  <p className="text-sm font-medium">Паспорт вещи</p>
                  <p className="mt-2 text-sm text-white/75">{selectedItem.ai.summary}</p>
                  <p className="mt-3 text-xs text-white/60">
                    Силуэт: {selectedItem.ai.silhouette} · Модель: {selectedItem.ai.model}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
