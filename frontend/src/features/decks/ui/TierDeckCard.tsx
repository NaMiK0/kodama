import { Link } from 'react-router'

import type { CollectionEntry, DeckTier } from '../api'

const TIER_LABELS: Record<DeckTier, string> = {
  bronze: 'Медь',
  silver: 'Серебро',
  gold: 'Золото',
}

// Цвет самой метки-подписи (не покрытия — оно живёт в CSS, см. index.css
// .tier-*) — совпадает по тону, чтобы бейдж читался как часть той же плитки.
// dark: — та же логика, что у семантических токенов в index.css: на тёмном
// фоне цвет метки берём светлее, иначе контраст проседает (особенно у
// серебра — его нейтральный серый на тёмном фоне сливался с подложкой).
const TIER_LABEL_CLASSES: Record<DeckTier, string> = {
  bronze: 'bg-[#b87333]/20 text-[#8a5622] dark:bg-[#b87333]/25 dark:text-[#e8a878]',
  silver: 'bg-[#b9bec4]/25 text-[#5c6268] dark:bg-[#b9bec4]/25 dark:text-[#e4e7ea]',
  gold: 'bg-[#d4af37]/20 text-[#8a6b1e] dark:bg-[#d4af37]/25 dark:text-[#f0d989]',
}

/** Плитка полностью разобранной и выученной колоды — с металлическим
 * покрытием по тиру (см. DeckCard для обычной, непокрытой версии). */
export function TierDeckCard({ entry }: { entry: CollectionEntry }) {
  const { deck, tier } = entry

  return (
    <Link
      to={`/decks/${deck.id}`}
      className={`tier-plate tier-${tier} flex flex-col gap-3 rounded-xl border p-5 shadow-card transition-colors hover:brightness-105`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-medium text-ink">{deck.topic}</h3>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${TIER_LABEL_CLASSES[tier]}`}
        >
          {TIER_LABELS[tier]}
        </span>
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
