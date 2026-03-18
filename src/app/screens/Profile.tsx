import { LogOut, Mail, MapPin, Phone, Ruler, Settings, Sparkles, Weight } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAppState } from "../state/AppState";

export function Profile() {
  const navigate = useNavigate();
  const { userProfile, wardrobeItems, favoriteLooks, latestOutfit, weather } = useAppState();

  const stats = [
    { label: "Вещей", value: String(wardrobeItems.length) },
    { label: "Избранное", value: String(favoriteLooks.length) },
    { label: "AI look", value: latestOutfit ? "Готов" : "Нет" },
  ];

  return (
    <div className="min-h-full bg-[#f7f7f8] px-5 pb-8 pt-7">
      <div className="mb-5">
        <p className="text-sm text-gray-500">Профиль пользователя</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Профиль</h1>
      </div>

      <div className="mb-5 rounded-[30px] bg-[#111111] p-5 text-white shadow-[0_22px_48px_rgba(17,17,17,0.18)]">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FC7070] text-2xl">
            {userProfile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl">{userProfile.name}</h2>
            <p className="mt-1 text-sm text-white/65">Персональный гардероб и AI-стилист</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
              <MapPin size={14} />
              <span>{weather.city}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/8 p-3 text-center">
              <p className="text-xl">{stat.value}</p>
              <p className="mt-1 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-[#FC7070]" />
          <p className="text-sm font-medium text-black">Настройки подбора</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-black/10 text-gray-600">
            {userProfile.styleFocus}
          </Badge>
          <Badge variant="outline" className="rounded-full border-black/10 text-gray-600">
            {userProfile.fitPreference}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Почта</p>
              <p className="text-sm text-black">{userProfile.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Телефон</p>
              <p className="text-sm text-black">{userProfile.phone}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <Ruler size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Рост</p>
                <p className="text-sm text-black">{userProfile.height} см</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <Weight size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Вес</p>
                <p className="text-sm text-black">{userProfile.weight} кг</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Button
          variant="outline"
          onClick={() => navigate("/additional-params")}
          className="h-12 w-full rounded-2xl border-gray-200 bg-white"
        >
          <Settings size={18} />
          Настройки
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/login")}
          className="h-12 w-full rounded-2xl border-[#FC7070] bg-white text-[#FC7070]"
        >
          <LogOut size={18} />
          Выйти
        </Button>
      </div>
    </div>
  );
}
