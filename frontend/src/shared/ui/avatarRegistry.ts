import type { ReactNode } from 'react'

import {
  LeafIcon,
  MoonIcon,
  PineIcon,
  SpiritIcon,
  SproutIcon,
  StoneIcon,
} from './avatarIcons'

/**
 * Идентификаторы совпадают с бэкендом (`User.avatar_id`) — не переименовывать
 * без согласования схемы. Значение по умолчанию там же: `sprout`.
 */
export type AvatarId = 'sprout' | 'leaf' | 'pine' | 'moon' | 'stone' | 'spirit'

type AvatarEntry = {
  label: string
  Component: () => ReactNode
}

export const AVATARS = {
  sprout: { label: 'Росток', Component: SproutIcon },
  leaf: { label: 'Лист', Component: LeafIcon },
  pine: { label: 'Хвоя', Component: PineIcon },
  moon: { label: 'Луна над кроной', Component: MoonIcon },
  stone: { label: 'Камень', Component: StoneIcon },
  spirit: { label: 'Дух дерева', Component: SpiritIcon },
} as const satisfies Record<AvatarId, AvatarEntry>

export const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[]
