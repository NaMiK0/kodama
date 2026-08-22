import { apiFetch } from '@/shared/api/client'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

// Совпадает с FolderRead на бэкенде (app/modules/library/schemas.py).
// Отличается от исходного контракта: там не user_id (сервер не отдаёт его
// в ответе), а created_at — сюда его не тащим, фронту он пока не нужен.
export type Folder = {
  id: number
  language: StudyLanguage
  name: string
  parent_folder_id: number | null
}

export type FolderCreatePayload = {
  name: string
  language: StudyLanguage
  parent_folder_id?: number | null
}

export type FolderUpdatePayload = Partial<{
  name: string
  parent_folder_id: number | null
}>

export function fetchFolders(language: StudyLanguage): Promise<Folder[]> {
  return apiFetch<Folder[]>(`/folders?language=${language}`)
}

export function createFolder(payload: FolderCreatePayload): Promise<Folder> {
  return apiFetch<Folder>('/folders', { method: 'POST', json: payload })
}

export function updateFolder(id: number, payload: FolderUpdatePayload): Promise<Folder> {
  return apiFetch<Folder>(`/folders/${id}`, { method: 'PATCH', json: payload })
}

// Бэкенд не каскадирует удаление: прямые подпапки и колоды поднимаются на
// уровень выше. UI ничего специально доделывать не должен — только
// перезапросить списки после удаления (см. useDeleteFolder).
export function deleteFolder(id: number): Promise<void> {
  return apiFetch(`/folders/${id}`, { method: 'DELETE' })
}
