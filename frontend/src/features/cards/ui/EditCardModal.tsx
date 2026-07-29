import { useEffect, useState, type FormEvent } from 'react'

import type { StudyLanguage } from '@/shared/lib/LanguageProvider'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

import type { Card } from '../api'
import { useUpdateCard } from '../hooks'
import { CardEntryRow, type CardEntryRowValue } from './CardEntryRow'

type Props = {
  card: Card | undefined
  onClose: () => void
  deckId: number
  language: StudyLanguage
}

function rowFromCard(card: Card): CardEntryRowValue {
  return {
    key: String(card.id),
    word: card.word,
    translation: card.translation,
    reference: card.reference,
    exampleSentence: card.example_sentence ?? '',
    showExample: Boolean(card.example_sentence),
  }
}

export function EditCardModal({ card, onClose, deckId, language }: Props) {
  const [row, setRow] = useState<CardEntryRowValue>(() => card ? rowFromCard(card) : {
    key: '',
    word: '',
    translation: '',
    reference: '',
    exampleSentence: '',
    showExample: false,
  })
  const [formError, setFormError] = useState<string>()

  const updateCard = useUpdateCard(deckId)

  // Карточка меняется между открытиями модалки (разные card.id) — форма должна
  // подхватывать новые данные, а не оставлять значения от предыдущей карточки.
  useEffect(() => {
    if (card) setRow(rowFromCard(card))
    setFormError(undefined)
  }, [card])

  function handleClose() {
    setFormError(undefined)
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!card) return

    const word = row.word.trim()
    const translation = row.translation.trim()
    const reference = row.reference.trim()

    if (!word || !translation || (language === 'ja' && !reference)) {
      setRow((prev) => ({
        ...prev,
        error:
          language === 'ja' && !reference ? 'Укажите слово, перевод и чтение' : 'Укажите слово и перевод',
      }))
      return
    }

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        payload: {
          word,
          translation,
          // В отличие от создания, PATCH не авто-заполняет reference для EN —
          // сервис трогает поле только если оно явно пришло в запросе. Не послать
          // его здесь оставит старое значение и разъедет reference с новым word.
          reference: language === 'ja' ? reference : word,
          // Тоже нужно слать всегда, а не только когда непусто: сервис пишет
          // example_sentence лишь при data.example_sentence is not None — стёртый
          // пример (пустая строка) — валидное значение "not None" и дойдёт до базы,
          // а вот пропуск поля оставит в базе старый текст.
          example_sentence: row.exampleSentence.trim(),
        },
      })
      handleClose()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : 'Не удалось сохранить карточку')
    }
  }

  return (
    <Modal open={card !== undefined} onClose={handleClose} title="Редактировать карточку" widthClassName="max-w-xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <CardEntryRow
          row={row}
          language={language}
          onChange={(patch) => setRow((prev) => ({ ...prev, ...patch, error: undefined }))}
          onRemove={() => {}}
          canRemove={false}
          autoFocus
        />

        {formError && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={updateCard.isPending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  )
}
