import { useState } from 'react'

import type { Deck } from '@/features/decks/api'
import { useUpdateDeck } from '@/features/decks/hooks'
import { ApiError } from '@/shared/api/client'
import { Modal } from '@/shared/ui/Modal'

import { useFolders } from '../hooks'
import { folderDepth } from '../tree'

type Props = {
  open: boolean
  onClose: () => void
  deck: Deck
}

/** Простой пикер: плоский список папок колоды (с отступом по глубине) плюс
 * «Без папки». Клик по варианту сразу переносит колоду — отдельного шага
 * подтверждения не нужно, перенос обратимый и мгновенный. */
export function MoveToFolderModal({ open, onClose, deck }: Props) {
  const { data: folders } = useFolders(deck.language)
  const updateDeck = useUpdateDeck()
  const [error, setError] = useState<string>()
  const [movingTo, setMovingTo] = useState<number | 'none'>()

  async function handlePick(folderId: number | null) {
    setError(undefined)
    setMovingTo(folderId ?? 'none')
    try {
      await updateDeck.mutateAsync({ id: deck.id, payload: { folder_id: folderId } })
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Не удалось перенести колоду')
    } finally {
      setMovingTo(undefined)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Переместить в папку">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={updateDeck.isPending}
          onClick={() => handlePick(null)}
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60 ${
            deck.folder_id === null ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          Без папки
          {movingTo === 'none' && <span className="spinner size-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent" />}
        </button>

        {folders?.map((folder) => (
          <button
            key={folder.id}
            type="button"
            disabled={updateDeck.isPending}
            onClick={() => handlePick(folder.id)}
            style={{ paddingLeft: `${0.75 + folderDepth(folders, folder) * 1.25}rem` }}
            className={`flex items-center justify-between rounded-lg py-2.5 pr-3 text-left text-sm transition-colors duration-150 hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60 ${
              deck.folder_id === folder.id ? 'text-ink' : 'text-ink-muted'
            }`}
          >
            {folder.name}
            {movingTo === folder.id && <span className="spinner size-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent" />}
          </button>
        ))}

        {folders && folders.length === 0 && (
          <p className="px-3 py-2.5 text-sm text-ink-subtle">
            Папок пока нет — создайте их в Библиотеке
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  )
}
