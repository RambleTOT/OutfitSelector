import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function PhoneVerification() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/additional-params");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col">
        <div className="mb-12">
          <h1 className="text-3xl text-black mb-2">Подтверждение телефона</h1>
          <p className="text-gray-500">
            Мы отправили код подтверждения на ваш номер телефона
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex justify-center gap-3 mb-8">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-xl"
                />
              ))}
            </div>

            <button
              type="button"
              className="w-full text-center text-sm text-gray-600"
            >
              Не получили код?{" "}
              <span className="text-[#FC7070]">Отправить повторно</span>
            </button>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              className="w-full bg-[#FC7070] hover:bg-[#fc5050] text-white"
            >
              Подтвердить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
