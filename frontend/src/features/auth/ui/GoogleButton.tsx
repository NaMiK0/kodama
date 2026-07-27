import { googleLoginUrl } from '../api'

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export function GoogleButton() {
  return (
    <button
      type="button"
      // Полный переход, не fetch: OAuth-флоу требует настоящей навигации —
      // бэкенд сам отправит браузер на Google и обратно.
      onClick={() => {
        window.location.href = googleLoginUrl()
      }}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-sm text-ink outline-none transition-colors duration-150 hover:bg-surface-soft focus-visible:ring-4 focus-visible:ring-accent/25"
    >
      <GoogleG />
      Продолжить с Google
    </button>
  )
}
