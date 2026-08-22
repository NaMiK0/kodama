import { Logomark } from '@/shared/ui/Logomark'

import { EchoRipples } from './EchoRipples'

/**
 * Десктопная половина экрана входа: атмосфера рядом с делом.
 * На узких экранах не показывается — там лес становится фоном (см. AuthLayout).
 */
export function ForestPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-forest lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="relative flex items-center gap-2 text-forest-ink/60">
        <Logomark className="size-5" />
        <p className="text-sm tracking-widest uppercase">Kodama</p>
      </div>

      {/* Кольца живут ЗДЕСЬ, а не на всей панели: эхо должно расходиться от
          самой фигурки, а раньше кольца центрировались по aside (центр 400px),
          а маскот — по этой средней полосе (центр 372px, шапка и подпись
          разной высоты). Два круга вокруг одного объекта с разными центрами
          читаются как перекос, хотя каждый по отдельности ровный. */}
      <div className="relative flex flex-1 items-center justify-center">
        <EchoRipples />
        <Logomark className="relative size-44" />
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
