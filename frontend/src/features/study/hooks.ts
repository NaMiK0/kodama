import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

import {
  checkAnswer,
  fetchDueCards,
  fetchNewCards,
  markKnown,
  submitReview,
  type ReviewPayload,
} from './api'

export const STUDY_QUERY_KEY = ['study'] as const
export const NEW_CARDS_LIMIT = 20

export function studyDueKey(language: StudyLanguage, deckId?: number) {
  return [...STUDY_QUERY_KEY, 'due', language, deckId] as const
}

export function studyNewKey(language: StudyLanguage, deckId?: number) {
  return [...STUDY_QUERY_KEY, 'new', language, deckId] as const
}

// Для бейджа на входе: "N карточек на сегодня" должно совпадать с тем, что
// реально войдёт в сессию (due + до NEW_CARDS_LIMIT новых) — иначе кнопка
// обещает одно число, а сессия покажет другое. deckId — тот же бейдж, но
// на странице конкретной колоды (см. DeckDetailPage).
export function useDueCards(language: StudyLanguage, deckId?: number) {
  return useQuery({
    queryKey: studyDueKey(language, deckId),
    queryFn: () => fetchDueCards(language, deckId),
  })
}

export function useNewCards(language: StudyLanguage, deckId?: number) {
  return useQuery({
    queryKey: studyNewKey(language, deckId),
    queryFn: () => fetchNewCards(language, NEW_CARDS_LIMIT, deckId),
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReviewPayload) => submitReview(payload),
    // Инвалидируем после каждого ответа, а не только в конце сессии: сама
    // сессия держит свой список карточек как неизменный снимок (см.
    // StudySessionPage), а этот кэш — только для бейджа «N на сегодня» на
    // странице колод, которая в момент сессии не смонтирована и не перечитает
    // данные, пока пользователь туда не вернётся.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDY_QUERY_KEY }),
  })
}

// Без invalidateQueries: проверка не пишет в расписание, кэш /study не устарел.
export function useCheckAnswer() {
  return useMutation({
    mutationFn: (payload: ReviewPayload) => checkAnswer(payload),
  })
}

// Свайп "Знаю" в разборе колоды — меняет расписание, счётчик "N на сегодня"
// (StudyEntry) должен это увидеть.
export function useMarkKnown() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) => markKnown(cardId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDY_QUERY_KEY }),
  })
}
