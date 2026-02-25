import { User, Mail, Phone, Ruler, Weight, Settings, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";

export function Profile() {
  const userData = {
    name: "Анна Иванова",
    email: "anna.ivanova@mail.ru",
    phone: "+7 (999) 123-45-67",
    height: "170 см",
    weight: "65 кг",
    size: "M",
    style: "Casual, Business",
  };

  const stats = [
    { label: "Образов", value: "24" },
    { label: "Вещей", value: "156" },
    { label: "Избранное", value: "18" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl text-black mb-1">Профиль</h1>
        <p className="text-gray-500">Ваши данные и настройки</p>
      </div>

      {/* Profile Info */}
      <div className="px-6 mb-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-[#FC7070] rounded-full flex items-center justify-center">
              <User size={36} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl text-black mb-1">{userData.name}</h2>
              <p className="text-sm text-gray-500">Пользователь с января 2026</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl text-black mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="px-6 mb-6">
        <h3 className="text-sm text-gray-500 mb-3">КОНТАКТНАЯ ИНФОРМАЦИЯ</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <Mail size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-black">{userData.email}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <Phone size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Телефон</p>
              <p className="text-sm text-black">{userData.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body Parameters */}
      <div className="px-6 mb-6">
        <h3 className="text-sm text-gray-500 mb-3">ПАРАМЕТРЫ</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <Ruler size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Рост</p>
              <p className="text-sm text-black">{userData.height}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <Weight size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Вес</p>
              <p className="text-sm text-black">{userData.weight}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <User size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Размер одежды</p>
              <p className="text-sm text-black">{userData.size}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <Settings size={20} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Стиль</p>
              <p className="text-sm text-black">{userData.style}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8 space-y-3">
        <Button variant="outline" className="w-full border-gray-300 text-gray-700">
          <Settings className="mr-2" size={20} />
          Настройки
        </Button>
        <Button variant="outline" className="w-full border-[#FC7070] text-[#FC7070]">
          <LogOut className="mr-2" size={20} />
          Выйти
        </Button>
      </div>
    </div>
  );
}
