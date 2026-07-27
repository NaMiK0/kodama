import { EchoRipples } from './EchoRipples'

/**
 * Десктопная половина экрана входа: атмосфера рядом с делом.
 * На узких экранах не показывается — там лес становится фоном (см. AuthLayout).
 */
export function ForestPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-forest lg:flex lg:flex-col lg:justify-between lg:p-12">
      <EchoRipples />

      <p className="relative text-sm tracking-widest text-forest-ink/60 uppercase">Kodama</p>

      <div className="relative flex flex-1 items-center justify-center">
        <p
          className="font-jp text-forest-ink/90 select-none"
          style={{ writingMode: 'vertical-rl', fontSize: '5.5rem', letterSpacing: '0.15em' }}
        >
          木霊
        </p>
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
