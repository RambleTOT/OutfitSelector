import { useEffect, useState } from 'react'
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
import { Geo } from '../screens/onboarding/Geo'
import { FirstItems } from '../screens/onboarding/FirstItems'
import { AddItemSheet } from '../screens/add/AddItemSheet'
import { TemplatePicker } from '../screens/add/TemplatePicker'
import { Catalog } from '../screens/add/Catalog'
import { Camera } from '../screens/add/Camera'
import { Processing } from '../screens/add/Processing'
import { NotClothing } from '../screens/add/NotClothing'
import { PhotoCard } from '../screens/add/PhotoCard'
import { Found } from '../screens/add/Found'
import { useApp } from '../store/app'
import { CoachHost } from './CoachHost'
import { Install } from '../screens/install/Install'
import { Notify } from '../screens/install/Notify'
import { Wardrobe } from '../screens/wardrobe/Wardrobe'
import { ItemDetail } from '../screens/wardrobe/ItemDetail'
import { Favorites } from '../screens/favorites/Favorites'
import { SavedOutfitDetail } from '../screens/favorites/SavedOutfitDetail'
import { Profile } from '../screens/profile/Profile'
import { EditProfile } from '../screens/profile/EditProfile'
import { Documents } from '../screens/profile/Documents'
import { Subscription } from '../screens/profile/Subscription'
import { DeleteAccount } from '../screens/profile/DeleteAccount'
import { Paywall } from '../screens/paywall/Paywall'
import { PaymentError, PaymentSuccess } from '../screens/paywall/PaymentResult'
import { Kit } from '../screens/Kit'
import { InstallGate } from '../screens/install/InstallGate'
import { DEMO } from '../lib/config'
import { isMobileDevice } from '../lib/platform'
import { isStandaloneMode } from '../lib/pwa'

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
      {!hidden && <CoachHost key={active} tab={active} />}
      {!hidden && <TabBar active={active} onChange={(id) => navigate('/' + id, { replace: true })} />}
    </>
  )
}

/** Плавающие внизу элементы: плашка с кнопками, таббар, стопка кнопок на «Образе», круглая кнопка. Под них экран оставляет место, чтобы последний блок не прятался */
const FLOATING = '.cta-plate, .tabbar, .bottom-actions, .fab'

/**
 * Считает, сколько снизу занято плавающими элементами (с учётом отступа от края и выреза iPhone), и кладёт в --bottom-clear.
 * Экраны добавляют это к нижнему отступу плюс запас 32 px: так последний блок всегда можно докрутить до конца, на любом телефоне
 */
function useBottomClear() {
  const [app, setApp] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!app) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const measure = () => {
      let max = 0
      app.querySelectorAll<HTMLElement>(FLOATING).forEach((el) => {
        if (el.closest('.overlay-root') || !el.offsetHeight) return
        const bottom = parseFloat(getComputedStyle(el).bottom) || 0
        max = Math.max(max, el.offsetHeight + bottom)
      })
      app.style.setProperty('--bottom-clear', `${Math.round(max + 32)}px`)
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(measure, 30) } // таймер, а не rAF: в фоновой вкладке rAF не срабатывает
    const mo = new MutationObserver(schedule)
    mo.observe(app, { childList: true, subtree: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    ro?.observe(app)
    window.addEventListener('resize', schedule)
    schedule()
    return () => { mo.disconnect(); ro?.disconnect(); window.removeEventListener('resize', schedule); clearTimeout(timer) }
  }, [app])
  return setApp
}

/** Внутренность приложения: роуты, оверлеи и тосты живут внутри рамки (position: absolute) */
export function AppShell() {
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  const gateDone = useApp((s) => s.gateDone)
  const appRef = useBottomClear()
  // экран установки: только в браузере телефона, пока иконку не поставили и не пропустили; в демо и на десктопе его нет
  if (!DEMO && !gateDone && isMobileDevice() && !isStandaloneMode()) return <div className="app"><InstallGate /></div>
  return (
    <div className="app" ref={appRef}>
      <OverlayContext.Provider value={overlay}>
        <Routes>
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/code" element={<Code />} />
          <Route element={<RequireSignedIn />}>
            <Route path="/onboarding/geo" element={<Geo />} />
            <Route path="/onboarding/quiz" element={<Quiz />} />
            <Route path="/onboarding/items" element={<FirstItems />} />
            <Route path="/add/catalog" element={<Catalog />} />
            <Route path="/add/template" element={<TemplatePicker />} />
            <Route path="/add/photo" element={<Camera />} />
            <Route path="/add/processing" element={<Processing />} />
            <Route path="/add/notclothing" element={<NotClothing />} />
            <Route path="/add/card" element={<PhotoCard />} />
            <Route path="/add/found" element={<Found />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/install" element={<Install />} />
            <Route path="/install/notify" element={<Notify />} />
            <Route element={<RequireOnboarded />}>
              <Route element={<TabLayout />}>
                <Route path="/outfit" element={<OutfitHome />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/favorites/:id" element={<SavedOutfitDetail />} />
              <Route path="/profile/data" element={<EditProfile />} />
              <Route path="/profile/docs" element={<Documents />} />
              <Route path="/profile/subscription" element={<Subscription />} />
              <Route path="/profile/delete" element={<DeleteAccount />} />
              <Route path="/paywall" element={<Paywall />} />
              <Route path="/paywall/success" element={<PaymentSuccess />} />
              <Route path="/paywall/error" element={<PaymentError />} />
              <Route path="/outfit/result" element={<OutfitResult />} />
              <Route path="/outfit/share" element={<ShareStory />} />
              <Route path="/constructor" element={<Constructor />} />
            </Route>
          </Route>
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/outfit" replace />} />
        </Routes>
        <AddItemSheet />
        <div className="overlay-root" ref={setOverlay} />
        <ToastHost />
      </OverlayContext.Provider>
    </div>
  )
}
