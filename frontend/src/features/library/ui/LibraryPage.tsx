import { useState } from 'react'
import { Link, useParams } from 'react-router'

import type { Deck } from '@/features/decks/api'
import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Logomark } from '@/shared/ui/Logomark'

import type { Folder } from '../api'
import { useDeleteFolder, useFolders, useLibraryDecks } from '../hooks'
import { ancestorChain } from '../tree'
import { FolderModal } from './FolderModal'
import { FolderRow } from './FolderRow'
import { LibraryDeckRow } from './LibraryDeckRow'
import { MoveToFolderModal } from './MoveToFolderModal'

const LANGUAGE_NAMES = { en: 'английскому', ja: 'японскому' } as const

/**
 * Библиотека: колоды, организованные в папки (с подпапками). Один уровень
 * дерева на экран — как в файловом менеджере: хлебные крошки наверх,
 * подпапки и колоды текущего уровня внизу. Список папок с бэкенда плоский
 * (см. features/library/api.ts) — дерево и цепочка предков строятся здесь.
 */
export function LibraryPage() {
  const { language } = useLanguage()
  const { folderId: folderIdParam } = useParams<{ folderId?: string }>()

  // Некорректный/отсутствующий параметр читаем как корень — так безопаснее,
  // чем падать на NaN.
  const parsedId = folderIdParam ? Number(folderIdParam) : NaN
  const currentFolderId = Number.isFinite(parsedId) ? parsedId : null

  const { data: folders, isPending: foldersPending } = useFolders(language)
  const { data: decks, isPending: decksPending } = useLibraryDecks(
    language,
    currentFolderId ?? 'none',
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<Folder>()
  const [deletingFolder, setDeletingFolder] = useState<Folder>()
  const [movingDeck, setMovingDeck] = useState<Deck>()

  const deleteFolder = useDeleteFolder()

  const isPending = foldersPending || decksPending
  const ancestors = ancestorChain(folders ?? [], currentFolderId)
  const subfolders = (folders ?? []).filter((f) => f.parent_folder_id === currentFolderId)
  const hasContent = subfolders.length > 0 || (decks?.length ?? 0) > 0

  async function handleConfirmDelete() {
    if (!deletingFolder) return
    await deleteFolder.mutateAsync(deletingFolder.id)
    setDeletingFolder(undefined)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <Link to="/library" className="hover:text-ink">
          Библиотека
        </Link>
        {ancestors.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <Link to={`/library/${folder.id}`} className="hover:text-ink">
              {folder.name}
            </Link>
          </span>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-ink">
          {ancestors.at(-1)?.name ?? 'Библиотека'}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>Создать папку</Button>
      </div>

      {isPending ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : hasContent ? (
        <div className="flex flex-col gap-3">
          {subfolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onRename={() => setRenamingFolder(folder)}
              onDelete={() => setDeletingFolder(folder)}
            />
          ))}
          {decks?.map((deck) => (
            <LibraryDeckRow key={deck.id} deck={deck} onMove={() => setMovingDeck(deck)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <Logomark className="size-14" />
          <p className="text-ink-muted">
            {ancestors.length > 0
              ? 'В этой папке пока пусто'
              : `Библиотека по ${LANGUAGE_NAMES[language]} пока пуста`}
          </p>
          <Button onClick={() => setCreateOpen(true)}>Создать папку</Button>
        </div>
      )}

      <FolderModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        language={language}
        parentFolderId={currentFolderId}
      />

      {renamingFolder && (
        <FolderModal
          mode="rename"
          open={renamingFolder !== undefined}
          onClose={() => setRenamingFolder(undefined)}
          folder={renamingFolder}
        />
      )}

      <ConfirmModal
        open={deletingFolder !== undefined}
        onClose={() => setDeletingFolder(undefined)}
        onConfirm={handleConfirmDelete}
        title="Удалить папку?"
        description={`«${deletingFolder?.name}» будет удалена, но её содержимое не пропадёт — подпапки и колоды переместятся на уровень выше.`}
        confirmLabel="Удалить"
        loading={deleteFolder.isPending}
      />

      {movingDeck && (
        <MoveToFolderModal
          open={movingDeck !== undefined}
          onClose={() => setMovingDeck(undefined)}
          deck={movingDeck}
        />
      )}
    </div>
  )
}
