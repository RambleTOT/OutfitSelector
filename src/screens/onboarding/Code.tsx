import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CodeInput, IconButton } from '../../ui'
import { useApp } from '../../store/app'

export const DEMO_CODE = '1111'

/** ON-03 EmailCode: в прототипе принимается код 1111 */
export function Code() {
  const navigate = useNavigate()
  const email = useApp((s) => s.email)
  const signIn = useApp((s) => s.signIn)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  if (!email) return <Navigate to="/login" replace />

  const submit = (value = code) => {
    if (value.length < 4) return
    if (value !== DEMO_CODE) { setError(true); return }
    const r = signIn(email, 'email')
    navigate(r === 'returning' ? '/outfit' : '/onboarding/quiz', { replace: true })
  }
  const change = (v: string) => {
    setError(false)
    setCode(v)
    if (v.length === 4) setTimeout(() => submit(v), 150)
  }

  return (
    <div className="flow" style={{ padding: '56px 20px 32px', gap: 28 }}>
      <div><IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate('/login', { replace: true })} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 className="t-title1">Введи код из письма</h2>
        <p className="t-body muted">Отправили на {email}</p>
      </div>
      <div style={{ position: 'relative' }}>
        <CodeInput value={code} onChange={change} error={error} />
        {error && <p className="t-caption" style={{ color: 'var(--error-text)', textAlign: 'center', marginTop: 12 }}>Неверный код, попробуй ещё раз</p>}
      </div>
      <Button variant="text" icon="clipboard-text" style={{ alignSelf: 'flex-start' }} onClick={() => change(DEMO_CODE)}>Вставить код из письма</Button>
      <span className="t-caption muted">Для демо подойдёт код {DEMO_CODE}</span>
      <div style={{ marginTop: 'auto' }}>
        <Button full disabled={code.length < 4} onClick={() => submit()}>Войти</Button>
      </div>
    </div>
  )
}
