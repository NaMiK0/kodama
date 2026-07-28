import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

import { fetchDueCards, fetchNewCards, type ReviewResult, type StudyItem } from '../api'
import { NEW_CARDS_LIMIT, useSubmitReview } from '../hooks'
import { StudySummary } from './StudySummary'

type Phase = 'loading' | 'question' | 'verdict' | 'empty' | 'summary'

const TARGET_LANGUAGE_NAMES = { en: 'английском', ja: 'японском' } as const

export function StudySessionPage() {
  const { language } = useLanguage()
  const navigate = useNavigate()

  // Снимок заданий на момент старта сессии — намеренно НЕ через useQuery.
  // due-кэш инвалидируется после каждого review (см. useSubmitReview), и живой
  // запрос пересобирал бы список прямо по ходу сессии — задания уезжали бы
  // из-под пользователя после каждого ответа.
  const [queue, setQueue] = useState<StudyItem[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<ReviewResult | null>(null)

  const submitReview = useSubmitReview()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [due, fresh] = await Promise.all([
        fetchDueCards(language),
        fetchNewCards(language, NEW_CARDS_LIMIT),
      ])
      if (cancelled) return
      const combined = [...due, ...fresh]
      setQueue(combined)
      setPhase(combined.length > 0 ? 'question' : 'empty')
    }

    load()
    return () => {
      cancelled = true
    }
  }, [language])

  const item = queue[index]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!item || !answer.trim() || submitReview.isPending) return

    const result = await submitReview.mutateAsync({
      card_id: item.card.id,
      answer: answer.trim(),
      direction: item.direction,
    })
    if (result.correct) setCorrectCount((prev) => prev + 1)
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
    return <div className="mx-auto max-w-md px-6 py-16 text-center text-ink-muted">Загрузка…</div>
  }

  if (phase === 'empty') {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="mb-4 text-ink-muted">Учить пока нечего</p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Назад к колодам
        </Button>
      </div>
    )
  }

  if (phase === 'summary') {
    return <StudySummary total={queue.length} correctCount={correctCount} />
  }

  if (!item) return null

  const { card, direction } = item

  // Чтение (reference) можно показать только когда оно НЕ является ответом:
  // при "язык → RU" это подсказка к прочтению, при "RU → язык" — прямая
  // выдача ответа (карточка ru→en/ja).
  const prompt = direction === 'to_russian' ? card.word : card.translation
  const hint = direction === 'to_russian' && card.reference !== card.word ? card.reference : null

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="mb-6 text-center text-sm text-ink-muted">
        {index + 1} / {queue.length}
      </p>

      <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-card">
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
            <Button type="submit" loading={submitReview.isPending}>
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
          </div>
        )}
      </div>
    </div>
  )
}
