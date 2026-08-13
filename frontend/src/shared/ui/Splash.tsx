import { motion, useReducedMotion } from 'motion/react'

import { Logomark } from './Logomark'

/**
 * Экран на время проверки сессии (запрос /auth/me).
 *
 * Вместо спиннера — «дыхание» самого знака: тот же приём, что у эха
 * на экране входа, только тише. Обычно виден доли секунды.
 */
export function Splash() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Logomark className="size-14" />
      </motion.div>
    </div>
  )
}
