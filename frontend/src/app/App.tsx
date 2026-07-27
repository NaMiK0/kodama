import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import { queryClient } from '@/shared/api/queryClient'
import { LanguageProvider } from '@/shared/lib/LanguageProvider'
import { ThemeProvider } from '@/shared/lib/ThemeProvider'

import { ErrorBoundary } from './ErrorBoundary'
import { AppRouter } from './router'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
