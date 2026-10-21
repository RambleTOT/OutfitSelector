import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { useOutfitFlow } from '../../store/outfit'
import { isInApp, resolvePlatform } from '../../lib/platform'

/** ON-13 NotificationsPrimer (после установки или на Android), ON-14 TelegramBotPrimer (iOS без установки и внутри браузеров приложений) */
export function Notify() {
  const navigate = useNavigate()
  const app = useApp()
  const platform = resolvePlatform(app.platform)
  const bot = isInApp(platform) || (platform === 'ios' && !app.installed)
  const done = () => { useOutfitFlow.getState().back(); navigate('/outfit', { replace: true }) }

  const enable = async () => {
    if (bot) {
      app.patch({ notif: { ...app.notif, telegramBot: true } })
      toast('Бот подключён', 'success', { icon: 'telegram-logo' })
    } else {
      try { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission() } catch { /* система не показала запрос */ }
      toast('Уведомления включены', 'success', { icon: 'bell' })
    }
    done()
  }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 170px', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={done} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', paddingTop: 8 }}>
          <span className="card" style={{ width: 96, height: 96, borderRadius: 999, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={bot ? 'telegram-logo' : 'bell-ringing'} size={44} />
          </span>
          <h2 className="t-title1" style={{ textWrap: 'pretty' }}>{bot ? 'Подсказки придут в Telegram' : 'Буду подсказывать, что надеть'}</h2>
          <span className="t-body muted" style={{ textWrap: 'pretty' }}>
            {bot
              ? 'На iPhone уведомления от сайта работают только после установки на экран. Бот присылает то же самое и сразу'
              : 'Утром идея образа с погодой, вечером предупрежу о дожде'}
          </span>
        </div>
        <span className="t-caption muted" style={{ textAlign: 'center', lineHeight: '18px', textWrap: 'pretty' }}>
          {bot ? 'Не больше одного в день. С 22:00 до 8:00 тишина. Каждый тип отключается в профиле' : 'Не больше одного в день. С 22:00 до 8:00 тишина'}
        </span>
      </div>
      <CtaPlate>
        <Button full icon={bot ? 'telegram-logo' : 'bell'} onClick={enable}>{bot ? 'Подключить бота' : 'Включить'}</Button>
        {bot && platform === 'ios' && <Button variant="secondary" full onClick={() => navigate('/install', { replace: true, state: { flow: 'first' } })}>Лучше установить на экран</Button>}
        <Button variant="text" full onClick={done}>Не сейчас</Button>
      </CtaPlate>
    </>
  )
}
