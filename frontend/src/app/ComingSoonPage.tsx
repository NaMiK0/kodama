import { useNavigate, useParams } from 'react-router'

import { Button } from '@/shared/ui/Button'

import { COMING_SOON_COPY, isComingSoonSection } from './navigation'

/**
 * Тонкая ветка с почкой, прорисовывающаяся один раз через
 * stroke-dasharray/-dashoffset (см. `.branch-draw`/`.branch-bud` в
 * index.css) — единственная анимация на странице, дальше всё статично.
 */
function GrowingBranch() {
  return (
    <svg
      viewBox="0 0 240 120"
      className="h-24 w-60 text-accent"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 100C50 100 60 40 110 40C150 40 150 70 190 60C205 56 215 40 226 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        className="branch-draw"
      />
      <path
        d="M112 39c-5-10 1-21 12-23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        className="branch-draw"
      />
      <circle cx="226" cy="24" r="4" fill="currentColor" className="branch-bud" />
    </svg>
  )
}

/**
 * Страница-заглушка для разделов, которые ещё не начаты (`Библиотека`,
 * `Статистика`, `Произношение`). Не «в разработке» и не 🚧 — метафора из
 * названия 木霊: ветка, которая ещё растёт. Текст и заголовок берутся из
 * `COMING_SOON_COPY`, того же места, что и подпись пункта в сайдбаре —
 * они не могут разъехаться, потому что это один объект.
 *
 * Неизвестная секция (мимо трёх известных) не падает — просто нейтральный
 * заголовок вместо конкретного обещания.
 */
export function ComingSoonPage() {
  const { section } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const copy = section && isComingSoonSection(section) ? COMING_SOON_COPY[section] : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <GrowingBranch />

      <div>
        <h1 className="text-xl font-medium text-ink">{copy?.title ?? 'Раздел'}</h1>
        <p className="mt-1 text-sm text-ink-subtle">Раздел ещё растёт</p>
      </div>

      <p className="text-ink-muted">
        {copy?.promise ?? 'Этот раздел появится в одном из следующих обновлений.'}
      </p>

      <Button variant="secondary" onClick={() => navigate('/')}>
        ← К колодам
      </Button>
    </div>
  )
}
