import { isNative } from './config'

/** Только для APK (Capacitor): кнопка «Назад» ведёт по приложению, а не закрывает его; цвет строки состояния */
export async function initNative() {
  if (!isNative()) return
  try {
    const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/app'), import('@capacitor/status-bar'), import('@capacitor/splash-screen'),
    ])
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {})
    App.addListener('backButton', () => {
      const h = location.hash
      // с корневых экранов выходим из приложения, с остальных идём назад
      if (!h || /^#\/(outfit|wardrobe|favorites|profile|splash|login)?$/.test(h)) void App.exitApp()
      else history.back()
    })
    await SplashScreen.hide()
  } catch { /* плагины недоступны: приложение работает как обычный сайт */ }
}
