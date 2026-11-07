import { HashRouter } from 'react-router-dom'
import { ErrorBoundary } from './shell/ErrorBoundary'
import { Stage } from './shell/Stage'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Stage />
      </HashRouter>
    </ErrorBoundary>
  )
}
