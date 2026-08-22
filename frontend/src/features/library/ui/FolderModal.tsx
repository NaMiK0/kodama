import { useEffect, useState, type FormEvent } from 'react'

import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { TextField } from '@/shared/ui/TextField'

import type { Folder } from '../api'
import { useCreateFolder, useUpdateFolder } from '../hooks'

type Props =
  | {
      mode: 'create'
      open: boolean
      onClose: () => void
      language: Folder['language']
      parentFolderId: number | null
    }
  | {
      mode: 'rename'
      open: boolean
      onClose: () => void
      folder: Folder
    }

/**
 * Одна форма на создание и переименование папки — обе состоят из одного
 * и того же поля «название», разводить их на два файла было бы чистым
 * дублированием.
 */
export function FolderModal(props: Props) {
  const { mode, open, onClose } = props

  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const pending = mode === 'create' ? createFolder.isPending : updateFolder.isPending

  // Открыли модалку переименования — подставляем текущее имя. Создание
  // всегда стартует с пустой строки.
  useEffect(() => {
    if (!open) return
    setName(mode === 'rename' ? props.folder.name : '')
    setError(undefined)
  }, [open, mode, props])

  function handleClose() {
    setName('')
    setError(undefined)
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите название папки')
      return
    }
    setError(undefined)

    try {
      if (mode === 'create') {
        await createFolder.mutateAsync({
          name: trimmed,
          language: props.language,
          parent_folder_id: props.parentFolderId,
        })
      } else {
        await updateFolder.mutateAsync({ id: props.folder.id, payload: { name: trimmed } })
      }
      handleClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Не удалось сохранить папку')
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === 'create' ? 'Новая папка' : 'Переименовать папку'}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Название"
          placeholder="Например, Учебник Genki"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error}
          autoFocus
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={pending}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
