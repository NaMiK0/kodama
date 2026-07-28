import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

const STORAGE_KEY = 'kodama-generation-jobs'

export type GenerationJobEntry = {
  jobId: number
  topic: string
  language: StudyLanguage
  level: string
  count: number
  // 'done' сюда никогда не попадает — готовая задача сразу удаляется,
  // на её месте уже настоящая колода.
  status: 'pending' | 'processing' | 'failed'
  startedAt: number
}

export function loadJobs(): GenerationJobEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as GenerationJobEntry[]) : []
  } catch {
    // испорченный JSON в хранилище не должен ронять приложение
    return []
  }
}

export function saveJobs(jobs: GenerationJobEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
}
