import { Logomark } from '@/shared/ui/Logomark'

import { EchoRipples } from './EchoRipples'

/**
 * Десктопная половина экрана входа: атмосфера рядом с делом.
 * На узких экранах не показывается — там лес становится фоном (см. AuthLayout).
 */
export function ForestPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-forest lg:flex lg:flex-col lg:justify-between lg:p-12">
      <EchoRipples />

      <div className="relative flex items-center gap-2 text-forest-ink/60">
        <Logomark className="size-5" />
        <p className="text-sm tracking-widest uppercase">Kodama</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <Logomark className="size-64" />
      </div>

      <div className="relative max-w-xs">
        <p className="text-lg text-forest-ink">Эхо слова, которое возвращается</p>
        <p className="mt-2 text-sm text-forest-ink/60">
          Английский и японский по расписанию интервальных повторений
        </p>
      </div>
    </aside>
  )
}
