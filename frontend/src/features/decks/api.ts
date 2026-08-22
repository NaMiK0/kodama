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
  folder_id: number | null
}

export type DeckCreatePayload = {
  topic: string
  language: StudyLanguage
  level: string
}

// Всё опционально: используется и для переименования полей колоды, и —
// в первую очередь для Библиотеки — для одного лишь переноса folder_id,
// без прикосновения к остальным полям.
export type DeckUpdatePayload = Partial<{
  topic: string
  level: string
  folder_id: number | null
}>

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

// Для Библиотеки: 'none' — только колоды без папки (корень), число — колоды
// внутри конкретной папки. Отдельная функция, а не расширение fetchDecks —
// та обслуживает DecksPage с постраничной подгрузкой (limit), эта — срез по
// ровно одному уровню дерева папок, без пагинации.
export function fetchDecksInFolder(
  language: StudyLanguage,
  folderId: number | 'none',
): Promise<Deck[]> {
  return apiFetch<Deck[]>(`/decks?language=${language}&folder_id=${folderId}`)
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

export function updateDeck(id: number, payload: DeckUpdatePayload): Promise<Deck> {
  return apiFetch<Deck>(`/decks/${id}`, { method: 'PATCH', json: payload })
}
