import { useState } from "react";
import { Heart } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useAppState } from "../state/AppState";
import type { FeedItem } from "../types";

export function Feed() {
  const { feedItems } = useAppState();
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  const toggleLike = (id: string) => {
    setLikedItems((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };

  return (
    <div className="min-h-full bg-[#f7f7f8] px-5 pb-8 pt-7">
      <div className="mb-5">
        <p className="text-sm text-gray-500">Pinterest-style feed</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Лента образов</h1>
        <p className="mt-2 text-sm text-gray-500">
          Трендовые подборки, бренды и готовые сочетания для вдохновения.
        </p>
      </div>

      <div className="columns-2 gap-4">
        {feedItems.map((item, index) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedItem(item);
                }
              }}
              className="overflow-hidden rounded-[26px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              style={{ marginBottom: index % 2 === 0 ? "12px" : "20px" }}
            >
              <div className="relative">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-contain p-3"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleLike(item.id);
                  }}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition active:scale-95"
                >
                  <Heart
                    size={18}
                    className={
                      likedItems.includes(item.id)
                        ? "fill-[#FC7070] text-[#FC7070]"
                        : "text-gray-700"
                    }
                  />
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-black">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                <p className="mt-2 text-xs text-gray-600">{item.note}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {item.likes.toLocaleString("ru-RU")} лайков
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-[32px] border-0 px-0">
          {selectedItem ? (
            <>
              <SheetHeader className="px-5 pt-6">
                <SheetTitle>{selectedItem.title}</SheetTitle>
                <SheetDescription>{selectedItem.brand}</SheetDescription>
              </SheetHeader>
              <div className="px-5 pb-6">
                <div className="overflow-hidden rounded-[28px] bg-[#f6f6f6]">
                  <div className="aspect-[4/5]">
                    <ImageWithFallback
                      src={selectedItem.image}
                      alt={selectedItem.title}
                      className="h-full w-full object-contain p-4"
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">{selectedItem.note}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {selectedItem.likes.toLocaleString("ru-RU")} лайков
                </p>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
