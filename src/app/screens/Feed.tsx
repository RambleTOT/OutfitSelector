import { Heart } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";

export function Feed() {
  const feedItems = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1620777888789-0ee95b57a277?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBvdXRmaXR8ZW58MXx8fHwxNzcxOTU1MjIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Элегантный образ",
      brand: "Gucci",
      likes: 1243,
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1764698403474-de152b479d59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVuZHklMjBzdHJlZXR3ZWFyJTIwbG9va3xlbnwxfHx8fDE3NzIwMjA3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Уличный стиль",
      brand: "Supreme",
      likes: 2156,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1648065460033-5c59f2ef1d97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd29tYW4lMjBzdHlsZXxlbnwxfHx8fDE3NzIwMjA3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Деловой шик",
      brand: "Dior",
      likes: 3421,
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1769072060333-12a09b124cb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBtZW5zd2VhciUyMGZhc2hpb258ZW58MXx8fHwxNzcyMDIwNzI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Повседневный look",
      brand: "Uniqlo",
      likes: 987,
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1769107805465-bfd41863f1a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwb3V0Zml0JTIwYWVzdGhldGljfGVufDF8fHx8MTc3MjAyMDcyNXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Минимализм",
      brand: "COS",
      likes: 1876,
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1718230875502-e3c12afddc49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGZhc2hpb24lMjBzdHlsZXxlbnwxfHx8fDE3NzIwMjA3MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Городской стиль",
      brand: "Nike",
      likes: 2543,
    },
    {
      id: 7,
      image: "https://images.unsplash.com/photo-1610336460518-c12d51f06f61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwb3V0Zml0JTIwY2FzdWFsfGVufDF8fHx8MTc3MjAyMDYyNnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Casual chic",
      brand: "Zara",
      likes: 1567,
    },
    {
      id: 8,
      image: "https://images.unsplash.com/photo-1761164920960-2d776a18998c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJlc3MlMjBmb3JtYWx8ZW58MXx8fHwxNzcxOTM3MDA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Вечерний образ",
      brand: "Versace",
      likes: 4123,
    },
  ];

  const [likedItems, setLikedItems] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLikedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl text-black mb-1">Лента</h1>
        <p className="text-gray-500">Трендовые образы для вас</p>
      </div>

      {/* Feed Grid (Pinterest style) */}
      <div className="px-6 pb-6">
        <div className="columns-2 gap-4">
          {feedItems.map((item, index) => (
            <div
              key={item.id}
              className="break-inside-avoid mb-4"
              style={{ marginBottom: index % 2 === 0 ? "16px" : "24px" }}
            >
              <div className="bg-gray-50 rounded-xl overflow-hidden relative group">
                <div className="relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full object-cover"
                    fallbackText={item.title}
                  />
                  <button
                    onClick={() => toggleLike(item.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform active:scale-90"
                  >
                    <Heart
                      size={20}
                      className={
                        likedItems.includes(item.id)
                          ? "fill-[#FC7070] text-[#FC7070]"
                          : "text-gray-700"
                      }
                    />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-black mb-1">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <p className="text-xs text-gray-400">
                      {item.likes.toLocaleString("ru-RU")} ❤️
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
