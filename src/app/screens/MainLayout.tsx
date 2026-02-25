import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, Shirt, Bookmark, User, Grid3x3 } from "lucide-react";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/app/wardrobe", icon: Shirt, label: "Гардероб" },
    { path: "/app/feed", icon: Grid3x3, label: "Лента" },
    { path: "/app/home", icon: Home, label: "Главная" },
    { path: "/app/favorites", icon: Bookmark, label: "Избранное" },
    { path: "/app/profile", icon: User, label: "Профиль" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 min-w-0 flex-1"
              >
                <item.icon
                  size={24}
                  className={isActive ? "text-[#FC7070]" : "text-gray-400"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-[#FC7070]" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
