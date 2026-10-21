import { AppShell } from './AppShell'
import { DemoPanel } from './DemoPanel'
import { DeviceFrame } from './DeviceFrame'
import { useMedia, useTheme } from './hooks'
import './shell.css'

/** До 500 px приложение на весь экран; шире: рамка iPhone, а на десктопе ещё и панель демо */
export function Stage() {
  useTheme()
  const framed = useMedia('(min-width: 501px)')
  const withPanel = useMedia('(min-width: 900px)')

  if (!framed) return <div className="phone"><AppShell /></div>
  return (
    <div className="stage">
      <DeviceFrame><AppShell /></DeviceFrame>
      {withPanel && <DemoPanel />}
    </div>
  )
}
