import { useEffect } from 'react'
import { AppShell } from './AppShell'
import { DemoPanel } from './DemoPanel'
import { DeviceFrame } from './DeviceFrame'
import { useMedia, useTheme } from './hooks'
import { useApp } from '../store/app'
import './shell.css'

/** До 500 px приложение на весь экран; шире: рамка iPhone, а на десктопе ещё и панель демо */
export function Stage() {
  useTheme()
  const framed = useMedia('(min-width: 501px)')
  const withPanel = useMedia('(min-width: 900px)')
  const onboarded = useApp((s) => s.onboarded)
  const skipOnboarding = useApp((s) => s.skipOnboarding)
  // P1: онбординга ещё нет, поэтому сразу подставляем демо-гардероб. Заменится в P4
  useEffect(() => { if (!onboarded) skipOnboarding() }, [onboarded, skipOnboarding])

  if (!framed) return <div className="phone"><AppShell /></div>
  return (
    <div className="stage">
      <DeviceFrame><AppShell /></DeviceFrame>
      {withPanel && <DemoPanel />}
    </div>
  )
}
