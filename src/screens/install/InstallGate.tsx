import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button, CtaPlate, Icon } from '../../ui'
import { useApp } from '../../store/app'
import { IN_APP, detectPlatform, isInApp, isIOSOtherBrowser, isRealIOS } from '../../lib/platform'
import { canPromptInstall, promptInstall, subscribePwa, wasInstalled } from '../../lib/pwa'
import { track } from '../../lib/analytics'

/**
 * ON-00 InstallGate: первый экран приложения в браузере телефона.
 * Цель — чтобы человек положил иконку на главный экран за 1–3 касания и дальше открывал Atelier как обычное приложение.
 * Регистрация идёт уже внутри установленного приложения: на iPhone хранилище Safari и иконки на экране раздельные, данные из браузера туда не переезжают.
 */
export function InstallGate() {
  const finish = useApp((s) => s.patch)
  const [installed, setInstalled] = useState(false)
  const canPrompt = useSyncExternalStore(subscribePwa, canPromptInstall)
  const appInstalled = useSyncExternalStore(subscribePwa, wasInstalled)
  const platform = detectPlatform()

  useEffect(() => { track('gate_view', { platform }) }, [platform])
  useEffect(() => { if (appInstalled) setInstalled(true) }, [appInstalled])

  const skip = () => { track('gate_skip', { platform }); finish({ gateDone: true }) }
  const doInstall = async () => {
    track('gate_install_tap', { platform })
    const ok = await promptInstall()
    if (ok) { track('gate_installed', { platform }); setInstalled(true) }
  }

  return (
    <div className="gate" role="main">
      <div className="gate__glow" aria-hidden />
      <div className="gate__body">
        <span className="wordmark" style={{ fontSize: 28 }}>Atelier</span>
        {installed ? <Done />
          : isInApp(platform) ? <InApp platform={platform as keyof typeof IN_APP} />
          : isRealIOS() ? <IOS other={isIOSOtherBrowser()} />
          : canPrompt ? <AndroidOneTap />
          : <AndroidManual />}
      </div>
      <CtaPlate>
        {!installed && !isInApp(platform) && canPrompt && !isRealIOS() && <Button full icon="download-simple" onClick={doInstall}>Установить</Button>}
        {installed && <Button full onClick={skip}>Открыть здесь</Button>}
        {!installed && <Button variant="text" full onClick={skip}>Продолжить в браузере</Button>}
        {!installed && isRealIOS() && !isInApp(platform) && !isIOSOtherBrowser() && <span className="gate__pointer t-caption" aria-hidden><Icon name="arrow-down" size={20} />Кнопка Поделиться там, внизу</span>}
        {!installed && isRealIOS() && !isInApp(platform) && <span className="t-caption muted" style={{ textAlign: 'center', textWrap: 'pretty' }}>В браузере и на экране «Домой» данные хранятся отдельно. Лучше начать сразу с иконки</span>}
      </CtaPlate>
    </div>
  )
}

function Head({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h1 className="t-title1" style={{ textWrap: 'balance' }}>{title}</h1>
      <p className="t-body muted" style={{ textWrap: 'pretty' }}>{text}</p>
    </div>
  )
}

function Num({ n }: { n: number }) {
  return <span className="gate__num">{n}</span>
}

function AppIcon({ size = 96 }: { size?: number }) {
  return <span className="gate__icon" style={{ width: size, height: size, borderRadius: size * 0.28, fontSize: size * 0.58 }} aria-hidden>A</span>
}

function AndroidOneTap() {
  return (
    <>
      <div className="gate__hero"><AppIcon size={112} /></div>
      <Head title="Поставь Atelier на экран" text="Одно касание, и Atelier открывается как приложение: без адресной строки, быстро и с утренними идеями образов" />
    </>
  )
}

function AndroidManual() {
  const steps = [
    { icon: 'dots-three', text: 'Нажми меню браузера (три точки)', hint: 'Справа вверху или внизу экрана' },
    { icon: 'download-simple', text: 'Выбери Установить приложение', hint: 'Или Добавить на главный экран' },
    { icon: 'check', text: 'Подтверди', hint: 'Иконка Atelier появится на экране' },
  ]
  return (
    <>
      <Head title="Поставь Atelier на экран" text="Три касания, и Atelier открывается как приложение" />
      <Steps steps={steps} />
    </>
  )
}

function IOS({ other }: { other: boolean }) {
  const steps = [
    { icon: 'export', text: 'Нажми Поделиться', hint: other ? 'Квадрат со стрелкой, вверху справа' : 'Квадрат со стрелкой, внизу экрана' },
    { icon: 'plus-square', text: 'Выбери На экран Домой', hint: 'Прокрути список вниз' },
    { icon: 'check', text: 'Нажми Добавить', hint: 'Иконка Atelier появится на экране' },
  ]
  return (
    <>
      <Head title="Поставь Atelier на экран" text="Три касания, и Atelier открывается как приложение. Потом открой его с иконки" />
      <Steps steps={steps} />
    </>
  )
}

function Steps({ steps }: { steps: { icon: string; text: string; hint: string }[] }) {
  return (
    <ol className="gate__steps">
      {steps.map((st, i) => (
        <li key={st.text} className="card gate__step">
          <Num n={i + 1} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="t-callout">{st.text}</span>
            <span className="t-caption muted">{st.hint}</span>
          </span>
          <span className="gate__stepicon"><Icon name={st.icon} size={24} /></span>
        </li>
      ))}
    </ol>
  )
}

function InApp({ platform }: { platform: keyof typeof IN_APP }) {
  const a = IN_APP[platform]
  const [copied, setCopied] = useState(false)
  return (
    <>
      <Head title="Открой Atelier в браузере" text={a.why} />
      <ol className="gate__steps">
        {a.steps.map((t, i) => (
          <li key={t} className="card gate__step"><Num n={i + 1} /><span className="t-callout" style={{ flex: 1 }}>{t}</span></li>
        ))}
      </ol>
      <Button variant="secondary" full icon="link" onClick={async () => { try { await navigator.clipboard.writeText(location.href) } catch { /* буфер недоступен */ } setCopied(true) }}>{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</Button>
    </>
  )
}

function Done() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
      <div className="gate__hero"><AppIcon size={96} /></div>
      <Head title="Atelier на твоём экране" text="Закрой браузер и открой Atelier с иконки на главном экране. Там и начнём" />
    </div>
  )
}
