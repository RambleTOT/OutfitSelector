import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, CodeInput, IconButton } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { HAS_API } from '../../lib/config'
import { ApiError, authErrorText, requestCode, setToken, verifyCode } from '../../lib/api'
import { applyServerState, applySub, startSync } from '../../lib/sync'

export const DEMO_CODE = '1111'

/** ON-03 EmailCode: в прототипе принимается код 1111 */
export function Code() {
  const navigate = useNavigate()
  const next = (useLocation().state as { next?: string } | null)?.next
  const email = useApp((s) => s.email)
  const signIn = useApp((s) => s.signIn)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!email) return <Navigate to="/login" replace />

  const submit = async (value = code) => {
    if (value.length < 4 || busy) return
    if (HAS_API) {
      setBusy(true)
      try {
        const r = await verifyCode(email, value)
        setToken(r.token)
        applySub(r.user)
        // вернувшийся человек: подтягиваем гардероб с сервера; новый: остаётся то, что набрал как гость
        if (r.state) applyServerState(r.state, r.stateAt)
        const res = signIn(email, 'email')
        void startSync()
        navigate(next ?? (r.state || res === 'returning' ? '/outfit' : firstStep()), { replace: true })
      } catch (e) {
        if (e instanceof ApiError && e.code === 'code_wrong') setError(true)
        else { toast(authErrorText(e), 'error'); setCode('') }
      } finally { setBusy(false) }
      return
    }
    if (value !== DEMO_CODE) { setError(true); return }
    const r = signIn(email, 'email')
    navigate(next ?? (r === 'returning' ? '/outfit' : firstStep()), { replace: true })
  }
  // новому человеку сначала предлагаем определить место (погода), потом анкета
  const firstStep = () => (useApp.getState().geoAsked ? '/onboarding/quiz' : '/onboarding/geo')
  const change = (v: string) => {
    setError(false)
    setCode(v)
    if (v.length === 4) setTimeout(() => submit(v), 150)
  }

  return (
    <div className="flow" style={{ padding: '56px 20px 32px', gap: 28 }}>
      <div><IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate('/login', { replace: true, state: { next } })} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 className="t-title1">Введи код из письма</h2>
        <p className="t-body muted">Отправили на {email}</p>
      </div>
      <div style={{ position: 'relative' }}>
        <CodeInput value={code} onChange={change} error={error} />
        {error && <p className="t-caption" style={{ color: 'var(--error-text)', textAlign: 'center', marginTop: 12 }}>Неверный код, попробуй ещё раз</p>}
      </div>
      <Button variant="text" icon="clipboard-text" style={{ alignSelf: 'flex-start' }} onClick={async () => {
        if (!HAS_API) { change(DEMO_CODE); return }
        try { const t = (await navigator.clipboard.readText()).replace(/\D/g, '').slice(0, 4); if (t.length === 4) change(t) } catch { toast('Не получилось вставить, введи код вручную', 'neutral') }
      }}>Вставить код из письма</Button>
      {HAS_API
        ? <Button variant="text" style={{ alignSelf: 'flex-start' }} onClick={() => requestCode(email, useApp.getState().consent || undefined).then(() => { setCode(''); setError(false); toast('Отправили новый код', 'success') }, (e) => toast(authErrorText(e), 'error'))}>Отправить код ещё раз</Button>
        : <span className="t-caption muted">Для демо подойдёт код {DEMO_CODE}</span>}
      <div style={{ marginTop: 'auto' }}>
        <Button full disabled={code.length < 4} loading={busy} onClick={() => submit()}>Войти</Button>
      </div>
    </div>
  )
}
