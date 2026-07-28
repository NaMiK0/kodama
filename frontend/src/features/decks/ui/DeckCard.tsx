import { Link } from 'react-router'

import type { Deck } from '../api'

/**
 * Плитка колоды в списке. Сейчас — нейтральная поверхность, как остальные
 * карточки в приложении. Уровень освоения (медь/серебро/золото) добавится
 * позже как смена fill/border — структура уже готова принять это без
 * переделки разметки.
 */
export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Link
      to={`/decks/${deck.id}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-ink-subtle"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-medium text-ink">{deck.topic}</h3>
        {/* Метка сиреневая, а не акцентная: зелёный в системе значит «действие»,
            а здесь мы лишь сообщаем происхождение колоды. Нейтральный вес ещё и
            не подерётся с будущим «металлическим» покрытием по уровню освоения. */}
        {deck.source === 'ai_generated' && (
          <span
            title="Сгенерировано ИИ"
            className="shrink-0 rounded-md bg-ai-soft px-2 py-0.5 text-xs text-ai"
          >
            ✦ ИИ
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="rounded-md bg-surface-soft px-2 py-0.5 text-xs tracking-wide uppercase">
          {deck.language} · {deck.level}
        </span>
        <span>
          {deck.card_count} {deck.card_count === 1 ? 'карточка' : 'карточек'}
        </span>
      </div>
    </Link>
  )
}
