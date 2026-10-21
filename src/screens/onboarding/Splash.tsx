import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/app'

/** ON-01 Splash: логотип и фраза, не дольше секунды */
export function Splash() {
  const navigate = useNavigate()
  const { signedIn, onboarded } = useApp()
  const go = () => navigate(signedIn && onboarded ? '/outfit' : '/login', { replace: true })
  useEffect(() => {
    const t = setTimeout(go, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="splash" onClick={go} role="presentation">
      <div className="splash__glow" />
      <div className="splash__body">
        <span className="wordmark" style={{ fontSize: 76 }}>Atelier</span>
        <span className="t-headline" style={{ fontWeight: 600 }}>Новые образы из твоих вещей</span>
      </div>
    </div>
  )
}
