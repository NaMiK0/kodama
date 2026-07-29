import type { Card } from '../api'

type Props = { card: Card; onEdit: () => void; onDelete: () => void }

export function CardRow({ card, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-ink">{card.word}</span>
          {card.reference !== card.word && (
            <span className="text-sm text-ink-subtle">{card.reference}</span>
          )}
        </div>
        <span className="text-sm text-ink-muted">{card.translation}</span>
        {card.example_sentence && (
          <span className="mt-1 text-sm text-ink-subtle italic">{card.example_sentence}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Редактировать карточку"
          className="rounded-md p-1.5 text-ink-subtle transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM10.929 6.243 3 14.172V17h2.828l7.929-7.929-2.828-2.828Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить карточку"
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
