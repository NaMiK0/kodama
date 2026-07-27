import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import {
  applyTheme,
  getStoredTheme,
  setTheme as persistTheme,
  watchSystemTheme,
  type Theme,
} from './theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Тема — свойство приложения, а не отдельной страницы.
 * Провайдер стоит над роутером, поэтому работает на любом маршруте
 * и переживает перезагрузку (первичный класс ставит скрипт в index.html).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return

    // В режиме «как в системе» следим за её переключением на лету
    const reapply = () => applyTheme('system')
    const unwatch = watchSystemTheme(reapply)

    // Страховка: если системную тему сменили, пока вкладка была неактивна,
    // событие может не дойти — досогласуем состояние при возвращении.
    document.addEventListener('visibilitychange', reapply)
    window.addEventListener('focus', reapply)

    return () => {
      unwatch()
      document.removeEventListener('visibilitychange', reapply)
      window.removeEventListener('focus', reapply)
    }
  }, [theme])

  function setTheme(next: Theme) {
    persistTheme(next)
    setThemeState(next)
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (value === null) throw new Error('useTheme используется вне ThemeProvider')
  return value
}
