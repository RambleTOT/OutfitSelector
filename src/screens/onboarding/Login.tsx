import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, TextInput } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'

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

  const next = () => {
    if (bad) return
    patch({ email: email.trim() })
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
        <Button full disabled={bad} onClick={next}>Получить код</Button>
      </div>
      <div className="or-line t-caption"><span />или<span /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <Button variant="secondary" icon="telegram-logo" full onClick={telegram}>Войти через Telegram</Button>
        <span className="t-caption muted">Сразу подключим бота для уведомлений</span>
      </div>
    </div>
  )
}
