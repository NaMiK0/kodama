import { motion, useReducedMotion } from 'motion/react'

import { Logomark } from '@/shared/ui/Logomark'

// Один цикл: слово держится ярким, затем медленно «забывается» (гаснет),
// и точно в момент, когда почти пропало — Kodama его показывает снова,
// вспышкой (карточка) + эхо-кольцом (Logomark) одновременно. Это дословно
// SM-2 (повтор ровно на грани забывания), без единого абзаца объяснения.
const CYCLE = 4.2
const TIMES = [0, 0.62, 0.66, 1]

const CARD_OPACITY = [1, 0.28, 1, 1]
const CARD_SCALE = [1, 0.98, 1.04, 1]
const RING_OPACITY = [0.12, 0.12, 0.85, 0.12]
const RING_SCALE = [0.85, 0.85, 1.05, 0.85]

/**
 * Живая мини-демонстрация SM-2 в hero-секции лендинга: слово «森» тускнеет
 * и вспыхивает обратно вместе с эхо-кольцом маскота. Переиспользует
 * Logomark — не отдельная декорация, а тот же смысловой знак, что и в
 * шапке/на логин-экране.
 */
export function EchoHeroDemo() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative flex h-72 items-center justify-center sm:h-80">
      <motion.div
        className="absolute"
        animate={reduceMotion ? undefined : { opacity: RING_OPACITY, scale: RING_SCALE }}
        initial={false}
        style={reduceMotion ? { opacity: 0.5 } : undefined}
        transition={
          reduceMotion
            ? undefined
            : { duration: CYCLE, times: TIMES, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <Logomark className="size-64 text-accent sm:size-72" />
      </motion.div>

      <motion.div
        className="relative flex w-52 flex-col items-center gap-1 rounded-2xl border border-line bg-surface px-6 py-8 text-center shadow-card"
        animate={reduceMotion ? undefined : { opacity: CARD_OPACITY, scale: CARD_SCALE }}
        initial={false}
        style={reduceMotion ? { opacity: 1 } : undefined}
        transition={
          reduceMotion
            ? undefined
            : { duration: CYCLE, times: TIMES, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <span className="font-jp text-4xl text-ink">森</span>
        <span className="text-sm text-ink-muted">もり</span>
        <span className="mt-2 text-sm text-ink-subtle">лес</span>
      </motion.div>
    </div>
  )
}
