import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function AdditionalParameters() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    size: "",
    style: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/digitize");
  };

  const handleSkip = () => {
    navigate("/digitize");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl text-black mb-2">Дополнительные параметры</h1>
          <p className="text-gray-500">
            Эти данные помогут подобрать вам идеальный образ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Рост (см)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="170"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Вес (кг)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="65"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Размер одежды</label>
              <Input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="S / M / L"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Предпочитаемый стиль
              </label>
              <Input
                type="text"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                placeholder="Casual, Business, Sport..."
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button type="submit" className="w-full bg-[#FC7070] hover:bg-[#fc5050] text-white">
              Сохранить
            </Button>
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
              className="w-full border-gray-300 text-gray-700"
            >
              Пропустить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
