import type { Folder } from './api'

/**
 * Список папок приходит с бэкенда плоским (см. GET /folders) — дерево строим
 * на клиенте через parent_folder_id. Здесь только чистые функции без React,
 * чтобы их было легко переиспользовать и в LibraryPage, и в модалках.
 */

export function foldersById(folders: Folder[]): Map<number, Folder> {
  return new Map(folders.map((folder) => [folder.id, folder]))
}

/** Цепочка предков от корня к текущей папке — для хлебных крошек. */
export function ancestorChain(folders: Folder[], currentId: number | null): Folder[] {
  const byId = foldersById(folders)
  const chain: Folder[] = []

  let cursor = currentId
  while (cursor !== null) {
    const folder = byId.get(cursor)
    if (!folder) break
    chain.unshift(folder)
    cursor = folder.parent_folder_id
  }

  return chain
}

/** Глубина папки (корень = 0) — для лёгкого отступа в плоском списке пикера. */
export function folderDepth(folders: Folder[], folder: Folder): number {
  return ancestorChain(folders, folder.parent_folder_id).length
}
