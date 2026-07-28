import { apiFetch } from '@/shared/api/client'

export type Card = {
  id: number
  deck_id: number
  word: string
  reference: string
  translation: string
  example_sentence: string | null
  accepted_answers: string[]
  created_at: string
}

export type CardCreatePayload = {
  word: string
  translation: string
  reference?: string
  example_sentence?: string
}

export function fetchCards(deckId: number): Promise<Card[]> {
  return apiFetch<Card[]>(`/decks/${deckId}/cards`)
}

export function createCard(deckId: number, payload: CardCreatePayload): Promise<Card> {
  return apiFetch<Card>(`/decks/${deckId}/cards`, { method: 'POST', json: payload })
}

export function deleteCard(deckId: number, cardId: number): Promise<void> {
  return apiFetch(`/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' })
}
