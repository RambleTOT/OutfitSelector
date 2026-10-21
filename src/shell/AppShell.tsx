import { useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { OverlayContext, TabBar, ToastHost } from '../ui'
import { OutfitHome } from '../screens/OutfitHome'
import { Wardrobe } from '../screens/Wardrobe'
import { Favorites } from '../screens/Favorites'
import { Profile } from '../screens/Profile'
import { Kit } from '../screens/Kit'

function TabLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = pathname.split('/')[1] || 'outfit'
  return (
    <>
      <Outlet />
      <TabBar active={active} onChange={(id) => navigate('/' + id, { replace: true })} />
    </>
  )
}

/** Внутренность приложения: роуты, оверлеи и тосты живут внутри рамки (position: absolute) */
export function AppShell() {
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  return (
    <div className="app">
      <OverlayContext.Provider value={overlay}>
        <Routes>
          <Route path="/" element={<Navigate to="/outfit" replace />} />
          <Route element={<TabLayout />}>
            <Route path="/outfit" element={<OutfitHome />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/outfit" replace />} />
        </Routes>
        <div className="overlay-root" ref={setOverlay} />
        <ToastHost />
      </OverlayContext.Provider>
    </div>
  )
}
