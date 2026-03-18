import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Camera, CheckCircle2, LoaderCircle, ScanSearch, Upload } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAppState } from "../state/AppState";
import type { WardrobeItem } from "../types";

export function WardrobeDigitization() {
  const navigate = useNavigate();
  const { digitizeItem, isDigitizing, lastDigitizedItem } = useAppState();
  const [currentItem, setCurrentItem] = useState<WardrobeItem | null>(null);
  const [isPreparingNewScan, setIsPreparingNewScan] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelection = async (file?: File | null) => {
    if (!file) {
      return;
    }

    setIsPreparingNewScan(true);
    setCurrentItem(null);

    try {
      const item = await digitizeItem(file);
      setCurrentItem(item);
    } finally {
      setIsPreparingNewScan(false);
    }
  };

  const activeItem = isPreparingNewScan ? null : currentItem ?? lastDigitizedItem;

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f7f8] px-5 py-7">
      <div className="mb-6">
        <p className="text-sm text-gray-500">AI-оцифровка</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Добавить вещь в гардероб</h1>
        <p className="mt-2 text-sm text-gray-500">
          Загрузите фото. Модель выделит вещь, создаст цифровую карточку и сохранит ее в приложении.
        </p>
      </div>

      <div className="mb-5 overflow-hidden rounded-[32px] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
        <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_top,#f9d1d1_0%,#f3f3f4_35%,#ececee_100%)]">
          {activeItem ? (
            <ImageWithFallback
              src={activeItem.image}
              alt={activeItem.name}
              className="h-full w-full object-contain p-5"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-[24px] bg-white p-4 shadow-sm">
                <Camera size={34} className="text-[#FC7070]" />
              </div>
              <p className="text-lg text-black">Наведи камеру на вещь</p>
              <p className="mt-2 text-sm text-gray-500">
                Лучше использовать нейтральный фон, чтобы AI быстрее выделил контур.
              </p>
            </div>
          )}

          {isDigitizing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-8 text-center text-white backdrop-blur-sm">
              <LoaderCircle className="mb-3 animate-spin" size={28} />
              <p className="text-lg">AI анализирует фото</p>
              <p className="mt-2 text-sm text-white/75">
                Очищаем фон, выделяем контур вещи, улучшаем подачу и строим clean item-модель.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="h-12 rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]"
            >
              <Camera size={18} />
              Сделать фото
            </Button>
            <Button
              variant="outline"
              onClick={() => galleryInputRef.current?.click()}
              className="h-12 rounded-2xl border-gray-200 bg-white"
            >
              <Upload size={18} />
              Загрузить фото
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void handleFileSelection(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleFileSelection(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {activeItem ? (
            <div className="rounded-[24px] bg-[#111111] p-4 text-white">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#FC7070]" />
                <p className="text-sm font-medium">Вещь сохранена в цифровом гардеробе</p>
              </div>
              <p className="text-lg">{activeItem.name}</p>
              <p className="mt-1 text-sm text-white/70">{activeItem.ai.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeItem.palette.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 text-white"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] bg-[#111111] p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <ScanSearch size={16} className="text-[#FC7070]" />
                <p className="text-sm font-medium">Как это работает</p>
              </div>
              <p className="text-sm text-white/75">
                1. Загружаешь фото. 2. Vision-модель выделяет вещь, убирает лишний фон и создает чистую fashion-модель. 3. AI-стилист использует ее при сборке образа.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="h-12 rounded-2xl bg-black text-white hover:bg-black/90">
          <Link to="/app/wardrobe">Открыть гардероб</Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/app/home")}
          className="h-12 rounded-2xl border-gray-200 bg-white"
        >
          К AI-стилисту
        </Button>
      </div>

      <Button
        onClick={() => navigate("/app/home")}
        variant="ghost"
        className="mt-4 h-12 w-full rounded-2xl text-gray-500"
      >
        Пропустить и продолжить
      </Button>
    </div>
  );
}
