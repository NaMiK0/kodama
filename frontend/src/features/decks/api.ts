import { apiFetch } from '@/shared/api/client'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

export type DeckSource = 'user_created' | 'ai_generated'

export type Deck = {
  id: number
  topic: string
  language: StudyLanguage
  level: string
  source: DeckSource
  created_at: string
  card_count: number
}

export type DeckCreatePayload = {
  topic: string
  language: StudyLanguage
  level: string
}

// Совпадает с LANGUAGE_LEVELS на бэкенде (app/modules/decks/enums.py) —
// используется и для валидации на клиенте, и для построения выпадающего списка.
// as const (без явного Record<...>): массивы остаются кортежами фиксированной
// длины, поэтому LEVELS_BY_LANGUAGE[lang][0] гарантированно строка, а не
// string | undefined — noUncheckedIndexedAccess доверяет длине кортежа.
export const LEVELS_BY_LANGUAGE = {
  en: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  ja: ['N5', 'N4', 'N3', 'N2', 'N1'],
} as const satisfies Record<StudyLanguage, readonly string[]>

// Язык не выбирают в формах — он приходит из шапки. Формы только называют
// его словами, чтобы выбор не оказался для человека сюрпризом.
export const LANGUAGE_NAMES = {
  en: 'Английский',
  ja: 'Японский',
} as const satisfies Record<StudyLanguage, string>

export type DeckTier = 'bronze' | 'silver' | 'gold'

export type CollectionEntry = {
  deck: Deck
  tier: DeckTier
  avg_ease_factor: number
}

export function fetchDecks(language: StudyLanguage, limit?: number): Promise<Deck[]> {
  const query = limit ? `language=${language}&limit=${limit}` : `language=${language}`
  return apiFetch<Deck[]>(`/decks?${query}`)
}

export function fetchCollection(language: StudyLanguage): Promise<CollectionEntry[]> {
  return apiFetch<CollectionEntry[]>(`/decks/collection?language=${language}`)
}

export function fetchDeck(id: number): Promise<Deck> {
  return apiFetch<Deck>(`/decks/${id}`)
}

export function createDeck(payload: DeckCreatePayload): Promise<Deck> {
  return apiFetch<Deck>('/decks', { method: 'POST', json: payload })
}

export function deleteDeck(id: number): Promise<void> {
  return apiFetch(`/decks/${id}`, { method: 'DELETE' })
}
