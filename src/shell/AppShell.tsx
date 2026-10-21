import { useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { OverlayContext, TabBar, ToastHost } from '../ui'
import { useUi } from '../store/ui'
import { OutfitHome } from '../screens/outfit/OutfitHome'
import { OutfitResult } from '../screens/outfit/OutfitResult'
import { ShareStory } from '../screens/outfit/ShareStory'
import { Constructor } from '../screens/Constructor'
import { Splash } from '../screens/onboarding/Splash'
import { Login } from '../screens/onboarding/Login'
import { Code } from '../screens/onboarding/Code'
import { Quiz } from '../screens/onboarding/Quiz'
import { FirstItems } from '../screens/onboarding/FirstItems'
import { AddItemSheet } from '../screens/add/AddItemSheet'
import { TemplatePicker } from '../screens/add/TemplatePicker'
import { Camera } from '../screens/add/Camera'
import { Processing } from '../screens/add/Processing'
import { NotClothing } from '../screens/add/NotClothing'
import { PhotoCard } from '../screens/add/PhotoCard'
import { useApp } from '../store/app'
import { Wardrobe } from '../screens/wardrobe/Wardrobe'
import { ItemDetail } from '../screens/wardrobe/ItemDetail'
import { Favorites } from '../screens/Favorites'
import { Profile } from '../screens/Profile'
import { Kit } from '../screens/Kit'

/** Без входа пускаем только на сплеш */
function RequireSignedIn() {
  const signedIn = useApp((s) => s.signedIn)
  return signedIn ? <Outlet /> : <Navigate to="/splash" replace />
}

/** Пока не пройдена анкета и первые вещи, основное приложение закрыто */
function RequireOnboarded() {
  const { quizDone, onboarded } = useApp()
  if (!quizDone) return <Navigate to="/onboarding/quiz" replace />
  if (!onboarded) return <Navigate to="/onboarding/items" replace />
  return <Outlet />
}

function TabLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = pathname.split('/')[1] || 'outfit'
  const hidden = useUi((s) => s.tabBarHidden)
  return (
    <>
      <Outlet />
      {!hidden && <TabBar active={active} onChange={(id) => navigate('/' + id, { replace: true })} />}
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
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/code" element={<Code />} />
          <Route element={<RequireSignedIn />}>
            <Route path="/onboarding/quiz" element={<Quiz />} />
            <Route path="/onboarding/items" element={<FirstItems />} />
            <Route path="/add/template" element={<TemplatePicker />} />
            <Route path="/add/photo" element={<Camera />} />
            <Route path="/add/processing" element={<Processing />} />
            <Route path="/add/notclothing" element={<NotClothing />} />
            <Route path="/add/card" element={<PhotoCard />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route element={<RequireOnboarded />}>
              <Route element={<TabLayout />}>
                <Route path="/outfit" element={<OutfitHome />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/outfit/result" element={<OutfitResult />} />
              <Route path="/outfit/share" element={<ShareStory />} />
              <Route path="/constructor" element={<Constructor />} />
            </Route>
          </Route>
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
        <AddItemSheet />
        <div className="overlay-root" ref={setOverlay} />
        <ToastHost />
      </OverlayContext.Provider>
    </div>
  )
}
