import type { ReactNode } from 'react'
import { Icon } from '../ui'
import { useApp } from '../store/app'
import { useFrameScale } from './hooks'

/** Рамка iPhone 390 × 844 (экран) на десктопе */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const scale = useFrameScale()
  const offline = useApp((s) => s.offline)
  return (
    <div className="frame-slot" style={{ width: 414 * scale, height: 868 * scale }}>
      <div className="frame" style={{ transform: `scale(${scale})` }}>
        <div className="frame__screen">
          {children}
          <div className="frame__status" aria-hidden="true">
            <span>9:41</span>
            <span className="frame__status-r">
              
              <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
              {offline ? <Icon name="wifi-slash" size={16} /> : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M3.9 6.9a6 6 0 0 1 8.2 0M6.3 9.5a2.6 2.6 0 0 1 3.4 0" /></svg>
              )}
              <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor" /><rect x="24" y="4.2" width="2" height="4.6" rx="1" fill="currentColor" opacity="0.4" /></svg>
            </span>
          </div>
          <div className="frame__island" aria-hidden="true" />
          <div className="frame__home" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
