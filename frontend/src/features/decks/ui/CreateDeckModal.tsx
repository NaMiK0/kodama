import { useState, type FormEvent } from 'react'

import { ApiError } from '@/shared/api/client'
import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { TextField } from '@/shared/ui/TextField'

import { LEVELS_BY_LANGUAGE, LANGUAGE_NAMES } from '../api'
import { useCreateDeck } from '../hooks'

type Props = { open: boolean; onClose: () => void }

export function CreateDeckModal({ open, onClose }: Props) {
  // Язык — измерение всего приложения, а не поле формы: колода всегда
  // создаётся на том языке, который выбран в шапке. Иначе можно было
  // создать японскую колоду в английском режиме — и она тут же исчезала бы
  // из отфильтрованного списка.
  const { language } = useLanguage()

  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<string>(LEVELS_BY_LANGUAGE[language][0])
  const [topicError, setTopicError] = useState<string>()
  const [formError, setFormError] = useState<string>()

  const createDeck = useCreateDeck()

  function handleClose() {
    // Чистим форму при закрытии — иначе повторное открытие покажет
    // недописанные данные от прошлого раза
    setTopic('')
    setLevel(LEVELS_BY_LANGUAGE[language][0])
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
    setTopicError(undefined)
    setFormError(undefined)

    try {
      await createDeck.mutateAsync({ topic, language, level })
      handleClose()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : 'Не удалось создать колоду')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Новая колода">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Тема"
          placeholder="Например, IT-лексика"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          error={topicError}
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-muted">Язык</span>
          <p className="text-ink">{LANGUAGE_NAMES[language]}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-muted">Уровень</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-11 rounded-lg border border-line bg-surface px-3.5 text-ink outline-none transition-[border-color,box-shadow] duration-150 hover:border-ink-subtle focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15"
          >
            {LEVELS_BY_LANGUAGE[language].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={createDeck.isPending}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  )
}
