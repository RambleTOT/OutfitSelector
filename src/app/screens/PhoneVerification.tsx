import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneCall } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function PhoneVerification() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [statusMessage, setStatusMessage] = useState("");

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const nextCode = [...code];
      nextCode[index] = value;
      setCode(nextCode);

      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus();
      }
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate("/additional-params");
  };

  const handleResend = () => {
    const nextCode = String(Math.floor(100000 + Math.random() * 900000)).split("");
    setCode(nextCode);
    setStatusMessage(`Новый код отправлен: ${nextCode.join("")}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#f7f7f8] px-5 py-7">
      <div className="mb-8 rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-2xl bg-[#FC7070]/10 p-3">
            <PhoneCall size={20} className="text-[#FC7070]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Шаг 2 из 3</p>
            <h1 className="text-[28px] leading-[1.15] text-black">Подтверждение звонком</h1>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Введите код, который пришел после подтверждающего звонка.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleCodeChange(index, event.target.value)}
                className="h-12 w-12 rounded-2xl text-center text-xl"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleResend}
            className="mt-5 w-full text-sm text-gray-500"
          >
            Не пришел звонок? <span className="text-[#FC7070]">Запросить повторно</span>
          </button>
          {statusMessage ? (
            <p className="mt-3 text-center text-xs text-[#FC7070]">{statusMessage}</p>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <Button type="submit" className="h-12 w-full rounded-2xl bg-[#FC7070] text-white hover:bg-[#f45d5d]">
            Подтвердить
          </Button>
        </div>
      </form>
    </div>
  );
}
