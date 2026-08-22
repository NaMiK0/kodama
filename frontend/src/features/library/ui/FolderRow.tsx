import type { KeyboardEvent, MouseEvent } from 'react'
import { useNavigate } from 'react-router'

import type { Folder } from '../api'

type Props = {
  folder: Folder
  onRename: () => void
  onDelete: () => void
}

/** Строка папки в Библиотеке: клик по строке заходит внутрь, кнопки справа —
 * переименование и удаление. Тот же паттерн ряда, что у CardRow (не Link
 * целиком, а div с обработчиком, чтобы кнопки не оказались вложенными
 * интерактивными элементами внутри ссылки). */
export function FolderRow({ folder, onRename, onDelete }: Props) {
  const navigate = useNavigate()

  function handleOpen() {
    navigate(`/library/${folder.id}`)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpen()
    }
  }

  function stopRowClick(event: MouseEvent) {
    event.stopPropagation()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-ink-subtle"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="size-5 shrink-0 text-ink-subtle"
        >
          <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4.379a1.5 1.5 0 0 1 1.06.44l1.122 1.12a.5.5 0 0 0 .354.147H16.5A1.5 1.5 0 0 1 18 7.207V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5v-9Z" />
        </svg>
        <span className="truncate font-medium text-ink">{folder.name}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1" onClick={stopRowClick}>
        <button
          type="button"
          onClick={onRename}
          aria-label="Переименовать папку"
          className="rounded-md p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM10.929 6.243 3 14.172V17h2.828l7.929-7.929-2.828-2.828Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить папку"
          className="rounded-md p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
