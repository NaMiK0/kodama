import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type DemoCard = { front: string; reading?: string; back: string }
type DemoDeck = { topic: string; language: 'en' | 'ja'; level: string; cards: DemoCard[] }

// Темы — те же, что названы в тексте секции рядом («IT-лексика», «еда и
// напитки»): демо показывает ровно то, что обещает абзац, а не абстракцию.
const DECKS: DemoDeck[] = [
  {
    topic: 'Еда и напитки',
    language: 'ja',
    level: 'N5',
    cards: [
      { front: '寿司', reading: 'すし', back: 'суши' },
      { front: 'お茶', reading: 'おちゃ', back: 'чай' },
      { front: '水', reading: 'みず', back: 'вода' },
    ],
  },
  {
    topic: 'IT-лексика',
    language: 'en',
    level: 'B1',
    cards: [
      { front: 'deploy', back: 'развернуть' },
      { front: 'branch', back: 'ветка' },
      { front: 'bug', back: 'ошибка' },
    ],
  },
  {
    topic: 'Путешествия',
    language: 'en',
    level: 'A2',
    cards: [
      { front: 'luggage', back: 'багаж' },
      { front: 'departure', back: 'вылет' },
      { front: 'ticket', back: 'билет' },
    ],
  },
]

// Один цикл = по слоту на каждую колоду. Внутри слота (локальное время 0..1):
// появилась тема → полоса «генерации» заполнилась → карточки легли одна за
// другой → подержались → всё погасло, следующая тема. Как и у EchoHeroDemo —
// только keyframe-массивы на общем цикле, без таймеров и состояния.
const SLOT = 4.5
const CYCLE = SLOT * DECKS.length
const FADE = 0.04

const DECK_FROM = 0.02
const DECK_TO = 0.94
const BAR_FILL = [0.06, 0.34] as const
const BAR_TO = 0.44
const CARD_FROM = 0.34
const CARD_STAGGER = 0.09

const OPACITY = [0, 0, 1, 1, 0, 0]
const RISE = [8, 8, 0, 0, 0, 0]

/** Локальное время внутри слота колоды → доля всего цикла (для `times`). */
const at = (slot: number, t: number) => (slot + t) / DECKS.length

type AppearProps = {
  slot: number
  from: number
  to: number
  /** Карточки ещё и приподнимаются при появлении, текст шапки — только проявляется. */
  rise?: boolean
  className?: string
  children: ReactNode
}

/** Видим только в окне [from, to] своего слота, остальной цикл — прозрачен. */
function Appear({ slot, from, to, rise = false, className, children }: AppearProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  const times = [0, at(slot, from), at(slot, from + FADE), at(slot, to - FADE), at(slot, to), 1]

  return (
    <motion.div
      className={className}
      initial={false}
      animate={rise ? { opacity: OPACITY, y: RISE } : { opacity: OPACITY }}
      transition={{ duration: CYCLE, times, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Живая мини-демонстрация ИИ-генерации для секции фичи на лендинге: тема →
 * полоса генерации → карточки ложатся одна за другой, и так по кругу для
 * трёх тем. Шапка — та же, что у настоящей плитки колоды (DeckCard): метка
 * «✦ ИИ» в сиреневом ai-цвете и чип «язык · уровень» — гость видит реальный
 * вид результата, а не отдельную маркетинговую декорацию.
 *
 * Слои всех трёх колод лежат друг на друге в одной ячейке grid
 * ([grid-area:1/1]) — контейнер берёт размер самого большого слоя и не
 * прыгает по высоте при смене темы.
 *
 * aria-hidden: скринридер прочитал бы все три колоды разом (слои невидимы
 * только визуально) — смысл уже передан текстом секции рядом.
 */
export function AiGenerationDemo() {
  const reduceMotion = useReducedMotion()
  // Без анимации — одна колода в финальном состоянии, а не три слоя внахлёст.
  const decks = reduceMotion ? DECKS.slice(0, 1) : DECKS

  return (
    <div aria-hidden className="w-full max-w-sm">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <div className="grid">
            {decks.map((deck, slot) => (
              <Appear
                key={deck.topic}
                slot={slot}
                from={DECK_FROM}
                to={DECK_TO}
                className="[grid-area:1/1]"
              >
                <p className="font-medium text-ink">{deck.topic}</p>
                <span className="mt-2 inline-block rounded-md bg-surface-soft px-2 py-0.5 text-xs tracking-wide text-ink-muted uppercase">
                  {deck.language} · {deck.level}
                </span>
              </Appear>
            ))}
          </div>
          <span className="shrink-0 rounded-md bg-ai-soft px-2 py-0.5 text-xs text-ai">✦ ИИ</span>
        </div>

        {!reduceMotion && (
          <div className="mt-4 grid h-1 overflow-hidden rounded-full bg-surface-soft">
            {decks.map((deck, slot) => (
              <Appear
                key={deck.topic}
                slot={slot}
                from={DECK_FROM}
                to={BAR_TO}
                className="[grid-area:1/1]"
              >
                <motion.div
                  className="h-full origin-left bg-ai"
                  initial={false}
                  animate={{ scaleX: [0, 0, 1, 1] }}
                  transition={{
                    duration: CYCLE,
                    times: [0, at(slot, BAR_FILL[0]), at(slot, BAR_FILL[1]), 1],
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </Appear>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 grid">
        {decks.map((deck, slot) => (
          <div key={deck.topic} className="flex flex-col gap-2 [grid-area:1/1]">
            {deck.cards.map((card, index) => (
              <Appear
                key={card.front}
                slot={slot}
                from={CARD_FROM + index * CARD_STAGGER}
                to={DECK_TO}
                rise
                className="flex items-baseline justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-card"
              >
                <span className="text-ink">
                  {card.reading ? (
                    <>
                      <span className="font-jp">{card.front}</span>
                      <span className="ml-2 font-jp text-xs text-ink-subtle">{card.reading}</span>
                    </>
                  ) : (
                    card.front
                  )}
                </span>
                <span className="text-sm text-ink-muted">{card.back}</span>
              </Appear>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
