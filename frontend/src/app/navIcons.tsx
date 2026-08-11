/** Иконки пунктов сайдбара — отдельно от `navigation.ts`, чтобы файл с
 * данными и файл с компонентами не смешивались (иначе oxlint не может
 * определить границы Fast Refresh). */

export function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function CollectionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </svg>
  )
}

export function LibraryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a1.5 1.5 0 0 1 1.5 1.5V20H5.5A1.5 1.5 0 0 1 4 18.5V5.5Z" />
      <path d="M13 6.2 17.7 4.6a1.5 1.5 0 0 1 1.94.88l4 11a1.5 1.5 0 0 1-.9 1.92l-1.4.5" />
      <path d="M11.5 20H19a1.5 1.5 0 0 0 1.5-1.5" />
    </svg>
  )
}

export function StatsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function PronunciationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  )
}
