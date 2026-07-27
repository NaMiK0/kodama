import { type FormEvent } from 'react'

import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

import { GoogleButton } from './GoogleButton'

type AuthFormProps = {
  title: string
  submitLabel: string
  footerPrompt: string
  footerLink: string
  // Подсказка автозаполнению: пароль вводят или существующий, или новый
  passwordAutoComplete: 'current-password' | 'new-password'
  onFlip: () => void
}

// Одна форма на вход И регистрацию: структура идентична, различаются подписи.
// Это заодно гарантирует одинаковую высоту сторон — важно для переворота.
export function AuthForm({
  title,
  submitLabel,
  footerPrompt,
  footerLink,
  passwordAutoComplete,
  onFlip,
}: AuthFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Отправку подключим на следующей стадии — сейчас только оболочка
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-8 shadow-card"
    >
      <h1 className="text-xl font-medium">{title}</h1>

      <div className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
        <TextField
          label="Пароль"
          type="password"
          autoComplete={passwordAutoComplete}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>

      <div className="flex items-center gap-3 text-xs text-ink-subtle">
        <span className="h-px flex-1 bg-line" />
        или
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-ink-muted">
        {footerPrompt}{' '}
        <button
          type="button"
          onClick={onFlip}
          className="rounded text-accent-strong underline-offset-2 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-accent/25"
        >
          {footerLink}
        </button>
      </p>
    </form>
  )
}
