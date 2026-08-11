import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { useLanguage, type StudyLanguage } from '@/shared/lib/LanguageProvider'
import { ServerEventsProvider } from '@/shared/lib/ServerEventsProvider'

import { AccountMenu } from './AccountMenu'
import { Sidebar } from './Sidebar'

const LANGUAGES: { value: StudyLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
]

const SIDEBAR_STORAGE_KEY = 'kodama:sidebar'
// Совпадает с брейкпоинтом `md` в Tailwind — ниже него рельс уступает место
// мобильной шторке (см. Sidebar).
const MOBILE_BREAKPOINT = 768

function getStoredCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
}

function BurgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-5"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
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
 * Каркас приложения: шапка на всю ширину (бургер, логотип, язык, аккаунт) +
 * сайдбар слева + контент. Навигация по разделам живёт в сайдбаре, всё
 * про аккаунт (настройки, тема, выход) — под аватаром (см. AccountMenu).
 */
export function AppShell({ children }: { children: ReactNode }) {
  // Десктопный рельс — персистентное состояние (localStorage), мобильная
  // шторка — временное, по умолчанию закрыта, ничего не сохраняем.
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  function handleBurgerClick() {
    // Один бургер, два разных действия: на десктопе рельс — часть layout'а
    // (сворачивает/разворачивает ширину), на мобильном — независимая шторка
    // поверх контента. Разница только в том, что происходит в потоке.
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setMobileOpen((value) => !value)
    } else {
      setCollapsed((value) => !value)
    }
  }

  return (
    // WS нужен только авторизованному контуру — соединение живёт здесь,
    // а не в App.tsx, где ещё нет сессии.
    <ServerEventsProvider>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBurgerClick}
              aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
              title="Меню"
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-subtle outline-none transition-colors duration-150 hover:bg-surface-soft hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/25"
            >
              <BurgerIcon />
            </button>
            <Link to="/" className="font-jp text-xl text-ink select-none">
              木霊
            </Link>
          </div>

          <LanguageSwitcher />

          <AccountMenu />
        </header>

        {/* Строка ниже шапки: рельс + main. main остаётся flex-колонкой, а не
            просто flex-1: страница-ребёнок (например, разбор колоды)
            растягивается через flex-1 у себя, без процентных высот. Из-за
            этого же flex-col у каждой страницы, центрирующей себя через
            mx-auto, обязателен w-full — иначе auto-margins сжимают элемент
            по содержимому вместо растяжения на всю ширину. */}
        <div className="flex flex-1">
          <Sidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </div>
    </ServerEventsProvider>
  )
}
