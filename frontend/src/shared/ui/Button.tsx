import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-strong',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-soft',
  ghost: 'text-ink-muted hover:bg-surface-soft hover:text-ink',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`relative inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm outline-none transition-[background-color,color,transform,box-shadow] duration-150 focus-visible:ring-4 focus-visible:ring-accent/25 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {/* Подпись остаётся в потоке даже во время загрузки: если её убрать,
          кнопка схлопнется по ширине и «дёрнет» соседние элементы. */}
      <span className={loading ? 'invisible' : undefined}>{children}</span>

      {loading && (
        <span aria-hidden className="absolute inline-flex">
          <span className="spinner size-4 rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  )
}
