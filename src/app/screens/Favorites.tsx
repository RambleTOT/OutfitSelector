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
import { useState } from "react";
import type { FavoriteLook } from "../types";

export function Favorites() {
  const { favoriteLooks } = useAppState();
  const [selectedItem, setSelectedItem] = useState<FavoriteLook | null>(null);

  return (
    <div className="min-h-full bg-[#f7f7f8] px-5 pb-8 pt-7">
      <div className="mb-5">
        <p className="text-sm text-gray-500">Сохраненные образы</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Избранное</h1>
        <p className="mt-2 text-sm text-gray-500">
          Здесь хранятся сохраненные капсулы и образы, которые хочется повторить.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {favoriteLooks.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedItem(item)}
            className="overflow-hidden rounded-[26px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="relative aspect-[3/4]">
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="h-full w-full object-contain p-3"
              />
              <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
                <Heart size={16} className="fill-[#FC7070] text-[#FC7070]" />
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-black">{item.title}</p>
              <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
              <p className="mt-2 text-xs text-gray-600">{item.note}</p>
            </div>
          </button>
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
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
