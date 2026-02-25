import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app/home");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-12">
          <h1 className="text-3xl text-black mb-2">Вход</h1>
          <p className="text-gray-500">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Телефон</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (___) ___-__-__"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Пароль</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Введите пароль"
                className="w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="button" className="text-sm text-[#FC7070]">
            Забыли пароль?
          </button>

          <div className="space-y-4 pt-4">
            <Button type="submit" className="w-full bg-[#FC7070] hover:bg-[#fc5050] text-white">
              Войти
            </Button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full text-sm text-gray-600"
            >
              Нет аккаунта? <span className="text-[#FC7070]">Зарегистрироваться</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
