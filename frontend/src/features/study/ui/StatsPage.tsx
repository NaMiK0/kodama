import type { HardestCard, StudyStats } from '@/features/study/api'
import { useStudyStats } from '@/features/study/hooks'
import { useLanguage } from '@/shared/lib/LanguageProvider'

import { UpcomingLoadChart } from './UpcomingLoadChart'

const LANGUAGE_NAMES = { en: 'английскому', ja: 'японскому' } as const

const DIRECTION_LABELS = {
  to_russian: 'узнавание',
  to_target: 'воспроизведение',
} as const

// Границы шкалы ease_factor на бэкенде: MIN_EASE_FACTOR (дно, самое тяжёлое
// слово) и стартовое значение новой карточки (самое лёгкое из возможных
// в этом списке — список и так только про тяжёлые слова).
const MIN_EASE_FACTOR = 1.3
const START_EASE_FACTOR = 2.5

function easeFactorPercent(easeFactor: number): number {
  const ratio = (easeFactor - MIN_EASE_FACTOR) / (START_EASE_FACTOR - MIN_EASE_FACTOR)
  return Math.min(100, Math.max(0, ratio * 100))
}

function InProgressTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface-soft px-4 py-3 text-center">
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-subtle">{label}</p>
    </div>
  )
}

function InProgressSummary({ stats }: { stats: StudyStats }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-medium text-ink-muted">Слов в обороте</h2>
      <p className="mb-6 text-4xl font-semibold text-ink tabular-nums">{stats.in_progress}</p>
      <div className="grid grid-cols-3 gap-3">
        <InProgressTile label="Новые" value={stats.learning} />
        <InProgressTile label="В процессе" value={stats.young} />
        <InProgressTile label="Зрелые" value={stats.mature} />
      </div>
    </section>
  )
}

function HardestRow({ item }: { item: HardestCard }) {
  const pct = easeFactorPercent(item.ease_factor)

  return (
    <li className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-ink">{item.word}</span>
          <span className="truncate text-sm text-ink-muted">{item.translation}</span>
        </div>
        <span className="text-xs text-ink-subtle">{DIRECTION_LABELS[item.direction]}</span>
      </div>
      <div className="flex w-36 shrink-0 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-9 text-right text-xs text-ink-muted tabular-nums">
          {item.ease_factor.toFixed(2)}
        </span>
      </div>
    </li>
  )
}

function HardestList({ items }: { items: HardestCard[] }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-medium text-ink-muted">Даётся тяжело</h2>
      {items.length > 0 ? (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <HardestRow key={`${item.card_id}-${item.direction}`} item={item} />
          ))}
        </ul>
      ) : (
        <div className="py-6 text-center">
          <p className="text-ink-muted">Пока ничего не даётся тяжело</p>
          <p className="mt-1 text-sm text-ink-subtle">
            Слова появляются здесь после ошибок — чем чаще путаетесь, тем выше в списке
          </p>
        </div>
      )}
    </section>
  )
}

function UpcomingLoadSection({ stats }: { stats: StudyStats }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-medium text-ink-muted">Нагрузка на 14 дней</h2>
      <UpcomingLoadChart upcoming={stats.upcoming} />
    </section>
  )
}

/** Экран статистики: три блока, из которых график только один (нагрузка по
 * дням) — остальное точнее читается числами и рангами, чем диаграммами. */
export function StatsPage() {
  const { language } = useLanguage()
  const { data: stats, isPending } = useStudyStats(language)

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-xl font-medium text-ink">Статистика</h1>

      {isPending ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : !stats || stats.in_progress === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <p className="font-jp text-3xl text-ink-subtle select-none">木霊</p>
          <p className="text-ink-muted">
            По {LANGUAGE_NAMES[language]} пока нечего показывать — начните учить слова, и здесь
            появится картина прогресса
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <InProgressSummary stats={stats} />
          <HardestList items={stats.hardest} />
          <UpcomingLoadSection stats={stats} />
        </div>
      )}
    </div>
  )
}
