import { useEffect } from 'react'
import { NavLink } from 'react-router'

import { NAV_ITEMS, NAV_ITEMS_COMING_SOON, type NavItem } from './navigation'

type SidebarLinkProps = {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}

function SidebarLink({ item, collapsed, onNavigate }: SidebarLinkProps) {
  const { Icon } = item

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      title={item.label}
      aria-label={item.label}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-accent/25 ${
          collapsed ? 'justify-center' : ''
        } ${isActive ? 'bg-surface-soft text-ink' : 'text-ink-muted hover:text-ink'}`
      }
    >
      <span className="relative inline-flex shrink-0">
        <Icon />
        {/* В свёрнутом рельсе подписи «скоро» нет места — точка на иконке
            всё равно предупреждает, что клик приведёт на страницу-заглушку. */}
        {item.comingSoon && collapsed && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-accent"
          />
        )}
      </span>
      {!collapsed && (
        <span className="flex flex-1 items-center justify-between gap-2 truncate">
          {item.label}
          {item.comingSoon && (
            <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[10px] text-ink-subtle">
              скоро
            </span>
          )}
        </span>
      )}
    </NavLink>
  )
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {NAV_ITEMS.map((item) => (
        <SidebarLink key={item.key} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}

      <div className="my-2 border-t border-line" />

      {NAV_ITEMS_COMING_SOON.map((item) => (
        <SidebarLink key={item.key} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}

type SidebarProps = {
  /** Состояние десктопного рельса — свёрнут (иконки) или развёрнут (с подписями). */
  collapsed: boolean
  /** Открыта ли мобильная шторка. На мобильном сайдбар вне потока. */
  mobileOpen: boolean
  onCloseMobile: () => void
}

/**
 * Два независимых рендера одного и того же списка пунктов:
 * десктопный рельс — часть потока (участвует в ширине), меняет ширину
 * плавным transition; мобильная шторка — position:fixed поверх контента,
 * не занимает места в потоке (по требованию), с затемняющей подложкой.
 */
export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      {/* lg, не md: на md (768, típичный планшет-портрет) постоянному рельсу
          уже не хватает места — см. MOBILE_BREAKPOINT в AppShell.tsx. */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-line bg-canvas transition-[width] duration-200 ease-out lg:flex lg:flex-col ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarNav collapsed={collapsed} />
      </aside>

      {/* Мобильная шторка: держим смонтированной всегда (как Modal), inert
          и pointer-events отключают её, пока закрыта, вместо условного рендера.
          Подложка темнее, чем обычно (70%, не 50) и не завязана на surface —
          на тёмной теме canvas и без того почти чёрный, и bg-black/50 на нём
          сливался в ничто; чистый чёрный поверх тёмного canvas всё равно даёт
          заметный перепад, потому что абсолютная яркость и так низкая. */}
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden dark:bg-black/70 ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-surface shadow-card transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarNav collapsed={false} onNavigate={onCloseMobile} />
      </aside>
    </>
  )
}
