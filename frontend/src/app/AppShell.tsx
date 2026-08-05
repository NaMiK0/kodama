import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useLogout, useMe } from '@/features/auth/hooks'
import { useLanguage, type StudyLanguage } from '@/shared/lib/LanguageProvider'
import { ServerEventsProvider } from '@/shared/lib/ServerEventsProvider'
import { Button } from '@/shared/ui/Button'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

const LANGUAGES: { value: StudyLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
]

function CollectionLink() {
  return (
    <Link
      to="/collection"
      aria-label="Коллекция"
      title="Коллекция"
      className="inline-flex size-9 items-center justify-center rounded-lg text-ink-subtle outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/25"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
      </svg>
    </Link>
  )
}

function SettingsLink() {
  return (
    <Link
      to="/settings"
      aria-label="Настройки"
      title="Настройки"
      className="inline-flex size-9 items-center justify-center rounded-lg text-ink-subtle outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/25"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </Link>
  )
}

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
    // WS нужен только авторизованному контуру — соединение живёт здесь,
    // а не в App.tsx, где ещё нет сессии.
    <ServerEventsProvider>
      {/* Колонка с растущим main: страницы вроде разбора колоды могут занять
          всю высоту под шапкой (там подсветка краёв экрана должна доходить
          до низа, а не обрываться по высоте содержимого). */}
      <div className="flex min-h-dvh flex-col bg-canvas">
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <Link to="/" className="font-jp text-xl text-ink select-none">
            木霊
          </Link>

          <LanguageSwitcher />

          <div className="flex items-center gap-3">
            {user && <CollectionLink />}
            {user && <SettingsLink />}
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

        {/* flex-колонка, а не просто flex-1: страница-ребёнок растягивается
            через flex-1 у себя, без процентных высот (они требуют, чтобы у
            родителя высота была определена, и легко ломаются). Страницы без
            flex-1 занимают высоту по содержимому — как и раньше.
            Из-за этого же flex-col у каждой страницы, центрирующей себя
            через mx-auto, обязателен w-full: без явной ширины flex-item с
            auto-полями сжимается по содержимому, а не растягивается на всю
            ширину (auto-margins подавляют stretch по спеке flexbox). */}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </ServerEventsProvider>
  )
}
