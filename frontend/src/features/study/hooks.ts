import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

import { fetchDueCards, fetchNewCards, submitReview, type ReviewPayload } from './api'

export const STUDY_QUERY_KEY = ['study'] as const
export const NEW_CARDS_LIMIT = 10

export function studyDueKey(language: StudyLanguage) {
  return [...STUDY_QUERY_KEY, 'due', language] as const
}

export function studyNewKey(language: StudyLanguage) {
  return [...STUDY_QUERY_KEY, 'new', language] as const
}

// Для бейджа на входе: "N карточек на сегодня" должно совпадать с тем, что
// реально войдёт в сессию (due + до NEW_CARDS_LIMIT новых) — иначе кнопка
// обещает одно число, а сессия покажет другое.
export function useDueCards(language: StudyLanguage) {
  return useQuery({ queryKey: studyDueKey(language), queryFn: () => fetchDueCards(language) })
}

export function useNewCards(language: StudyLanguage) {
  return useQuery({
    queryKey: studyNewKey(language),
    queryFn: () => fetchNewCards(language, NEW_CARDS_LIMIT),
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
