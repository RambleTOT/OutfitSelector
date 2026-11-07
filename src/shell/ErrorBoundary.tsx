import { Component, type ReactNode } from 'react'
import { STORAGE_KEY } from '../store/app'

/** Если экран упал, показываем понятную страницу вместо белого экрана: перезагрузка или сброс локальных данных */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { console.error('Atelier crashed', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: 'var(--bg-base)', color: 'var(--ink-primary)' }}>
        <span className="t-serif" style={{ fontSize: 40 }}>Atelier</span>
        <h1 className="t-title2">Что-то пошло не так</h1>
        <p className="t-body muted" style={{ maxWidth: 300 }}>Попробуй обновить экран. Твои вещи и образы на месте</p>
        <button type="button" className="btn btn--primary" onClick={() => location.reload()}>Обновить</button>
        <button
          type="button" className="btn btn--text"
          onClick={() => { if (confirm('Сбросить данные на этом устройстве? Вещи и образы пропадут')) { try { localStorage.removeItem(STORAGE_KEY) } catch { /* нет доступа */ } location.reload() } }}
        >Сбросить данные</button>
      </div>
    )
  }
}
