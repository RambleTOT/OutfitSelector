import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAppState } from "../state/AppState";

export function Login() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAppState();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: userProfile.phone,
    password: "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateUserProfile({ phone: formData.phone });
    navigate("/app/home");
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f7f8] px-5 py-7">
      <div className="mb-8 rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <p className="text-sm text-gray-500">Возвращение в приложение</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] text-black">Вход</h1>
        <p className="mt-2 text-sm text-gray-500">
          Войдите по номеру телефона и продолжите подбор образов.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-700">Телефон</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="+7 (___) ___-__-__"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Пароль</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                  placeholder="Введите пароль"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="button" className="text-sm text-[#FC7070]">
              Забыли пароль?
            </button>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]">
          Войти
        </Button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-sm text-gray-600"
        >
          Нет аккаунта? <span className="text-[#FC7070]">Зарегистрироваться</span>
        </button>
      </form>
    </div>
  );
}
