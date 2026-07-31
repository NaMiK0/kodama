import { motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import type { Card } from '@/features/cards/api'
import { useDeck } from '@/features/decks/hooks'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

import { fetchUnseenCards } from '../api'
import { NEW_CARDS_LIMIT, useCheckAnswer, useMarkKnown, useSubmitReview } from '../hooks'
import { SWIPE_THRESHOLD, SwipeCard, type SwipeCardHandle } from './SwipeCard'

type Phase = 'loading' | 'empty' | 'triage' | 'learning' | 'summary'

// Единица очереди заучивания: считаем попытки, чтобы решить, когда слово
// выпускается в расписание, и сколько раз оно спотыкалось (влияет на
// стартовую оценку — см. learning_mistakes в /study/review).
type LearningEntry = { card: Card; correctCount: number; mistakeCount: number }

const GRADUATION_THRESHOLD = 2

// Подписи приглушены в покое, но не спрятаны: они и есть подсказка механики.
const RESTING_LABEL_OPACITY = 0.35

export function TriagePage() {
  const { deckId } = useParams<{ deckId: string }>()
  const id = Number(deckId)
  const navigate = useNavigate()

  const { data: deck } = useDeck(id)

  const [phase, setPhase] = useState<Phase>('loading')

  // Смещение карточки живёт здесь, а не в SwipeCard: по нему подсвечиваются
  // края экрана и подписи, а они лежат СНАРУЖИ перетаскиваемого элемента.
  const x = useMotionValue(0)
  const unknownGlow = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const knownGlow = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const unknownLabel = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, RESTING_LABEL_OPACITY])
  const knownLabel = useTransform(x, [0, SWIPE_THRESHOLD], [RESTING_LABEL_OPACITY, 1])

  // Разбор
  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const unknownRef = useRef<Card[]>([])
  const cardHandleRef = useRef<SwipeCardHandle>(null)
  const [deciding, setDeciding] = useState(false)

  const markKnown = useMarkKnown()

  // Заучивание. `active` — карточка текущего раунда, отдельно от очереди
  // ожидающих: при выпуске последней карточки очередь опустошается СРАЗУ
  // (в submit), а вердикт должен ещё отрисоваться для той же карточки —
  // поэтому дисплей не читает queue[0] напрямую.
  const [learningQueue, setLearningQueue] = useState<LearningEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<LearningEntry | null>(null)
  const [learningPhase, setLearningPhase] = useState<'question' | 'verdict'>('question')
  const [learningAnswer, setLearningAnswer] = useState('')
  const [learningVerdict, setLearningVerdict] = useState<{ correct: boolean; expected: string[] } | null>(
    null,
  )
  const [graduatedCount, setGraduatedCount] = useState(0)
  const deferredCountRef = useRef(0)

  const checkAnswer = useCheckAnswer()
  const submitReview = useSubmitReview()

  useEffect(() => {
    let cancelled = false
    fetchUnseenCards(id).then((cards) => {
      if (cancelled) return
      setQueue(cards)
      setPhase(cards.length > 0 ? 'triage' : 'empty')
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const currentCard = queue[index]

  async function handleDecide(direction: 'known' | 'unknown') {
    if (deciding || !currentCard) return
    setDeciding(true)

    await cardHandleRef.current?.decide(direction)

    if (direction === 'known') {
      setKnownCount((prev) => prev + 1)
      void markKnown.mutateAsync(currentCard.id)
    } else {
      unknownRef.current = [...unknownRef.current, currentCard]
    }

    const nextIndex = index + 1
    setFlipped(false)
    setDeciding(false)

    if (nextIndex >= queue.length) {
      startLearningOrSummary()
    } else {
      setIndex(nextIndex)
    }
  }

  function startLearningOrSummary() {
    const unknown = unknownRef.current
    const toLearn = unknown.slice(0, NEW_CARDS_LIMIT)
    deferredCountRef.current = unknown.length - toLearn.length

    if (toLearn.length === 0) {
      setPhase('summary')
      return
    }
    const entries = toLearn.map((card) => ({ card, correctCount: 0, mistakeCount: 0 }))
    const [first, ...rest] = entries
    setActiveEntry(first ?? null)
    setLearningQueue(rest)
    setPhase('learning')
  }

  // Разбор — клавиатура: Space/Enter переворачивает, стрелки решают
  // (только когда карточка уже перевёрнута — решение приходит ПОСЛЕ перевода).
  useEffect(() => {
    if (phase !== 'triage') return
    function handleKeyDown(event: KeyboardEvent) {
      if (deciding) return
      if ((event.key === ' ' || event.key === 'Enter') && !flipped) {
        event.preventDefault()
        setFlipped(true)
      } else if (event.key === 'ArrowRight' && flipped) {
        void handleDecide('known')
      } else if (event.key === 'ArrowLeft' && flipped) {
        void handleDecide('unknown')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, flipped, deciding, index])

  async function handleLearningSubmit(event: FormEvent) {
    event.preventDefault()
    if (!activeEntry || !learningAnswer.trim() || checkAnswer.isPending) return

    const result = await checkAnswer.mutateAsync({
      card_id: activeEntry.card.id,
      answer: learningAnswer.trim(),
      direction: 'to_russian',
    })

    if (result.correct) {
      const newCorrectCount = activeEntry.correctCount + 1
      if (newCorrectCount >= GRADUATION_THRESHOLD) {
        // Выпуск — один раз уходит в /study/review и получает первую запись
        // в расписании. learning_mistakes снижает стартовую оценку, если
        // слово давалось не с первого раза (та же идея, что и с произношением).
        await submitReview.mutateAsync({
          card_id: activeEntry.card.id,
          answer: learningAnswer.trim(),
          direction: 'to_russian',
          learning_mistakes: activeEntry.mistakeCount,
        })
        setGraduatedCount((prev) => prev + 1)
        // Очередь ждущих не трогаем — выпущенная карточка в неё не возвращается.
      } else {
        setLearningQueue((prev) => [...prev, { ...activeEntry, correctCount: newCorrectCount }])
      }
    } else {
      setLearningQueue((prev) => [
        ...prev,
        { ...activeEntry, correctCount: 0, mistakeCount: activeEntry.mistakeCount + 1 },
      ])
    }

    setLearningVerdict({ correct: result.correct, expected: result.expected })
    setLearningPhase('verdict')
  }

  function handleLearningNext() {
    setLearningAnswer('')
    setLearningVerdict(null)
    setLearningPhase('question')

    const [next, ...rest] = learningQueue
    if (next) {
      setActiveEntry(next)
      setLearningQueue(rest)
    } else {
      setActiveEntry(null)
      setPhase('summary')
    }
  }

  const backTo = `/decks/${id}`

  if (phase === 'loading' || !deck) {
    return <div className="mx-auto max-w-md px-6 py-16 text-center text-ink-muted">Загрузка…</div>
  }

  if (phase === 'empty') {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="mb-4 text-ink-muted">В этой колоде нечего разбирать — всё уже видели</p>
        <Button variant="secondary" onClick={() => navigate(backTo)}>
          ← К колоде
        </Button>
      </div>
    )
  }

  if (phase === 'summary') {
    const learnedNow = graduatedCount
    const deferred = deferredCountRef.current
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="mb-2 text-2xl font-medium text-ink">Готово</p>
        <p className="mb-1 text-ink-muted">Разобрано: {queue.length}</p>
        <p className="mb-1 text-ink-muted">Знакомых слов: {knownCount}</p>
        {learnedNow > 0 && <p className="mb-1 text-ink-muted">Выучено сейчас: {learnedNow}</p>}
        {deferred > 0 && (
          <p className="mb-1 text-ink-muted">Остальные ({deferred}) войдут в учёбу в следующие дни</p>
        )}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={() => navigate(`/study?deck=${id}`)}>Учить сейчас</Button>
          <Button variant="secondary" onClick={() => navigate(backTo)}>
            ← К колоде
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'learning') {
    if (!activeEntry) {
      return <div className="mx-auto max-w-md px-6 py-16 text-center text-ink-muted">Загрузка…</div>
    }
    const { card } = activeEntry

    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <p className="mb-6 text-center text-sm text-ink-muted">
          {/* +1 только пока вопрос ещё не отвечен: после submit неудачная/
              неполная попытка уже дописана в конец learningQueue, и считать
              activeEntry сверху — задвоение. */}
          Заучивание · осталось {learningQueue.length + (learningPhase === 'question' ? 1 : 0)}
        </p>

        <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-card">
          <p className="mb-3 text-sm text-ink-subtle">Переведите на русский</p>
          <p className={`text-2xl font-medium text-ink ${deck.language === 'ja' ? 'font-jp' : ''}`}>
            {card.word}
          </p>
          {card.reference !== card.word && (
            <p className="mt-1 font-jp text-ink-subtle">{card.reference}</p>
          )}

          {learningPhase === 'question' && (
            <form onSubmit={handleLearningSubmit} className="mt-6 flex flex-col gap-4">
              <TextField
                label="Перевод"
                value={learningAnswer}
                onChange={(event) => setLearningAnswer(event.target.value)}
                autoFocus
              />
              <Button type="submit" loading={checkAnswer.isPending || submitReview.isPending}>
                Проверить
              </Button>
            </form>
          )}

          {learningPhase === 'verdict' && learningVerdict && (
            <div className="mt-6 flex flex-col gap-3">
              <p className={learningVerdict.correct ? 'text-accent-strong' : 'text-danger'}>
                {learningVerdict.correct ? 'Верно' : 'Неверно'}
              </p>
              {!learningVerdict.correct && (
                <p className="text-sm text-ink-muted">
                  Правильный ответ: {learningVerdict.expected.join(', ')}
                </p>
              )}
              <Button onClick={handleLearningNext}>Далее</Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // phase === 'triage'
  if (!currentCard) return null

  return (
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden py-16">
      {/* Подсвечивается КРАЙ ЭКРАНА, к которому тянут, а не сторона карточки —
          поэтому зоны лежат снаружи перетаскиваемого элемента (внутри они
          уезжали бы вместе с ним). Градиент от края внутрь: у самой кромки
          насыщенно, к центру сходит на нет. */}
      <motion.div
        aria-hidden
        style={{ opacity: unknownGlow }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-danger-soft to-transparent"
      />
      <motion.div
        aria-hidden
        style={{ opacity: knownGlow }}
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-accent-soft to-transparent"
      />

      <p className="mb-6 text-center text-sm text-ink-muted">
        {index + 1} / {queue.length}
      </p>

      {/* Подписи — снаружи карточки. Обёртки flex-1 центрируют каждую в своей
          половине свободного места, то есть ровно посередине между краем
          экрана и границей карточки. Всегда видны (приглушённо), чтобы
          механика читалась до первого жеста. */}
      <div className="flex items-center justify-center px-6">
        <div className="hidden flex-1 justify-center sm:flex">
          <motion.span
            style={{ opacity: unknownLabel }}
            className="text-sm font-medium text-danger select-none"
          >
            ← Не знаю
          </motion.span>
        </div>

        <div className="w-full max-w-xs shrink-0">
          <SwipeCard
            ref={cardHandleRef}
            card={currentCard}
            language={deck.language}
            flipped={flipped}
            onFlip={() => setFlipped(true)}
            onDecide={(direction) => void handleDecide(direction)}
            x={x}
          />
        </div>

        <div className="hidden flex-1 justify-center sm:flex">
          <motion.span
            style={{ opacity: knownLabel }}
            className="text-sm font-medium text-accent-strong select-none"
          >
            Знаю →
          </motion.span>
        </div>
      </div>

      {/* На узком экране подписи по бокам не помещаются — показываем их под
          карточкой, той же парой и с той же реакцией на свайп. */}
      <div className="mt-5 flex items-center justify-center gap-8 sm:hidden">
        <motion.span
          style={{ opacity: unknownLabel }}
          className="text-sm font-medium text-danger select-none"
        >
          ← Не знаю
        </motion.span>
        <motion.span
          style={{ opacity: knownLabel }}
          className="text-sm font-medium text-accent-strong select-none"
        >
          Знаю →
        </motion.span>
      </div>

      {/* Видимых кнопок решения нет — жест единственный очевидный путь.
          Клавиши для тех, кому жест недоступен (нет мыши/тача, клавиатурная
          навигация), поэтому подсказка меняется вместе с состоянием: до
          переворота — как открыть, после — как решить. */}
      <p className="mt-6 text-center text-xs text-ink-subtle">
        {flipped ? 'Перетащите карточку в сторону · или ← / →' : 'Нажмите на карточку · или пробел'}
      </p>
    </div>
  )
}
