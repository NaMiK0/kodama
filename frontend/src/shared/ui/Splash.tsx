import { motion, useReducedMotion } from 'motion/react'

/**
 * Экран на время проверки сессии (запрос /auth/me).
 *
 * Вместо спиннера — «дыхание» самого 木霊: тот же приём, что у эха
 * на экране входа, только тише. Обычно виден доли секунды.
 */
export function Splash() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <motion.p
        className="font-jp text-4xl text-ink-subtle select-none"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        木霊
      </motion.p>
    </div>
  )
}
