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
}

// Единица сессии — не карточка, а «что спросить и в какую сторону».
// Направление приходит с сервера: у каждой стороны своё расписание,
// пользователь его больше не выбирает.
export type StudyItem = {
  card: Card
  direction: AnswerDirection
}

export function fetchDueCards(language: StudyLanguage): Promise<StudyItem[]> {
  return apiFetch<StudyItem[]>(`/study/due?language=${language}`)
}

export function fetchNewCards(language: StudyLanguage, limit: number): Promise<StudyItem[]> {
  return apiFetch<StudyItem[]>(`/study/new?language=${language}&limit=${limit}`)
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
