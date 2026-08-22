import { motion, useReducedMotion } from 'motion/react'

const DELAYS = [0, 3, 6]

/**
 * Круги, расходящиеся как эхо — 木霊 значит «эхо».
 *
 * Один компонент на обе компоновки: на десктопе живёт внутри боковой панели,
 * на мобильном — фоном всего экрана.
 */
export function EchoRipples() {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <div
      aria-hidden
      // Без overflow-hidden: кольца обязаны выходить за пределы своего
      // контейнера (в ForestPanel это средняя полоса, а не вся панель),
      // а обрезает их предок — aside на десктопе, корень AuthLayout на мобильном.
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {DELAYS.map((delay) => (
        <motion.span
          key={delay}
          // в тёмной теме лес глубже, поэтому кольца там ярче — иначе пропадут
          className="absolute size-64 rounded-full border border-forest-ink/55 dark:border-forest-ink"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 2.6, opacity: [0, 0.16, 0] }}
          transition={{ duration: 9, delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
