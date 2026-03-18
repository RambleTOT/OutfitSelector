import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { formatPhoneMask, isPhoneComplete } from "../lib/phone";
import { useAppState } from "../state/AppState";

export function Registration() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAppState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
    password: "",
    confirmPassword: "",
  });
  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const phoneIsComplete = isPhoneComplete(formData.phone);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!phoneIsComplete || !passwordsMatch) {
      return;
    }

    updateUserProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    });
    navigate("/verify");
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f7f8] px-5 py-7">
      <div className="mb-8 rounded-[30px] bg-[#111111] p-5 text-white shadow-[0_22px_48px_rgba(17,17,17,0.18)]">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <Sparkles size={20} className="text-[#FC7070]" />
          </div>
          <div>
            <p className="text-sm text-white/60">AI Outfit Selector</p>
            <h1 className="text-[28px] leading-[1.15]">Регистрация</h1>
          </div>
        </div>
        <p className="text-sm text-white/70">
          Создай аккаунт, чтобы оцифровывать гардероб и получать подбор образа по погоде.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-700">Имя</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Анна"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Почта</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="example@mail.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Телефон</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    phone: formatPhoneMask(event.target.value),
                  })
                }
                placeholder="(999) 123 45-67"
                required
              />
              {!phoneIsComplete && formData.phone.length > 0 ? (
                <p className="mt-2 text-xs text-[#FC7070]">
                  Введите номер в формате (999) 123 45-67
                </p>
              ) : null}
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

            <div>
              <label className="mb-2 block text-sm text-gray-700">Повторите пароль</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData({ ...formData, confirmPassword: event.target.value })
                  }
                  placeholder="Повторите пароль"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && !passwordsMatch ? (
                <p className="mt-2 text-xs text-[#FC7070]">Пароли не совпадают</p>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!phoneIsComplete || (formData.confirmPassword.length > 0 && !passwordsMatch)}
          className="h-12 w-full rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]"
        >
          Продолжить
        </Button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-sm text-gray-600"
        >
          Уже есть аккаунт? <span className="text-[#FC7070]">Войти</span>
        </button>
      </form>
    </div>
  );
}
