export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'kodama-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function resolveIsDark(theme: Theme): boolean {
  if (theme === 'system') return window.matchMedia(DARK_QUERY).matches
  return theme === 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

export function setTheme(theme: Theme): void {
  // 'system' не храним: отсутствие записи и означает «как в системе»
  if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

/** Подписка на смену системной темы — нужна, пока выбран режим 'system'. */
export function watchSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
