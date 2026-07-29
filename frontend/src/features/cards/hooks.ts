import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DECKS_QUERY_KEY, deckDetailKey } from '@/features/decks/hooks'

import {
  createCard,
  deleteCard,
  fetchCards,
  updateCard,
  type Card,
  type CardCreatePayload,
} from './api'

// Карточки — подресурс колоды, поэтому ключ продолжает ключ самой колоды:
// инвалидация по префиксу ['decks'] накрывает и их тоже.
export function cardsQueryKey(deckId: number) {
  return [...deckDetailKey(deckId), 'cards'] as const
}

export function useCards(deckId: number) {
  return useQuery({ queryKey: cardsQueryKey(deckId), queryFn: () => fetchCards(deckId) })
}

export type AddCardResult =
  | { payload: CardCreatePayload; ok: true; card: Card }
  | { payload: CardCreatePayload; ok: false; message: string }

/**
 * Бэкенд не умеет создавать карточки пачкой — шлём по одной последовательно
 * и не прерываемся на первой ошибке, чтобы неудачная строка не отменяла
 * остальные (частый случай: 9 валидных строк и 1 с опечаткой). Результат
 * сохраняет порядок входных payloads — вызывающий код может сопоставить
 * каждый результат со своей строкой формы по индексу.
 */
export function useAddCards(deckId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payloads: CardCreatePayload[]): Promise<AddCardResult[]> => {
      const results: AddCardResult[] = []

      for (const payload of payloads) {
        try {
          const card = await createCard(deckId, payload)
          results.push({ payload, ok: true, card })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Не удалось добавить карточку'
          results.push({ payload, ok: false, message })
        }
      }

      return results
    },
    onSuccess: (results) => {
      if (results.some((r) => r.ok)) {
        queryClient.invalidateQueries({ queryKey: cardsQueryKey(deckId) })
        queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY })
      }
    },
  })
}

// card_count колоды не меняется при редактировании — DECKS_QUERY_KEY трогать не нужно,
// в отличие от useAddCards/useDeleteCard.
export function useUpdateCard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, payload }: { cardId: number; payload: CardCreatePayload }) =>
      updateCard(deckId, cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardsQueryKey(deckId) })
    },
  })
}

export function useDeleteCard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) => deleteCard(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardsQueryKey(deckId) })
      queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY })
    },
  })
}
