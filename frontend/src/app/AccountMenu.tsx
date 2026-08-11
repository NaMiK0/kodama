import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { useLogout, useMe } from '@/features/auth/hooks'
import { useTheme } from '@/shared/lib/ThemeProvider'
import { Avatar } from '@/shared/ui/Avatar'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 text-ink-subtle transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-4"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted outline-none transition-colors duration-150 hover:bg-surface-soft hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/25'

/**
 * Меню под аватаром — единственное место, где живёт всё, что касается
 * аккаунта (настройки, тема, выход). Навигацию по разделам приложения
 * сюда не дублируем, она в `Sidebar`.
 *
 * Без AnimatePresence: правило проекта — не оборачивать в неё поддерево
 * с await-цепочкой (тут внутри logout.mutate). Плавность — обычный CSS-
 * переход opacity/scale, как в `shared/ui/Modal.tsx`.
 */
export function AccountMenu() {
  const { data: user } = useMe()
  const logout = useLogout()
  const { isDark, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Меню аккаунта"
        className="inline-flex items-center gap-1.5 rounded-full p-1 outline-none transition-colors duration-150 hover:bg-surface-soft focus-visible:ring-4 focus-visible:ring-accent/25"
      >
        <Avatar id={user.avatar_id} size="sm" />
        <ChevronIcon open={open} />
      </button>

      {/* Смонтировано всегда, видимость через opacity/scale + inert —
          тот же приём, что в Modal, чтобы не открывать дверь AnimatePresence. */}
      <div
        role="menu"
        inert={!open}
        className={`absolute top-full right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-2 shadow-card transition-[opacity,transform] duration-150 ease-out ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="mb-1 flex items-center gap-3 border-b border-line px-2 pb-3">
          <Avatar id={user.avatar_id} size="md" />
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>

        <Link to="/settings" role="menuitem" onClick={() => setOpen(false)} className={MENU_ITEM_CLASS}>
          Настройки
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={MENU_ITEM_CLASS}
        >
          {/* Иконка результата, не текущего состояния — совпадает с подписью. */}
          {isDark ? <SunIcon /> : <MoonIcon />}
          {isDark ? 'Светлая' : 'Тёмная'}
        </button>

        <div className="my-1 border-t border-line" />

        <button
          type="button"
          role="menuitem"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className={`${MENU_ITEM_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Выйти
        </button>
      </div>
    </div>
  )
}
