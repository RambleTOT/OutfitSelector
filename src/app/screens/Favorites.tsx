import { Heart } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Favorites() {
  const favoriteItems = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1620777888789-0ee95b57a277?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBvdXRmaXR8ZW58MXx8fHwxNzcxOTU1MjIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Элегантный образ",
      brand: "Gucci",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1648065460033-5c59f2ef1d97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBzdHlsZXxlbnwxfHx8fDE3NzIwMjA3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Деловой шик",
      brand: "Dior",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1769107805465-bfd41863f1a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwb3V0Zml0JTIwYWVzdGhldGljfGVufDF8fHx8MTc3MjAyMDcyNXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Минимализм",
      brand: "COS",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1718230875502-e3c12afddc49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGZhc2hpb24lMjBzdHlsZXxlbnwxfHx8fDE3NzIwMjA3MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Городской стиль",
      brand: "Nike",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1761164920960-2d776a18998c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJlc3MlMjBmb3JtYWx8ZW58MXx8fHwxNzcxOTM3MDA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Вечерний образ",
      brand: "Versace",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1764698403474-de152b479d59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVuZHklMjBzdHJlZXR3ZWFyJTIwbG9va3xlbnwxfHx8fDE3NzIwMjA3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Уличный стиль",
      brand: "Supreme",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl text-black mb-1">Избранное</h1>
        <p className="text-gray-500">{favoriteItems.length} сохраненных образов</p>
      </div>

      {/* Favorites Grid */}
      <div className="px-6 pb-6">
        {favoriteItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl text-black mb-2">Пока нет избранных</h3>
            <p className="text-gray-500 text-center">
              Добавляйте понравившиеся образы в избранное
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoriteItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl overflow-hidden relative">
                <div className="aspect-[3/4] relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    fallbackText={item.title}
                  />
                  <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Heart size={18} className="fill-[#FC7070] text-[#FC7070]" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-black mb-1 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
