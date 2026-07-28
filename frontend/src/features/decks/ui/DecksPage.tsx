import { useEffect, useState } from 'react'

import { useGenerationJobs } from '@/features/ai/hooks'
import { GenerateDeckModal } from '@/features/ai/ui/GenerateDeckModal'
import { GeneratingDeckCard } from '@/features/ai/ui/GeneratingDeckCard'
import { StudyEntry } from '@/features/study/ui/StudyEntry'
import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'

import { useDecks } from '../hooks'
import { CreateDeckModal } from './CreateDeckModal'
import { DeckCard } from './DeckCard'

const LANGUAGE_NAMES = { en: 'английскому', ja: 'японскому' } as const
const PAGE_SIZE = 24

/**
 * Один экран на оба состояния: пустое и со списком. Не два разных
 * маршрута — меньше кода, предсказуемее поведение.
 */
export function DecksPage() {
  const { language } = useLanguage()
  const [limit, setLimit] = useState(PAGE_SIZE)

  // Лимит принадлежит конкретному языку: переключились — начинаем с первой
  // страницы, а не тащим за собой «показать ещё» с другого списка.
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [language])

  const { data: decks, isPending, isFetching } = useDecks(language, limit)
  const [modalOpen, setModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)

  const { entries: generationJobs, canGenerate, addJob, dismissJob, replaceJob } =
    useGenerationJobs(language)

  const hasContent = (decks && decks.length > 0) || generationJobs.length > 0

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Мои колоды</h1>
        <div className="flex gap-2">
          <Button
            variant="ai"
            disabled={!canGenerate}
            title={canGenerate ? undefined : 'Уже генерируются 3 колоды'}
            onClick={() => setGenerateModalOpen(true)}
          >
            <span aria-hidden className="mr-1.5">
              ✦
            </span>
            Сгенерировать с ИИ
          </Button>
          <Button onClick={() => setModalOpen(true)}>Создать колоду</Button>
        </div>
      </div>

      <StudyEntry />

      {isPending ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : hasContent ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generationJobs.map((entry) => (
              <GeneratingDeckCard
                key={entry.jobId}
                entry={entry}
                canGenerate={canGenerate}
                onDismiss={dismissJob}
                onReplace={replaceJob}
              />
            ))}
            {decks?.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>

          {/* limit достигнут — значит, могли остаться ещё колоды за границей
              страницы (неточная эвристика: если их ровно limit, кнопка
              покажется и отдаст пустое продолжение — не страшно). */}
          {decks && decks.length === limit && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                loading={isFetching}
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              >
                Показать ещё
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <p className="font-jp text-3xl text-ink-subtle select-none">木霊</p>
          {/* Уточняем язык: список отфильтрован, и без этого «колод пока нет»
              сбивало бы с толку того, у кого есть колоды на другом языке. */}
          <p className="text-ink-muted">Колод по {LANGUAGE_NAMES[language]} пока нет</p>
          <Button onClick={() => setModalOpen(true)}>Создать первую колоду</Button>
        </div>
      )}

      <CreateDeckModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <GenerateDeckModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        canGenerate={canGenerate}
        onCreated={addJob}
      />
    </div>
  )
}
