import { createContext, useContext, useState, type ReactNode } from 'react'

// Значения = то, что уже используют колоды/карточки на бэкенде (Language enum).
export type StudyLanguage = 'en' | 'ja'

const STORAGE_KEY = 'kodama-language'

type LanguageContextValue = {
  language: StudyLanguage
  setLanguage: (language: StudyLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getStoredLanguage(): StudyLanguage {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'ja' ? 'ja' : 'en'
}

/**
 * Изучаемый язык — тот же паттерн, что и ThemeProvider: контекст + localStorage.
 * У каждого языка свой прогресс (см. бриф), поэтому переключатель живёт
 * в каркасе приложения, а не на отдельных экранах.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<StudyLanguage>(getStoredLanguage)

  function setLanguage(next: StudyLanguage) {
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }

  return (
    <LanguageContext value={{ language, setLanguage }}>{children}</LanguageContext>
  )
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (value === null) throw new Error('useLanguage используется вне LanguageProvider')
  return value
}
