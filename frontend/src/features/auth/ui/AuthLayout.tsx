import type { ReactNode } from 'react'

import { Logomark } from '@/shared/ui/Logomark'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

import { EchoRipples } from './EchoRipples'
import { ForestPanel } from './ForestPanel'

/**
 * Одна личность, две компоновки:
 *   десктоп  — лес РЯДОМ с делом (боковая панель + форма на светлом),
 *   мобильный — лес ВОКРУГ дела (фон на весь экран, карточка парит).
 *
 * Прятать атмосферу на телефоне нельзя: получилось бы два разных продукта.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-forest lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:bg-canvas">
      {/* Мобильный фон: те же кольца, но за всем экраном */}
      <div className="lg:hidden">
        <EchoRipples />
      </div>

      <ForestPanel />

      {/* Служебная зона в углу: карточка остаётся чистой.
          На мобильном кнопка лежит на лесу, на десктопе — на светлом фоне,
          поэтому цвет разный. */}
      <ThemeToggle className="absolute top-4 right-4 z-10 text-forest-ink/60 hover:text-forest-ink lg:text-ink-subtle lg:hover:text-ink" />

      <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12 lg:min-h-0 lg:gap-0">
        <header className="flex flex-col items-center gap-3 text-center lg:hidden">
          <Logomark className="size-20" />
          <p className="text-xs tracking-[0.3em] text-forest-ink/50 uppercase">Kodama</p>
        </header>

        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
