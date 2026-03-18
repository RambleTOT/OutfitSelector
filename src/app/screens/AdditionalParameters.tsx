import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAppState } from "../state/AppState";

export function AdditionalParameters() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAppState();
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
              <Input
                type="text"
                value={formData.size}
                onChange={(event) =>
                  setFormData({ ...formData, size: event.target.value })
                }
                placeholder="S / M / L"
              />
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
    </div>
  );
}
