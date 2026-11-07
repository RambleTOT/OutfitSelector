import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui'
import { useApp } from '../../store/app'
import { track } from '../../lib/analytics'

/** ON-01 Splash: логотип и фраза. Вернувшегося человека через секунду ведём в Образ, новому показываем «Начать» без регистрации */
export function Splash() {
  const navigate = useNavigate()
  const { signedIn, onboarded } = useApp()
  const signIn = useApp((s) => s.signIn)
  const returning = signedIn && onboarded
  const [ready, setReady] = useState(returning)
  useEffect(() => {
    track('splash_view')
    const t = setTimeout(() => (returning ? navigate('/outfit', { replace: true }) : setReady(true)), returning ? 1000 : 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const start = () => {
    track('start_tap')
    if (!signedIn) signIn('', 'guest')
    navigate('/onboarding/quiz', { replace: true })
  }
  return (
    <div className="splash" role="main" onClick={returning ? () => navigate('/outfit', { replace: true }) : undefined}>
      <div className="splash__glow" />
      <div className="splash__body">
        <h1 className="wordmark" style={{ fontSize: 76, margin: 0 }}>Atelier</h1>
        <span className="t-headline" style={{ fontWeight: 600 }}>Новые образы из твоих вещей</span>
      </div>
      {!returning && (
        <div className="splash__cta" style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none' }}>
          <Button full onClick={start}>Начать</Button>
          <Button variant="text" full onClick={() => navigate('/login')}>У меня уже есть аккаунт</Button>
        </div>
      )}
    </div>
  )
}
