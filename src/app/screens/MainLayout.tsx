import { Navigate, Outlet, useNavigate, useLocation } from "react-router";
import { Home, Shirt, Bookmark, User, Grid3x3 } from "lucide-react";
import { useAppState } from "../state/AppState";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authReady, isAuthenticated } = useAppState();

  const navItems = [
    { path: "/app/wardrobe", icon: Shirt, label: "Гардероб" },
    { path: "/app/feed", icon: Grid3x3, label: "Лента" },
    { path: "/app/home", icon: Home, label: "Главная" },
    { path: "/app/favorites", icon: Bookmark, label: "Избранное" },
    { path: "/app/profile", icon: User, label: "Профиль" },
  ];

  if (authReady && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#ececed]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#f7f7f8] shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="flex-1 overflow-auto pb-24">
          <Outlet />
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-3 pb-3">
        <div className="safe-bottom rounded-[28px] border border-black/5 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
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
    </div>
  );
}
