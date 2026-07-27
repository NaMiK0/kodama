import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// Без границы ошибок необработанное исключение при рендере снимает всё
// дерево React, оставляя пустую страницу без единого сообщения в консоли —
// именно так и было до её добавления.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary поймал:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-canvas p-6 text-center">
          <p className="text-lg text-danger">Что-то сломалось</p>
          <pre className="max-w-lg overflow-auto text-left text-xs text-ink-muted">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
