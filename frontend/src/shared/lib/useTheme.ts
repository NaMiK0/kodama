import { useEffect, useState } from 'react'

import {
  applyTheme,
  getStoredTheme,
  setTheme as persistTheme,
  watchSystemTheme,
  type Theme,
} from './theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    // Пока выбран режим «как в системе», следим за её переключением
    return watchSystemTheme(() => applyTheme('system'))
  }, [theme])

  function setTheme(next: Theme) {
    persistTheme(next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
