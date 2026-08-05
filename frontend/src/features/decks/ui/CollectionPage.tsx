import { useLanguage } from '@/shared/lib/LanguageProvider'

import { useCollection } from '../hooks'
import { TierDeckCard } from './TierDeckCard'

const LANGUAGE_NAMES = { en: 'английскому', ja: 'японскому' } as const

/** Витрина полностью разобранных и выученных колод — мотивационный экран,
 * не рабочий список (для него есть DecksPage). Колода появляется здесь
 * только когда у каждой её карточки есть прогресс (см. get_collection на
 * бэкенде) — недоразобранные молча не показываются, без «0% готовности». */
export function CollectionPage() {
  const { language } = useLanguage()
  const { data: entries, isPending } = useCollection(language)

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-xl font-medium text-ink">Коллекция</h1>

      {isPending ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : entries && entries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <TierDeckCard key={entry.deck.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <p className="font-jp text-3xl text-ink-subtle select-none">木霊</p>
          <p className="text-ink-muted">
            Пока нет ни одной полностью разобранной колоды по {LANGUAGE_NAMES[language]}
          </p>
          <p className="max-w-sm text-sm text-ink-subtle">
            Разберите колоду целиком — она появится здесь с медным, серебряным или золотым
            покрытием, в зависимости от того, насколько уверенно вы её знаете
          </p>
        </div>
      )}
    </div>
  )
}
