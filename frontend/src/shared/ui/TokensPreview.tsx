import { motion } from 'motion/react'
import { useState } from 'react'

import type { CollectionEntry } from '@/features/decks/api'
import { TierDeckCard } from '@/features/decks/ui/TierDeckCard'
import { useTheme } from '@/shared/lib/ThemeProvider'
import type { Theme } from '@/shared/lib/theme'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

// Фейковые данные только для превью металлического покрытия коллекции —
// настоящий компонент, чтобы то, что видно здесь, совпадало с продакшеном.
const TIER_PREVIEW_ENTRIES: CollectionEntry[] = [
  {
    deck: {
      id: -1,
      topic: 'Разговорные фразы',
      language: 'en',
      level: 'A1',
      source: 'user_created',
      created_at: new Date().toISOString(),
      card_count: 12,
      folder_id: null,
    },
    tier: 'bronze',
    avg_ease_factor: 2.0,
  },
  {
    deck: {
      id: -2,
      topic: 'Деловая переписка',
      language: 'en',
      level: 'B2',
      source: 'user_created',
      created_at: new Date().toISOString(),
      card_count: 20,
      folder_id: null,
    },
    tier: 'silver',
    avg_ease_factor: 2.45,
  },
  {
    deck: {
      id: -3,
      topic: 'JLPT N3 · Кандзи',
      language: 'ja',
      level: 'N3',
      source: 'ai_generated',
      created_at: new Date().toISOString(),
      card_count: 30,
      folder_id: null,
    },
    tier: 'gold',
    avg_ease_factor: 2.8,
  },
]

const THEMES: Theme[] = ['light', 'dark', 'system']
const THEME_LABELS: Record<Theme, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Системная',
}

export function TokensPreview() {
  const { theme, setTheme } = useTheme()
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)

  function runFakeRequest() {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

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
            className="rounded-xl border border-line bg-surface p-5 shadow-card"
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
            className="rounded-xl border border-line bg-surface p-5 shadow-card"
          >
            <p className="text-xs tracking-wide text-accent-strong">B1 · IT-лексика</p>
            <p className="mt-2 text-4xl leading-tight">deploy</p>
            <p className="mt-1 text-sm text-ink-muted">развёртывать</p>
            <div className="mt-4 h-1 rounded-full bg-accent-soft">
              <div className="h-1 w-1/4 rounded-full bg-accent" />
            </div>
          </motion.article>
        </section>

        <section className="flex flex-col gap-4">
          <p className="text-sm text-ink-subtle">Поля и кнопки</p>

          <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-card">
            <TextField
              label="Email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="current-password"
              hint="Не короче 8 символов"
            />
            <TextField
              label="Поле с ошибкой"
              defaultValue="не-почта"
              error={showError ? 'Проверьте адрес: похоже, в нём опечатка' : undefined}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setShowError((v) => !v)} variant="secondary">
                {showError ? 'Убрать ошибку' : 'Показать ошибку'}
              </Button>
              <Button loading={loading} onClick={runFakeRequest}>
                Начать повторение
              </Button>
              <Button variant="ghost">Пропустить</Button>
              <Button disabled>Недоступно</Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <p className="text-sm text-ink-subtle">Коллекция — металлическое покрытие по тиру</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TIER_PREVIEW_ENTRIES.map((entry) => (
              <TierDeckCard key={entry.deck.id} entry={entry} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-sm text-ink-subtle">Размер японского текста</p>
          <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
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
