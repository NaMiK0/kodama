import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import {
  applyTheme,
  getStoredTheme,
  resolveIsDark,
  setTheme as persistTheme,
  watchSystemTheme,
  type Theme,
} from './theme'

type ThemeContextValue = {
  /** Что выбрал пользователь: 'light' | 'dark' | 'system' */
  theme: Theme
  /** Что получилось фактически — 'system' сам по себе ни о чём не говорит */
  isDark: boolean
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
  const [isDark, setIsDark] = useState(() => resolveIsDark(getStoredTheme()))

  useEffect(() => {
    const sync = () => {
      applyTheme(theme)
      setIsDark(resolveIsDark(theme))
    }
    sync()
    if (theme !== 'system') return

    // В режиме «как в системе» следим за её переключением на лету
    const unwatch = watchSystemTheme(sync)

    // Страховка: если системную тему сменили, пока вкладка была неактивна,
    // событие может не дойти — досогласуем состояние при возвращении.
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)

    return () => {
      unwatch()
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [theme])

  function setTheme(next: Theme) {
    persistTheme(next)
    setThemeState(next)
  }

  return <ThemeContext value={{ theme, isDark, setTheme }}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (value === null) throw new Error('useTheme используется вне ThemeProvider')
  return value
}
