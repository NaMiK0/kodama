import { AnimatePresence, motion } from 'motion/react'

import { useTheme } from '@/shared/lib/ThemeProvider'

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

/**
 * Переключатель светлой и тёмной темы.
 *
 * Намеренно без режима «как в системе»: иконкой его не объяснить, а на экране
 * входа лишние объяснения не нужны. Полный выбор из трёх режимов будет
 * в настройках профиля.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      // Подпись описывает ДЕЙСТВИЕ, а не текущее состояние: читалка объявит
      // «включить светлую тему», и будет понятно, что произойдёт по нажатию.
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className={`inline-flex size-9 items-center justify-center rounded-lg outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-accent/25 ${className}`}
    >
      {/* Показываем иконку РЕЗУЛЬТАТА, а не текущего состояния: кнопка — это
          действие, и её вид должен совпадать с подписью для читалки.
          mode="wait" — иконки сменяются по очереди, иначе на миг видно обе. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -35, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 35, scale: 0.8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-flex"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
