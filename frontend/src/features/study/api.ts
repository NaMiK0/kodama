import { apiFetch } from '@/shared/api/client'
import type { Card } from '@/features/cards/api'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

export type AnswerDirection = 'to_target' | 'to_russian'

export type AnswerKind = 'exact' | 'fuzzy' | 'llm' | 'incorrect'

export type ReviewResult = {
  card_id: number
  correct: boolean
  kind: AnswerKind
  expected: string[]
  quality: number
  repetitions: number
  interval: number
  ease_factor: number
  next_review_date: string
}

export type ReviewPayload = {
  card_id: number
  answer: string
  direction: AnswerDirection
  /**
   * Сколько раз слово провалили в фазе заучивания (разбор колоды) ДО выпуска
   * в расписание. Снижает стартовую оценку, чтобы туго давшееся слово вернулось
   * раньше лёгкого. Необязательное: обычная сессия фазы заучивания не имеет
   * и поле не шлёт, сервер подставит 0.
   */
  learning_mistakes?: number
}

// Единица сессии — не карточка, а «что спросить и в какую сторону».
// Направление приходит с сервера: у каждой стороны своё расписание,
// пользователь его больше не выбирает.
export type StudyItem = {
  card: Card
  direction: AnswerDirection
}

export function fetchDueCards(language: StudyLanguage, deckId?: number): Promise<StudyItem[]> {
  const deckParam = deckId !== undefined ? `&deck_id=${deckId}` : ''
  return apiFetch<StudyItem[]>(`/study/due?language=${language}${deckParam}`)
}

export function fetchNewCards(
  language: StudyLanguage,
  limit: number,
  deckId?: number,
): Promise<StudyItem[]> {
  const deckParam = deckId !== undefined ? `&deck_id=${deckId}` : ''
  return apiFetch<StudyItem[]>(`/study/new?language=${language}&limit=${limit}${deckParam}`)
}

export function submitReview(payload: ReviewPayload): Promise<ReviewResult> {
  return apiFetch<ReviewResult>('/study/review', { method: 'POST', json: payload })
}

export type AnswerCheckResult = {
  correct: boolean
  kind: AnswerKind
  expected: string[]
}

// Тот же контракт запроса, что у /study/review, но проверка не пишет
// в расписание — ей закрываются повторы ошибочных карточек внутри сессии.
export function checkAnswer(payload: ReviewPayload): Promise<AnswerCheckResult> {
  return apiFetch<AnswerCheckResult>('/study/check-answer', { method: 'POST', json: payload })
}

// Материал для разбора колоды — слова, которых нет ни в каком расписании.
export function fetchUnseenCards(deckId: number): Promise<Card[]> {
  return apiFetch<Card[]>(`/study/unseen?deck_id=${deckId}`)
}

// Свайп "Знаю" — самооценка без проверки ответом, откладывает слово на
// несколько дней вперёд (см. SELF_ASSESSED_KNOWN_INTERVAL на бэкенде).
export function markKnown(cardId: number): Promise<void> {
  return apiFetch('/study/mark-known', { method: 'POST', json: { card_id: cardId } })
}
