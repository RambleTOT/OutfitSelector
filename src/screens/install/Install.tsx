import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { IN_APP, isInApp, resolvePlatform } from '../../lib/platform'

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent })
}

/** ON-10 InstallIOS, ON-11 InstallAndroid, ON-12 OpenInBrowser. Из первого сохранения ведёт дальше на уведомления, из профиля возвращает назад */
export function Install() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { flow?: 'first' | 'profile' } | null }
  const pref = useApp((s) => s.platform)
  const patch = useApp((s) => s.patch)
  const platform = resolvePlatform(pref)
  const first = state?.flow === 'first'
  const [copied, setCopied] = useState(false)

  const next = () => (first ? navigate('/install/notify', { replace: true, state: { flow: 'first' } }) : navigate(-1))

  if (isInApp(platform)) {
    const a = IN_APP[platform as keyof typeof IN_APP]
    return (
      <>
        <div className="flow" style={{ padding: '56px 20px 160px', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={next} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 className="t-title1">Открой Atelier в браузере</h2>
            <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>{a.why}</span>
          </div>
          <div className="list" style={{ padding: '4px 16px' }}>
            {a.steps.map((t, i) => (
              <div key={t} style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 14, borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <Num n={i + 1} />
                <span className="t-callout" style={{ flex: 1 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <CtaPlate>
          <Button variant="secondary" full icon="link" onClick={async () => { try { await navigator.clipboard.writeText(location.href) } catch { /* буфер недоступен */ } setCopied(true) }}>{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</Button>
          <Button variant="text" full onClick={next}>Продолжить здесь</Button>
        </CtaPlate>
      </>
    )
  }

  if (platform === 'android') {
    const install = async () => {
      if (deferred) { await deferred.prompt(); await deferred.userChoice; deferred = null }
      else toast('Atelier добавлен на экран', 'success', { icon: 'device-mobile' })
      patch({ installed: true })
      next()
    }
    return (
      <>
        <div className="flow" style={{ padding: '56px 20px 160px', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={next} /></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
            <span style={{ width: 112, height: 112, borderRadius: 32, background: 'var(--gradient-sunset-cta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: 64, fontWeight: 600 }}>A</span>
            <h2 className="t-title1">Поставь Atelier на экран</h2>
            <span className="t-body muted" style={{ textWrap: 'pretty' }}>Откроется в одно касание, без браузера</span>
          </div>
        </div>
        <CtaPlate>
          <Button full icon="download-simple" onClick={install}>Установить</Button>
          <Button variant="text" full onClick={next}>Не сейчас</Button>
        </CtaPlate>
      </>
    )
  }

  const steps = [
    { icon: 'export', text: 'Нажми Поделиться внизу Safari' },
    { icon: 'plus-square', text: 'Выбери На экран Домой' },
    { icon: 'check', text: 'Нажми Добавить вверху справа' },
  ]
  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 170px', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={next} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="t-title1">Поставь Atelier на экран</h2>
          <span className="t-callout muted" style={{ fontWeight: 400, textWrap: 'pretty' }}>Откроется как приложение, и придут утренние идеи образов</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((st, i) => (
            <div key={st.text} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 16px 12px 12px' }}>
              <Num n={i + 1} />
              <span className="t-callout" style={{ flex: 1, textWrap: 'pretty' }}>{st.text}</span>
              <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: 'var(--bg-sunken)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={st.icon} size={24} /></span>
            </div>
          ))}
        </div>
      </div>
      <CtaPlate>
        <Button full onClick={() => { patch({ installed: true }); next() }}>Готово, поставил</Button>
        <Button variant="text" full onClick={next}>Не сейчас</Button>
      </CtaPlate>
    </>
  )
}

function Num({ n }: { n: number }) {
  return <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 999, background: 'var(--ink-primary)', color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 13px/1 var(--font-ui)' }}>{n}</span>
}
