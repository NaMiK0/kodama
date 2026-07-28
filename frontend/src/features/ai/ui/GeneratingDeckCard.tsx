import { useState } from 'react'

import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'

import { useGenerateDeck, isStale } from '../hooks'
import type { GenerationJobEntry } from '../storage'

const LEVEL_LABEL = (entry: GenerationJobEntry) => `${entry.level} · ${entry.count} карточек`

type Props = {
  entry: GenerationJobEntry
  canGenerate: boolean
  onDismiss: (jobId: number) => void
  onReplace: (oldJobId: number, entry: GenerationJobEntry) => void
}

export function GeneratingDeckCard({ entry, canGenerate, onDismiss, onReplace }: Props) {
  const [retryError, setRetryError] = useState<string>()
  const generateDeck = useGenerateDeck()

  const failed = entry.status === 'failed' || isStale(entry, Date.now())

  async function handleRetry() {
    setRetryError(undefined)
    try {
      const job = await generateDeck.mutateAsync({
        topic: entry.topic,
        language: entry.language,
        level: entry.level,
        count: entry.count,
      })
      onReplace(entry.jobId, {
        jobId: job.id,
        topic: entry.topic,
        language: entry.language,
        level: entry.level,
        count: entry.count,
        status: 'pending',
        startedAt: Date.now(),
      })
    } catch (error) {
      setRetryError(error instanceof ApiError ? error.detail : 'Не удалось запустить генерацию')
    }
  }

  if (failed) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-danger bg-danger-soft p-5">
        <div>
          <h3 className="line-clamp-2 font-medium text-ink">{entry.topic}</h3>
          <p className="text-sm text-ink-muted">{LEVEL_LABEL(entry)}</p>
        </div>

        <p className="text-sm text-danger">Не удалось сгенерировать колоду</p>
        {retryError && (
          <p role="alert" className="text-sm text-danger">
            {retryError}
          </p>
        )}

        <div className="mt-auto flex gap-2">
          <Button
            variant="secondary"
            loading={generateDeck.isPending}
            disabled={!canGenerate}
            onClick={handleRetry}
          >
            Повторить
          </Button>
          <Button variant="ghost" onClick={() => onDismiss(entry.jobId)}>
            Удалить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-soft p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="line-clamp-2 font-medium text-ink">Генерируем: {entry.topic}</h3>
          <p className="text-sm text-ink-muted">{LEVEL_LABEL(entry)}</p>
        </div>
        {/* Спиннер сообщает состояние системы, а не украшает — крутится
            и при prefers-reduced-motion (см. design.md). */}
        <span aria-hidden className="spinner size-5 shrink-0 rounded-full border-2 border-ink-subtle border-t-transparent" />
      </div>

      <div className="mt-auto flex justify-end">
        <Button variant="ghost" onClick={() => onDismiss(entry.jobId)}>
          Скрыть
        </Button>
      </div>
    </div>
  )
}
