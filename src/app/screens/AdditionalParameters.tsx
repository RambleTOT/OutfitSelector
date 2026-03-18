import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useAppState } from "../state/AppState";

const sizeSections = [
  {
    title: "Международные",
    options: ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"],
  },
  {
    title: "Российские / EU",
    options: [
      "38",
      "40",
      "42",
      "44",
      "46",
      "48",
      "50",
      "52",
      "54",
      "56",
      "58",
      "60",
      "62",
      "64",
      "66",
      "68",
      "70",
    ],
  },
  {
    title: "Джинсовые",
    options: ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38"],
  },
  {
    title: "Дополнительно",
    options: ["One size"],
  },
] as const;

export function AdditionalParameters() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAppState();
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    height: userProfile.height,
    weight: userProfile.weight,
    size: userProfile.size,
    styleFocus: userProfile.styleFocus,
    fitPreference: userProfile.fitPreference,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateUserProfile(formData);
    navigate("/digitize");
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f7f8] px-5 py-7">
      <div className="mb-8">
        <p className="text-sm text-gray-500">Шаг 3 из 3</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Дополнительные параметры</h1>
        <p className="mt-2 text-sm text-gray-500">
          Эти данные помогут точнее подбирать посадку, многослойность и готовые образы.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-700">Рост (см)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(event) =>
                  setFormData({ ...formData, height: event.target.value })
                }
                placeholder="170"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Вес (кг)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(event) =>
                  setFormData({ ...formData, weight: event.target.value })
                }
                placeholder="65"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Размер одежды</label>
              <button
                type="button"
                onClick={() => setIsSizeSheetOpen(true)}
                className="flex h-11 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-left text-sm text-black shadow-xs transition hover:border-[#FC7070]/40"
              >
                <span className={formData.size ? "text-black" : "text-gray-400"}>
                  {formData.size || "Выбрать размер"}
                </span>
                <ChevronDown size={18} className="text-gray-400" />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Предпочитаемый стиль</label>
              <Input
                type="text"
                value={formData.styleFocus}
                onChange={(event) =>
                  setFormData({ ...formData, styleFocus: event.target.value })
                }
                placeholder="Минимализм, smart casual"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Посадка и пожелания</label>
              <Input
                type="text"
                value={formData.fitPreference}
                onChange={(event) =>
                  setFormData({ ...formData, fitPreference: event.target.value })
                }
                placeholder="Например: люблю свободный верх и прямой низ"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]">
          Сохранить и продолжить
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/digitize")}
          variant="outline"
          className="h-12 w-full rounded-2xl border-gray-200 bg-white"
        >
          Пропустить
        </Button>
      </form>

      <Sheet open={isSizeSheetOpen} onOpenChange={setIsSizeSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[430px] rounded-t-[28px] border-0 bg-white px-0 pb-6"
        >
          <SheetHeader className="border-b border-gray-100 px-5 pb-4 pt-5">
            <SheetTitle className="text-left text-xl text-black">Выбрать размер</SheetTitle>
            <SheetDescription className="text-left text-sm text-gray-500">
              Нажми на вариант, и мы подставим его в профиль.
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 pt-5">
            {sizeSections.map((section) => (
              <div key={section.title}>
                <p className="mb-3 text-sm font-medium text-black">{section.title}</p>
                <div className="flex flex-wrap gap-2">
                  {section.options.map((size) => {
                    const isActive = formData.size === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setFormData((current) => ({ ...current, size }));
                          setIsSizeSheetOpen(false);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                          isActive
                            ? "border-[#FC7070] bg-[#FC7070] text-white"
                            : "border-gray-200 bg-[#f7f7f8] text-black"
                        }`}
                      >
                        {isActive ? <Check size={14} /> : null}
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
