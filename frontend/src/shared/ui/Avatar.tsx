import { AVATARS, type AvatarId } from './avatarRegistry'

const SIZE_CLASSES = {
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-16',
} as const satisfies Record<string, string>

type AvatarProps = {
  id: AvatarId
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** Фирменный аватар — иллюстрация, не UI-хрома, см. `avatarIcons.tsx`. */
export function Avatar({ id, size = 'md', className = '' }: AvatarProps) {
  const { Component, label } = AVATARS[id]
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 overflow-hidden rounded-full ${SIZE_CLASSES[size]} ${className}`}
    >
      <Component />
    </span>
  )
}
