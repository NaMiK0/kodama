import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchDecksInFolder } from '@/features/decks/api'
import { DECKS_QUERY_KEY } from '@/features/decks/hooks'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

import {
  createFolder,
  deleteFolder,
  fetchFolders,
  updateFolder,
  type Folder,
  type FolderCreatePayload,
  type FolderUpdatePayload,
} from './api'

export const FOLDERS_QUERY_KEY = ['folders'] as const

export function foldersListKey(language: StudyLanguage) {
  return [...FOLDERS_QUERY_KEY, 'list', language] as const
}

export function useFolders(language: StudyLanguage) {
  return useQuery({
    queryKey: foldersListKey(language),
    queryFn: () => fetchFolders(language),
  })
}

// Продолжает префикс ['decks'] у декового фичи (не свой собственный) —
// перенос/удаление колоды или папки инвалидирует DECKS_QUERY_KEY целиком,
// и этот срез сбрасывается вместе с обычным списком колод, без отдельного
// вызова инвалидации на каждый срез по папке.
export function libraryDecksKey(language: StudyLanguage, folderId: number | 'none') {
  return [...DECKS_QUERY_KEY, 'library', language, folderId] as const
}

export function useLibraryDecks(language: StudyLanguage, folderId: number | 'none') {
  return useQuery({
    queryKey: libraryDecksKey(language, folderId),
    queryFn: () => fetchDecksInFolder(language, folderId),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FolderCreatePayload) => createFolder(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY }),
  })
}

// Тот же PATCH обслуживает и переименование, и перенос в другую родительскую
// папку (parent_folder_id) — оба меняют дерево, поэтому инвалидируем и папки,
// и колоды разом: перенос папки меняет состав видимого содержимого её
// бывшего и нового родителя.
export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FolderUpdatePayload }) =>
      updateFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY })
    },
  })
}

// Удаление поднимает содержимое папки на уровень выше (см. api.ts) —
// затрагивает и папки, и колоды, поэтому инвалидируем оба списка.
export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DECKS_QUERY_KEY })
    },
  })
}

export type { Folder }
