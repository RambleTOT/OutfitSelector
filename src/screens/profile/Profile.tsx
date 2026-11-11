import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, Button, Icon, IconButton, PlanBadge, SettingsList, SettingsRow, StatTile, Switch, TickBars } from '../../ui'
import { useApp, useLimits } from '../../store/app'
import { PLAN_PRICE } from '../../store/limits'
import { toast } from '../../store/ui'
import { openSupport, supportLabel } from '../../lib/support'
import { dateLong } from '../../lib/format'

const TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00']

/** PRF-01 Profile (+ PRF-04 подписка закончилась, PRF-07 выход) */
export function Profile() {
  const navigate = useNavigate()
  const app = useApp()
  const lim = useLimits()
  const [signOut, setSignOut] = useState(false)
  const { name, quiz, height, size, avatar, notif, theme, subEnded, items, saved } = app
  const sub = (k: keyof typeof notif) => (v: boolean) => app.patch({ notif: { ...notif, [k]: v } })
  const initial = (name || 'А').charAt(0).toUpperCase()
  const meta = [quiz.city, height && `${height} см`, size].filter(Boolean).join(' · ')
  const paid = lim.plan !== 'free'

  const quotas: { icon: string; label: string; left: number | null; max: number | null; note: string }[] = [
    { icon: 'sparkle', label: 'AI-образы', left: lim.outfitsLeft, max: lim.outfitsLimit, note: lim.outfitsLimit === null ? 'Без лимита, до 300 в месяц' : 'Обновятся в понедельник' },
    { icon: 'camera', label: 'Фото вещей', left: lim.photosLeft, max: lim.photosLimit, note: lim.photosPeriod === 'total' ? 'За всё время. Каталог без лимита' : lim.photosPeriod === 'month' ? 'В этом месяце. Каталог без лимита' : 'Без лимита' },
    { icon: 'heart', label: 'Избранное', left: lim.favLeft === null ? null : Math.max(0, lim.favLeft), max: lim.favLimit, note: lim.favLeft !== null && lim.favLeft <= 0 ? 'Места закончились' : lim.favLimit === null ? 'Без лимита' : 'Свободные места' },
  ]

  return (
    <div className="screen screen--fade" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar src={avatar} letter={initial} size={64} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="t-title2">{name || 'Профиль'}</span>
          {meta && <span className="t-caption muted">{meta}</span>}
        </span>
        <IconButton icon="pencil-simple" label="Редактировать" variant="solid" onClick={() => navigate('/profile/data')} />
      </div>

      {subEnded ? (
        <div className="card" style={{ borderRadius: 'var(--radius-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <PlanBadge plan="free" />
            {app.subEndedAt && <span className="t-caption muted">с {dateLong(app.subEndedAt)}</span>}
          </div>
          <span className="t-title2" style={{ textWrap: 'pretty' }}>Подписка закончилась</span>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>
            Все {items.length} вещей и {saved.length} сохранённых образов на месте и участвуют в образах. Новые добавлять можно в пределах Free
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <StatTile value="5" unit="в нед" label="образов" tone="sunken" size="sm" />
            <StatTile value={String(lim.photosLeft ?? 0)} unit="из 3" label="фото" tone="sunken" size="sm" />
            <StatTile value={String(saved.length)} unit="из 3" label="избранное" tone="sunken" size="sm" />
          </div>
          <Button full onClick={() => navigate('/paywall')}>Продлить за {PLAN_PRICE[app.plan === 'free' ? 'sub' : app.plan]} ₽</Button>
        </div>
      ) : (
        <div className="card" data-coach="profile" style={{ borderRadius: 'var(--radius-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="nav-row"><span className="t-headline" style={{ fontWeight: 800 }}>Осталось</span><PlanBadge plan={lim.plan} /></div>
          {quotas.map((q) => (
            <div key={q.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span className="t-callout" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={q.icon} size={20} color="var(--ink-secondary)" />{q.label}</span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ font: '800 var(--type-title2-size)/1 var(--font-ui)' }}>{q.max === null ? '∞' : q.left}</span>
                  {q.max !== null && <span className="t-caption muted">из {q.max}</span>}
                </span>
              </div>
              {q.max !== null && <TickBars value={q.left ?? 0} max={q.max} count={Math.min(q.max, 30)} height={10} />}
              <span className="t-caption muted">{q.note}</span>
            </div>
          ))}
          {lim.plan === 'plus'
            ? <Button variant="secondary" full onClick={() => navigate('/profile/subscription')}>Управлять подпиской</Button>
            : paid
              ? <Button variant="secondary" full onClick={() => navigate('/profile/subscription')}>Управлять подпиской</Button>
              : <Button variant="secondary" full onClick={() => navigate('/paywall')}>Больше с подпиской</Button>}
        </div>
      )}

      <span className="t-micro group-title" style={{ padding: '8px 4px 0' }}>Уведомления</span>
      <div className="list" style={{ padding: '4px 16px' }}>
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)' }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="t-body" style={{ fontWeight: 600 }}>Утреннее напоминание</span>
            <span className="t-caption muted">Погода и идея образа</span>
          </span>
          <button
            type="button" className="time-chip" aria-label="Время напоминания"
            onClick={() => app.patch({ notif: { ...notif, morningTime: TIMES[(TIMES.indexOf(notif.morningTime) + 1) % TIMES.length] } })}
          >{notif.morningTime.replace(/^0/, '')}</button>
        </div>
        {([['weather', 'Погода на завтра'], ['forgotten', 'Забытые вещи'], ['comeback', 'Напомнить, если давно не заходил'], ['limit', 'Лимит обновился'], ['payments', 'Оплата и подписка']] as const).map(([k, label], i, arr) => (
          <div key={k} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <Switch label={label} checked={notif[k]} onChange={sub(k)} />
          </div>
        ))}
      </div>
      <button type="button" className="row card" style={{ minHeight: 64, borderRadius: 'var(--radius-tile)', boxShadow: 'var(--shadow-card)' }} onClick={() => { if (!notif.telegramBot) { sub('telegramBot')(true); toast('Бот подключён', 'success', { icon: 'telegram-logo' }) } }}>
        <Icon name="telegram-logo" size={24} color="var(--accent)" />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="t-body" style={{ fontWeight: 600 }}>{notif.telegramBot ? 'Telegram-бот подключён' : 'Подключить Telegram-бота'}</span>
          <span className="t-caption muted">{notif.telegramBot ? 'Утренние идеи придут в Telegram' : 'Уведомления на iPhone без установки'}</span>
        </span>
        {notif.telegramBot ? <Icon name="check-circle" fill size={22} color="var(--success)" /> : <Icon name="caret-right" size={18} color="var(--ink-tertiary)" />}
      </button>

      <span className="t-micro group-title" style={{ padding: '8px 4px 0' }}>Оформление</span>
      <SettingsList>
        {([['system', 'Как в системе', 'device-mobile'], ['light', 'Светлая', 'sun'], ['dark', 'Тёмная', 'moon']] as const).map(([v, label, icon]) => (
          <SettingsRow key={v} icon={icon} label={label} trailing={theme === v ? <Icon name="check-circle" fill size={22} color="var(--accent)" /> : <Icon name="circle" size={22} color="var(--ink-tertiary)" />} onClick={() => app.setTheme(v)} />
        ))}
      </SettingsList>

      <SettingsList>
        <SettingsRow icon="arrows-clockwise" label="Пройти анкету стиля заново" onClick={() => navigate('/onboarding/quiz?only=style')} />
        <SettingsRow icon="map-pin" label="Город" value={quiz.city} onClick={() => navigate('/onboarding/quiz?only=city')} />
        <SettingsRow icon="device-mobile" label="Как установить на экран" onClick={() => navigate('/install')} />
        <SettingsRow icon="chat-circle" label={supportLabel()} onClick={() => openSupport()} />
      </SettingsList>
      <SettingsList>
        <SettingsRow icon="user" label="Мои данные" onClick={() => navigate('/profile/data')} />
        <SettingsRow icon="file-text" label="Документы" onClick={() => navigate('/profile/docs')} />
        <SettingsRow icon="sign-out" label="Выйти" onClick={() => setSignOut(true)} />
        <SettingsRow icon="trash" label="Удалить аккаунт" danger onClick={() => navigate('/profile/delete')} />
      </SettingsList>
      <span className="t-caption muted" style={{ textAlign: 'center' }}>Atelier 1.0</span>
      <div style={{ height: 96 }} />

      <BottomSheet open={signOut} onClose={() => setSignOut(false)} title="Выйти из аккаунта?" subtitle="Гардероб, образы и подписка сохранятся. Войти снова можно по почте или через Telegram">
        <Button variant="secondary" full icon="sign-out" onClick={() => { app.signOut(); setSignOut(false); navigate('/login', { replace: true }) }}>Выйти</Button>
        <Button variant="text" full onClick={() => setSignOut(false)}>Остаться</Button>
      </BottomSheet>
    </div>
  )
}

export function Avatar({ src, letter, size }: { src?: string; letter: string; size: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? <img src={src} alt="" /> : letter}
    </span>
  )
}
