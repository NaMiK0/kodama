import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import { queryClient } from '@/shared/api/queryClient'
import { ThemeProvider } from '@/shared/lib/ThemeProvider'

import { ErrorBoundary } from './ErrorBoundary'
import { AppRouter } from './router'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
