import { Plus, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function DigitalWardrobe() {
  const wardrobeItems = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1711477270970-14340bee9000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGphY2tldCUyMHN0cmVldCUyMHN0eWxlfGVufDF8fHx8MTc3MjAyMDYyN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Джинсовая куртка",
      brand: "Levi's",
      category: "Верхняя одежда",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1689357642277-65228ee23680?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwZm9vdHdlYXJ8ZW58MXx8fHwxNzcyMDIwNjI3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Белые кроссовки",
      brand: "Nike",
      category: "Обувь",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1564801586444-f08648006f0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW1tZXIlMjBkcmVzcyUyMGZsb3JhbHxlbnwxfHx8fDE3NzIwMDI1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Летнее платье",
      brand: "Zara",
      category: "Платья",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1763742937367-e3481b64da81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBjb2F0JTIwb3V0ZXJ3ZWFyfGVufDF8fHx8MTc3MTk3MjE5MHww&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Зимнее пальто",
      brand: "H&M",
      category: "Верхняя одежда",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1575295912464-fcfd1186d11d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwaGFuZGJhZyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MTkyNTcxOHww&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Кожаная сумка",
      brand: "Michael Kors",
      category: "Аксессуары",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1629426958003-35a5583b2977?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd2FyZHJvYmUlMjBjbG90aGVzfGVufDF8fHx8MTc3MjAyMDYyNnww&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Черные брюки",
      brand: "Mango",
      category: "Брюки",
    },
  ];

  const categories = ["Все", "Верхняя одежда", "Платья", "Брюки", "Обувь", "Аксессуары"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl text-black mb-1">Мой гардероб</h1>
            <p className="text-gray-500">{wardrobeItems.length} вещей</p>
          </div>
          <Button size="icon" className="bg-[#FC7070] hover:bg-[#fc5050] rounded-full">
            <Plus size={24} />
          </Button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button
            size="sm"
            variant="ghost"
            className="flex-shrink-0 border border-gray-200"
          >
            <Filter size={16} className="mr-1" />
            Фильтр
          </Button>
          {categories.map((category, index) => (
            <Button
              key={category}
              size="sm"
              variant={index === 0 ? "default" : "outline"}
              className={
                index === 0
                  ? "bg-[#FC7070] hover:bg-[#fc5050] flex-shrink-0"
                  : "flex-shrink-0 border-gray-200"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Wardrobe Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {wardrobeItems.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="aspect-[3/4] relative">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  fallbackText={item.name}
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm text-black mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.brand}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
