import { apiFetch } from '@/shared/api/client'

export type AttemptStatus = 'pending' | 'processing' | 'done' | 'failed'

export type AttemptRead = {
  id: number
  card_id: number
  status: AttemptStatus
  score: number | null
  transcript: string | null
  detail: Record<string, unknown> | null
  // Сырой str(exception) воркера — пользователю не показываем напрямую.
  error: string | null
  created_at: string
}

export function createAttempt(cardId: number, audio: Blob, mimeType: string): Promise<AttemptRead> {
  const formData = new FormData()
  formData.append('card_id', String(cardId))
  // Расширение серверу не нужно — он определяет формат по content-type
  // (см. _EXTENSION_BY_TYPE в backend/app/modules/pronunciation/service.py).
  formData.append('audio', audio, `attempt.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`)

  return apiFetch<AttemptRead>('/pronunciation/attempts', { method: 'POST', body: formData })
}

export function fetchAttempt(attemptId: number): Promise<AttemptRead> {
  return apiFetch<AttemptRead>(`/pronunciation/attempts/${attemptId}`)
}
