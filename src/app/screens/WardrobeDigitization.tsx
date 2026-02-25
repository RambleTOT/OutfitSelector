import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Camera, Upload } from "lucide-react";

export function WardrobeDigitization() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/app/home");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl text-black mb-2">Цифровой гардероб</h1>
          <p className="text-gray-500">
            Сфотографируйте или загрузите фото вашей одежды
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="text-center">
              <Camera size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Наведите камеру на одежду</p>
            </div>
            {/* Camera preview would go here */}
          </div>

          <div className="w-full space-y-3">
            <Button className="w-full bg-[#FC7070] hover:bg-[#fc5050] text-white">
              <Camera className="mr-2" size={20} />
              Сделать фото
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700">
              <Upload className="mr-2" size={20} />
              Загрузить из галереи
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleComplete}
            variant="ghost"
            className="w-full text-gray-600"
          >
            Пропустить и продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}
