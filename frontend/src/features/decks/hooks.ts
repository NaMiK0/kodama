import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

import { createDeck, deleteDeck, fetchDeck, fetchDecks, type DeckCreatePayload } from './api'

/**
 * Общий префикс всех ключей, связанных с колодами. TanStack сопоставляет ключи
 * по префиксу, поэтому инвалидация по нему разом сбрасывает и списки обоих
 * языков, и открытую колоду — мутациям не нужно знать, что именно закэшировано.
 */
export const DECKS_QUERY_KEY = ['decks'] as const

// Список кэшируется отдельно под каждый язык (и под каждый limit — «Показать
// ещё» растит limit и просто перезапрашивает список заново, без склейки
// страниц): при переключении туда-обратно данные рисуются из кэша сразу, без
// состояния загрузки (фоновая ревалидация при этом идёт — но её не видно).
export function decksListKey(language: StudyLanguage, limit: number) {
  return [...DECKS_QUERY_KEY, 'list', language, limit] as const
}

export function deckDetailKey(id: number) {
  return [...DECKS_QUERY_KEY, 'detail', id] as const
}

export function useDecks(language: StudyLanguage, limit: number) {
  return useQuery({
    queryKey: decksListKey(language, limit),
    queryFn: () => fetchDecks(language, limit),
    placeholderData: (previous) => previous, // при росте limit не мигаем в скелетон
  })
}

export function useDeck(id: number) {
  return useQuery({
    queryKey: deckDetailKey(id),
    queryFn: () => fetchDeck(id),
  })
}

export function useCreateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DeckCreatePayload) => createDeck(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY }),
  })
}

export function useDeleteDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDeck(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY }),
  })
}
