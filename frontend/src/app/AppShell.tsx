import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useLogout, useMe } from '@/features/auth/hooks'
import { useLanguage, type StudyLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

const LANGUAGES: { value: StudyLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
]

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
      {LANGUAGES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          aria-pressed={language === value}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            language === value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/**
 * Каркас приложения: минималистичная верхняя панель, без вложенных меню.
 * Переключатель языка — здесь, а не на отдельных экранах: у каждого языка
 * свой прогресс (см. бриф), это выбор уровня всего приложения.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useMe()
  const logout = useLogout()

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between border-b border-line px-6 py-3">
        <Link to="/" className="font-jp text-xl text-ink select-none">
          木霊
        </Link>

        <LanguageSwitcher />

        <div className="flex items-center gap-3">
          <ThemeToggle className="text-ink-subtle hover:text-ink" />
          {user && (
            <Button
              variant="ghost"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Выйти
            </Button>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
