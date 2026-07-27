import type { ReactNode } from 'react'

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
    <div className="relative min-h-dvh bg-forest lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:bg-canvas">
      {/* Мобильный фон: те же кольца, но за всем экраном */}
      <div className="lg:hidden">
        <EchoRipples />
      </div>

      <ForestPanel />

      <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12 lg:min-h-0 lg:gap-0">
        <header className="text-center lg:hidden">
          <p className="font-jp text-5xl text-forest-ink/90 select-none">木霊</p>
          <p className="mt-3 text-xs tracking-[0.3em] text-forest-ink/50 uppercase">Kodama</p>
        </header>

        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
