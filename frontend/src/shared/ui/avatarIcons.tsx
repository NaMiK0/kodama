/**
 * Иллюстрации фирменных аватаров — заготовки. Каждая привязана к своему
 * `AvatarId` в `avatarRegistry.ts`; подмена на финальный рисунок Никиты —
 * правка одного компонента здесь, остальной код (реестр, `Avatar`,
 * `SettingsPage`) трогать не нужно.
 *
 * Цвета фиксированы и НЕ зависят от темы (тот же приём, что у `.tier-*` и
 * панели `forest` в index.css) — это иллюстрация, а не элемент UI-хромы.
 * Проверено на обеих темах: тёмная линия/паттерн поверх светлой заливки
 * читается и на белом, и на тёмном фоне.
 */

export function SproutIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#eaf3de" />
      <path d="M24 34V22" stroke="#3b6d11" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 24c0-6 5-9 9-9 0 6-4 10-9 9Z" fill="#639922" />
      <path d="M24 26c0-5-4-8-8-8 0 5 3 9 8 8Z" fill="#7fb238" />
    </svg>
  )
}

export function LeafIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#e8f2da" />
      <path d="M24 12c8 3 12 9 12 16-8 0-14-4-16-12-1-2 0-3 4-4Z" fill="#5f8f2a" />
      <path d="M24 12c-8 3-12 9-12 16 8 0 14-4 16-12 1-2 0-3-4-4Z" fill="#84b246" />
      <path d="M24 12v24" stroke="#3b6d11" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PineIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#e3ede2" />
      <path d="M24 9l7 10h-4l6 8h-5l6 9H14l6-9h-5l6-8h-4l7-10Z" fill="#3f6b2c" />
      <rect x="22" y="36" width="4" height="5" rx="1" fill="#7c5533" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#1b2a3d" />
      <circle cx="30" cy="15" r="6" fill="#e7dfa9" />
      <path d="M29 10a6 6 0 1 0 5 8 5 5 0 0 1-5-8Z" fill="#1b2a3d" />
      <path d="M10 38c0-8 6-14 14-14s14 6 14 14H10Z" fill="#2f4a2a" />
    </svg>
  )
}

export function StoneIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#e7e4da" />
      <path
        d="M12 32c0-5 4-8 7-13 3-4 6-5 9-3 4 2 8 6 8 13 0 4-4 6-12 6s-12-1-12-3Z"
        fill="#8a8a7c"
      />
      <path d="M18 22c2-3 5-4 7-2s2 6 0 9-8 3-9-1c-1-2 0-4 2-6Z" fill="#a8a793" />
    </svg>
  )
}

export function SpiritIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#f1efe0" />
      <path
        d="M24 10c6 0 10 5 10 12 0 8-4 13-10 16-6-3-10-8-10-16 0-7 4-12 10-12Z"
        fill="#4f7a3a"
      />
      <circle cx="20" cy="21" r="1.6" fill="#1b2614" />
      <circle cx="28" cy="21" r="1.6" fill="#1b2614" />
      <path
        d="M20 27c1.5 1.5 6.5 1.5 8 0"
        stroke="#1b2614"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
