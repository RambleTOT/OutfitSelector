import type { CapacitorConfig } from '@capacitor/cli'

/** Обёртка для RuStore: тот же сайт из собранной папки dist внутри WebView. API берётся из VITE_API_URL на этапе сборки */
const config: CapacitorConfig = {
  appId: 'ru.atelier.app',
  appName: 'Atelier',
  webDir: 'dist',
  backgroundColor: '#F4F4F6',
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#F4F4F6', showSpinner: false },
  },
}
export default config
