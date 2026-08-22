import { Link } from 'react-router'

import type { Deck } from '@/features/decks/api'

type Props = {
  deck: Deck
  onMove: () => void
}

/** Строка колоды внутри Библиотеки. Основная область — обычная ссылка на
 * колоду (как DeckCard); кнопка «Переместить» — соседний элемент, а не
 * вложенный в Link, чтобы не получить интерактивный элемент внутри ссылки. */
export function LibraryDeckRow({ deck, onMove }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-ink-subtle">
      <Link to={`/decks/${deck.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <h3 className="truncate font-medium text-ink">{deck.topic}</h3>
        <span className="shrink-0 rounded-md bg-surface-soft px-2 py-0.5 text-xs tracking-wide text-ink-muted uppercase">
          {deck.language} · {deck.level}
        </span>
        <span className="shrink-0 text-sm text-ink-muted">
          {deck.card_count} {deck.card_count === 1 ? 'карточка' : 'карточек'}
        </span>
      </Link>

      <button
        type="button"
        onClick={onMove}
        className="shrink-0 rounded-md px-2.5 py-1.5 text-sm text-ink-subtle transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
      >
        Переместить
      </button>
    </div>
  )
}
