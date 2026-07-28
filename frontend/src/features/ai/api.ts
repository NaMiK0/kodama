import { apiFetch } from '@/shared/api/client'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export type JobRead = {
  id: number
  status: JobStatus
  deck_id: number | null
  // Сырой str(exception) воркера — пользователю не показываем напрямую.
  error: string | null
  created_at: string
}

export type GenerateDeckPayload = {
  topic: string
  language: StudyLanguage
  level: string
  count: number
}

export function generateDeck(payload: GenerateDeckPayload): Promise<JobRead> {
  return apiFetch<JobRead>('/ai/decks', { method: 'POST', json: payload })
}

export function fetchJob(jobId: number): Promise<JobRead> {
  return apiFetch<JobRead>(`/ai/jobs/${jobId}`)
}
