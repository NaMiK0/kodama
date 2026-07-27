import { motion } from 'motion/react'

import { useTheme } from '@/shared/lib/useTheme'
import type { Theme } from '@/shared/lib/theme'

const THEMES: Theme[] = ['light', 'dark', 'system']
const THEME_LABELS: Record<Theme, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Системная',
}

export function TokensPreview() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium">Kodama</h1>
            <p className="text-sm text-ink-muted">Палитра и типографика</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
            {THEMES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  theme === value
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {THEME_LABELS[value]}
              </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <p className="text-xs tracking-wide text-accent-strong">N5 · животные</p>
            <p className="mt-2 font-jp text-4xl leading-tight">ねこ</p>
            <p className="mt-1 text-sm text-ink-muted">кошка</p>
            <div className="mt-4 h-1 rounded-full bg-accent-soft">
              <div className="h-1 w-3/5 rounded-full bg-accent" />
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <p className="text-xs tracking-wide text-accent-strong">B1 · IT-лексика</p>
            <p className="mt-2 text-4xl leading-tight">deploy</p>
            <p className="mt-1 text-sm text-ink-muted">развёртывать</p>
            <div className="mt-4 h-1 rounded-full bg-accent-soft">
              <div className="h-1 w-1/4 rounded-full bg-accent" />
            </div>
          </motion.article>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-sm text-ink-subtle">Кнопки</p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-ink transition-colors hover:bg-accent-strong">
              Начать повторение
            </button>
            <button className="rounded-lg border border-line bg-surface px-4 py-2 text-sm transition-colors hover:bg-surface-soft">
              Пропустить произношение
            </button>
            <button className="rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger">
              Не помню
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-sm text-ink-subtle">Размер японского текста</p>
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-base">
              Одинаковый кегль: <span className="font-jp">ねこ／犬／コーヒー</span> vs deploy
            </p>
            <p className="mt-3 text-base">
              Японский крупнее на ступень:{' '}
              <span className="font-jp text-lg">ねこ／犬／コーヒー</span> vs deploy
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
