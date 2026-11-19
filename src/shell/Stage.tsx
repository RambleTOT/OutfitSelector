import { AppShell } from './AppShell'
import { DemoPanel } from './DemoPanel'
import { DesktopAside } from './DesktopAside'
import { DEMO } from '../lib/config'
import { DeviceFrame } from './DeviceFrame'
import { useKeyboardViewport, useMedia, useRealNetwork, useTheme } from './hooks'
import './shell.css'

/** До 500 px приложение на весь экран; шире: рамка iPhone, а на десктопе ещё и панель демо */
export function Stage() {
  useTheme()
  useRealNetwork()
  const framed = useMedia('(min-width: 501px)')
  const withPanel = useMedia('(min-width: 900px)')
  useKeyboardViewport(!framed)

  if (!framed) return <div className="phone"><AppShell /></div>
  return (
    <div className="stage">
      <DeviceFrame><AppShell /></DeviceFrame>
      {withPanel && (DEMO ? <DemoPanel /> : <DesktopAside />)}
    </div>
  )
}
