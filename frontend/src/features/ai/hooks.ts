import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'

import { DECKS_QUERY_KEY } from '@/features/decks/hooks'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'
import { useServerEvents } from '@/shared/lib/ServerEventsProvider'

import { fetchJob, generateDeck, type GenerateDeckPayload, type JobStatus } from './api'
import { loadJobs, saveJobs, type GenerationJobEntry } from './storage'

export const AI_QUERY_KEY = ['ai'] as const

export function aiJobKey(jobId: number) {
  return [...AI_QUERY_KEY, 'jobs', jobId] as const
}

export const MAX_ACTIVE_JOBS = 3
export const JOB_POLL_INTERVAL_MS = 3_000
export const STALE_JOB_MS = 3 * 60 * 1000
const STALE_TICK_MS = 30_000

function isActive(entry: GenerationJobEntry): boolean {
  return entry.status === 'pending' || entry.status === 'processing'
}

export function isStale(entry: GenerationJobEntry, now: number): boolean {
  return isActive(entry) && now - entry.startedAt > STALE_JOB_MS
}

export function useGenerateDeck() {
  return useMutation({
    mutationFn: (payload: GenerateDeckPayload) => generateDeck(payload),
  })
}

/**
 * Единый источник состояния задач генерации: заводит их, слушает WS,
 * опрашивает сервер как резерв и держит хранилище (localStorage) в
 * актуальном виде. `language` — фильтр для отдаваемого списка, лимит
 * одновременных задач (MAX_ACTIVE_JOBS) — общий на всё приложение.
 */
export function useGenerationJobs(language: StudyLanguage) {
  const queryClient = useQueryClient()
  const { subscribe, isConnected } = useServerEvents()
  const [jobs, setJobs] = useState<GenerationJobEntry[]>(loadJobs)
  const wasConnectedRef = useRef(isConnected)

  useEffect(() => {
    saveJobs(jobs)
  }, [jobs])

  // Просрочка (§C) не переписывается в хранилище — только пересчитывается на
  // рендере. Тик нужен, чтобы 3-минутная граница проявилась и без внешнего
  // события (WS/ответа сервера); включён, только пока есть активные задачи.
  const [, forceTick] = useState(0)
  const hasActive = jobs.some(isActive)
  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => forceTick((n) => n + 1), STALE_TICK_MS)
    return () => clearInterval(timer)
  }, [hasActive])

  const applyJobStatus = useCallback(
    async (jobId: number, status: JobStatus, deckId: number | null) => {
      void deckId
      if (status === 'done') {
        // Ждём, пока список колод обновится, и только потом снимаем заглушку —
        // иначе будет кадр без заглушки и без колоды, сетка дёрнется.
        await queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY })
        setJobs((prev) => prev.filter((entry) => entry.jobId !== jobId))
        return
      }
      if (status === 'pending' || status === 'processing' || status === 'failed') {
        setJobs((prev) =>
          prev.map((entry) => (entry.jobId === jobId ? { ...entry, status } : entry)),
        )
      }
    },
    [queryClient],
  )

  useEffect(() => {
    return subscribe((event) => {
      if (event.type !== 'generation') return
      void applyJobStatus(event.job_id, event.status as JobStatus, event.deck_id)
    })
  }, [subscribe, applyJobStatus])

  // Однократный опрос при (пере)подключении сокета — переход false -> true.
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      void queryClient.refetchQueries({ queryKey: AI_QUERY_KEY })
    }
    wasConnectedRef.current = isConnected
  }, [isConnected, queryClient])

  const activeEntries = jobs.filter(isActive)

  const results = useQueries({
    queries: activeEntries.map((entry) => ({
      queryKey: aiJobKey(entry.jobId),
      queryFn: () => fetchJob(entry.jobId),
      refetchInterval: isConnected ? false : JOB_POLL_INTERVAL_MS,
    })),
  })

  // Дешёвая сигнатура вместо самого `results` — react-query отдаёт новый
  // массив почти каждый рендер, а эффект должен срабатывать только когда
  // реально сменился статус или deck_id какой-то задачи.
  const resultsSignature = results
    .map((result) => (result.data ? `${result.data.id}:${result.data.status}:${result.data.deck_id ?? ''}` : ''))
    .join(',')

  useEffect(() => {
    for (const result of results) {
      if (result.data) void applyJobStatus(result.data.id, result.data.status, result.data.deck_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsSignature])

  const addJob = useCallback((entry: GenerationJobEntry) => {
    setJobs((prev) => [entry, ...prev])
  }, [])

  const dismissJob = useCallback((jobId: number) => {
    setJobs((prev) => prev.filter((entry) => entry.jobId !== jobId))
  }, [])

  const replaceJob = useCallback((oldJobId: number, entry: GenerationJobEntry) => {
    setJobs((prev) => [entry, ...prev.filter((item) => item.jobId !== oldJobId)])
  }, [])

  const activeCount = jobs.filter(isActive).length

  return {
    entries: jobs
      .filter((entry) => entry.language === language)
      .sort((a, b) => b.startedAt - a.startedAt),
    canGenerate: activeCount < MAX_ACTIVE_JOBS,
    addJob,
    dismissJob,
    replaceJob,
  }
}
