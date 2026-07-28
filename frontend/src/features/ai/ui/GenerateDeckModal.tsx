import { useState, type FormEvent } from 'react'

import { LANGUAGE_NAMES, LEVELS_BY_LANGUAGE } from '@/features/decks/api'
import { ApiError } from '@/shared/api/client'
import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { TextField } from '@/shared/ui/TextField'

import { useGenerateDeck } from '../hooks'
import type { GenerationJobEntry } from '../storage'

const COUNT_OPTIONS = [10, 20, 30] as const

type Props = {
  open: boolean
  onClose: () => void
  canGenerate: boolean
  onCreated: (entry: GenerationJobEntry) => void
}

export function GenerateDeckModal({ open, onClose, canGenerate, onCreated }: Props) {
  const { language } = useLanguage()

  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<string>(LEVELS_BY_LANGUAGE[language][0])
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10)
  const [topicError, setTopicError] = useState<string>()
  const [formError, setFormError] = useState<string>()

  const generateDeck = useGenerateDeck()

  function handleClose() {
    setTopic('')
    setLevel(LEVELS_BY_LANGUAGE[language][0])
    setCount(10)
    setTopicError(undefined)
    setFormError(undefined)
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!topic.trim()) {
      setTopicError('Введите тему колоды')
      return
    }
    if (!canGenerate) {
      setFormError('Уже генерируются 3 колоды — дождитесь, пока одна из них завершится')
      return
    }
    setTopicError(undefined)
    setFormError(undefined)

    try {
      const job = await generateDeck.mutateAsync({ topic, language, level, count })
      onCreated({
        jobId: job.id,
        topic,
        language,
        level,
        count,
        status: job.status === 'done' || job.status === 'failed' ? 'pending' : job.status,
        startedAt: Date.now(),
      })
      handleClose()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : 'Не удалось запустить генерацию')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Сгенерировать колоду с ИИ">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Тема"
          placeholder="Например, Еда и напитки"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          error={topicError}
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-muted">Язык</span>
          <p className="text-ink">{LANGUAGE_NAMES[language]}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-muted">Уровень</span>
          <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
            {LEVELS_BY_LANGUAGE[language].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLevel(value)}
                aria-pressed={level === value}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  level === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-muted">Количество карточек</span>
          <div className="flex gap-1 rounded-lg bg-surface-soft p-1">
            {COUNT_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCount(value)}
                aria-pressed={count === value}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  count === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={generateDeck.isPending}>
            Сгенерировать
          </Button>
        </div>
      </form>
    </Modal>
  )
}
