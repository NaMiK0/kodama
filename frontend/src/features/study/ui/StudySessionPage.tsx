import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { useMe } from '@/features/auth/hooks'
import { PronunciationBlock } from '@/features/pronunciation/ui/PronunciationBlock'
import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

import { fetchDueCards, fetchNewCards, type AnswerKind, type StudyItem } from '../api'
import { useCheckAnswer, useNewCardsLimit, useSubmitReview } from '../hooks'
import { StudySummary } from './StudySummary'

type Phase = 'loading' | 'question' | 'verdict' | 'empty' | 'summary'

const TARGET_LANGUAGE_NAMES = { en: 'английском', ja: 'японском' } as const

// Ошибочная карточка возвращается в конец очереди для повторной попытки —
// повтор проверяется через /study/check-answer (см. useCheckAnswer) и не
// трогает расписание: правильность решает сервер, а не подсчёт локально,
// но статистику SM-2 портить второй попыткой не нужно.
type QueueEntry = { item: StudyItem; isRetry: boolean }

// Верное подмножество ReviewResult/AnswerCheckResult — экрану для рендера
// вердикта больше ничего не нужно, а типы двух эндпоинтов иначе пришлось бы
// объединять в union ради общих трёх полей.
type Verdict = { correct: boolean; kind: AnswerKind; expected: string[] }

// Fisher-Yates — иначе перемешивание смещено в сторону исходного порядка
// (например, naive `sort(() => Math.random() - 0.5)`).
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const iValue = result[i] as T
    result[i] = result[j] as T
    result[j] = iValue
  }
  return result
}

export function StudySessionPage() {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Необязательный параметр — изучение конкретной колоды со страницы колоды.
  // Без него сессия остаётся общей по языку (см. design.md: намеренное
  // решение — выбор колоды каждый раз приучил бы избегать тяжёлых).
  const deckParam = searchParams.get('deck')
  const deckId = deckParam ? Number(deckParam) : undefined
  const backTo = deckId !== undefined ? `/decks/${deckId}` : '/'

  // Снимок заданий на момент старта сессии — намеренно НЕ через useQuery.
  // due-кэш инвалидируется после каждого review (см. useSubmitReview), и живой
  // запрос пересобирал бы список прямо по ходу сессии — задания уезжали бы
  // из-под пользователя после каждого ответа.
  const [queue, setQueue] = useState<QueueEntry[]>([])
  // Знаменатель для итога — count исходных заданий, зафиксированный при
  // загрузке. queue.length растёт с повторами и для «N из M» не годится.
  const [originalTotal, setOriginalTotal] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  const submitReview = useSubmitReview()
  const checkAnswer = useCheckAnswer()
  const newCardsLimit = useNewCardsLimit()
  const { data: user } = useMe()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [due, fresh] = await Promise.all([
        fetchDueCards(language, deckId),
        fetchNewCards(language, newCardsLimit, deckId),
      ])
      if (cancelled) return
      const combined = shuffle([...due, ...fresh])
      setQueue(combined.map((item) => ({ item, isRetry: false })))
      setOriginalTotal(combined.length)
      setPhase(combined.length > 0 ? 'question' : 'empty')
    }

    load()
    return () => {
      cancelled = true
    }
  }, [language, deckId, newCardsLimit])

  const entry = queue[index]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!entry || !answer.trim() || submitReview.isPending || checkAnswer.isPending) return

    const payload = {
      card_id: entry.item.card.id,
      answer: answer.trim(),
      direction: entry.item.direction,
    }
    const result = entry.isRetry
      ? await checkAnswer.mutateAsync(payload)
      : await submitReview.mutateAsync(payload)

    // Только исходная (влияющая на SM-2) попытка идёт в статистику сессии —
    // повтор существует, чтобы закрепить слово, а не поднять цифру в итоге.
    if (!entry.isRetry && result.correct) setCorrectCount((prev) => prev + 1)
    if (!result.correct) {
      setQueue((prev) => [...prev, { item: entry.item, isRetry: true }])
    }
    setVerdict(result)
    setPhase('verdict')
  }

  function handleNext() {
    const nextIndex = index + 1
    setAnswer('')
    setVerdict(null)
    if (nextIndex >= queue.length) {
      setPhase('summary')
    } else {
      setIndex(nextIndex)
      setPhase('question')
    }
  }

  // «Далее» по Enter — в потоке из десятка карточек это ощутимо быстрее,
  // чем каждый раз тянуться к кнопке мышью.
  useEffect(() => {
    if (phase !== 'verdict') return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') handleNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, queue.length])

  if (phase === 'loading') {
    return <div className="mx-auto w-full max-w-md px-6 py-16 text-center text-ink-muted">Загрузка…</div>
  }

  if (phase === 'empty') {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-16 text-center">
        <p className="mb-4 text-ink-muted">
          {deckId !== undefined ? 'В этой колоде на сегодня всё' : 'Учить пока нечего'}
        </p>
        <Button variant="secondary" onClick={() => navigate(backTo)}>
          {deckId !== undefined ? '← К колоде' : 'Назад к колодам'}
        </Button>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <StudySummary
        total={originalTotal}
        correctCount={correctCount}
        backTo={backTo}
        backLabel={deckId !== undefined ? '← К колоде' : 'К колодам'}
      />
    )
  }

  if (!entry) return null

  const { card, direction } = entry.item

  // Чтение (reference) можно показать только когда оно НЕ является ответом:
  // при "язык → RU" это подсказка к прочтению, при "RU → язык" — прямая
  // выдача ответа (карточка ru→en/ja).
  const prompt = direction === 'to_russian' ? card.word : card.translation
  const hint = direction === 'to_russian' && card.reference !== card.word ? card.reference : null

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      {/* Исходные задания всегда занимают начало очереди (индексы
          0..originalTotal-1) — повторы дописываются только в хвост, поэтому
          "N / M" для них остаётся стабильным знаменателем. На повторе цифры
          не показываем: их количество может ещё вырасти по ходу сессии,
          если человек снова ошибётся, — обещать точный остаток нечестно. */}
      <p className="mb-6 text-center text-sm text-ink-muted">
        {entry.isRetry ? 'Повторение' : `${index + 1} / ${originalTotal}`}
      </p>

      <div className="relative rounded-xl border border-line bg-surface p-8 text-center shadow-card">
        {/* Пометка в углу, а не в потоке текста — читается как ярлык на
            карточке, а не как ещё одна строка контента. Внутри границы:
            выступающая наружу метка спорит с формой карточки. */}
        {entry.isRetry && (
          <span className="absolute top-3 left-3 rounded-md bg-retry-soft px-2 py-0.5 text-xs font-medium text-retry">
            Повтор
          </span>
        )}

        {/* Направление больше не выбирается на входе и меняется от задания к
            заданию — значит, экран обязан сказать, что именно от человека
            хотят, иначе он гадает по подписи поля ввода. */}
        <p className="mb-3 text-sm text-ink-subtle">
          {direction === 'to_russian'
            ? 'Переведите на русский'
            : `Скажите на ${TARGET_LANGUAGE_NAMES[language]}`}
        </p>

        {/* font-jp только когда на экране действительно японские глифы: при
            «язык → RU» вопрос — это слово изучаемого языка. */}
        <p
          className={`text-2xl font-medium text-ink ${
            language === 'ja' && direction === 'to_russian' ? 'font-jp' : ''
          }`}
        >
          {prompt}
        </p>
        {hint && <p className="mt-1 font-jp text-ink-subtle">{hint}</p>}

        {phase === 'question' && (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <TextField
              label={direction === 'to_russian' ? 'Перевод' : 'Слово'}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              autoFocus
            />
            <Button type="submit" loading={submitReview.isPending || checkAnswer.isPending}>
              Проверить
            </Button>
          </form>
        )}

        {phase === 'verdict' && verdict && (
          <div className="mt-6 flex flex-col gap-3">
            <p className={verdict.correct ? 'text-accent-strong' : 'text-danger'}>
              {verdict.correct ? (verdict.kind === 'fuzzy' ? 'Верно (с опечаткой)' : 'Верно') : 'Неверно'}
            </p>
            {!verdict.correct && (
              <p className="text-sm text-ink-muted">Правильный ответ: {verdict.expected.join(', ')}</p>
            )}
            <Button onClick={handleNext}>Далее</Button>

            {/* key размонтирует блок на каждом новом задании — иначе состояние
                записи прошлой карточки протекло бы в следующую. */}
            {user?.offer_pronunciation !== false && (
              <PronunciationBlock key={index} cardId={card.id} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
