import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, TextInput } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { CONSENT_VERSION, HAS_API } from '../../lib/config'
import { authErrorText, requestCode } from '../../lib/api'

export const emailOk = (v: string) => /.+@.+\..+/.test(v.trim())

/** ON-02 SignIn: почта с кодом или Telegram (бот подключается сразу) */
export function Login() {
  const navigate = useNavigate()
  const after = (useLocation().state as { next?: string } | null)?.next
  const signIn = useApp((s) => s.signIn)
  const patch = useApp((s) => s.patch)
  const stored = useApp((s) => s.email)
  const [email, setEmail] = useState(stored)
  const bad = !emailOk(email)
  const [busy, setBusy] = useState(false)
  // согласие даётся действием: галочка снята, пока человек сам не отметит (на устройстве, где он уже соглашался с этой редакцией, она уже стоит)
  const [agree, setAgree] = useState(useApp.getState().consent === CONSENT_VERSION)

  const next = async () => {
    if (bad || busy || !agree) return
    patch({ email: email.trim(), consent: CONSENT_VERSION })
    if (HAS_API) {
      setBusy(true)
      try { await requestCode(email.trim(), CONSENT_VERSION) } catch (e) { toast(authErrorText(e), 'error'); setBusy(false); return }
      setBusy(false)
    }
    navigate('/code', { state: { next: after } })
  }
  const telegram = () => {
    const r = signIn('', 'telegram')
    toast('Бот подключён', 'success', { icon: 'telegram-logo' })
    navigate(after ?? (r === 'returning' ? '/outfit' : '/onboarding/quiz'), { replace: true })
  }

  return (
    <div className="flow" style={{ padding: '64px 20px 32px', gap: 32 }}>
      <span className="wordmark" style={{ fontSize: 32 }}>Atelier</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 className="t-title1" style={{ textWrap: 'pretty' }}>Войди, чтобы сохранить свой гардероб</h2>
        <p className="t-body muted">Пришлём код на почту</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextInput label="Почта" placeholder="name@mail.ru" type="email" inputMode="email" icon="envelope-simple" value={email} onChange={setEmail} onEnter={next} />
        <Checkbox checked={agree} onChange={setAgree}>Даю согласие на обработку персональных данных</Checkbox>
        <p className="t-caption muted" style={{ textWrap: 'pretty', paddingLeft: 36 }}>
          Читай{' '}
          <a href="/legal/consent.html" target="_blank" rel="noopener" style={{ color: 'var(--text-link)' }}>согласие</a>,{' '}
          <a href="/legal/privacy.html" target="_blank" rel="noopener" style={{ color: 'var(--text-link)' }}>политику конфиденциальности</a>,{' '}
          <a href="/legal/terms.html" target="_blank" rel="noopener" style={{ color: 'var(--text-link)' }}>пользовательское соглашение</a>{' '}и{' '}
          <a href="/legal/offer.html" target="_blank" rel="noopener" style={{ color: 'var(--text-link)' }}>оферту</a>. Продолжая, ты принимаешь соглашение и оферту
        </p>
        <Button full disabled={bad || !agree} loading={busy} onClick={next}>Получить код</Button>
      </div>
      {!HAS_API && (
        <>
          <div className="or-line t-caption"><span />или<span /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <Button variant="secondary" icon="telegram-logo" full onClick={telegram}>Войти через Telegram</Button>
            <span className="t-caption muted">Сразу подключим бота для уведомлений</span>
          </div>
        </>
      )}
    </div>
  )
}
