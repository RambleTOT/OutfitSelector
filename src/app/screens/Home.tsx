import { Cloud, Sparkles, ThermometerSun } from "lucide-react";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
  const outfitRecommendations = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1610336460518-c12d51f06f61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwb3V0Zml0JTIwY2FzdWFsfGVufDF8fHx8MTc3MjAyMDYyNnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Повседневный образ",
      temp: "18°C",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1761164920960-2d776a18998c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJlc3MlMjBmb3JtYWx8ZW58MXx8fHwxNzcxOTM3MDA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Деловой стиль",
      temp: "18°C",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1711477270970-14340bee9000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGphY2tldCUyMHN0cmVldCUyMHN0eWxlfGVufDF8fHx8MTc3MjAyMDYyN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Уличный стиль",
      temp: "18°C",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl text-black mb-1">Главная</h1>
        <p className="text-gray-500">Создайте образ на сегодня</p>
      </div>

      {/* Weather Card */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Сегодня</p>
              <p className="text-4xl text-black mb-1">18°C</p>
              <p className="text-gray-600">Москва</p>
            </div>
            <Cloud size={48} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <ThermometerSun size={16} />
              <span>Макс: 21°C</span>
            </div>
            <div className="flex items-center gap-1">
              <ThermometerSun size={16} />
              <span>Мин: 15°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Stylist Section */}
      <div className="px-6 mb-6">
        <div className="bg-[#FC7070] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles size={28} />
            <div>
              <h3 className="text-xl mb-1">ИИ Стилист</h3>
              <p className="text-white/90 text-sm">
                Получите персональные рекомендации для вашего образа
              </p>
            </div>
          </div>
          <Button className="w-full bg-white text-[#FC7070] hover:bg-gray-100">
            Создать образ
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      <div className="px-6 pb-6">
        <h2 className="text-xl text-black mb-4">Рекомендации на сегодня</h2>
        <div className="space-y-4">
          {outfitRecommendations.map((outfit) => (
            <div key={outfit.id} className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] relative">
                <ImageWithFallback
                  src={outfit.image}
                  alt={outfit.title}
                  className="w-full h-full object-cover"
                  fallbackText={outfit.title}
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                  {outfit.temp}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-black">{outfit.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
