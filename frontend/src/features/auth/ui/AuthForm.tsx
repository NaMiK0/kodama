import type { ChangeEvent, FormEvent } from 'react'

import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

import { GoogleButton } from './GoogleButton'

type AuthFormProps = {
  title: string
  submitLabel: string
  footerPrompt: string
  footerLink: string
  onFlip: () => void

  email: string
  onEmailChange: (value: string) => void
  emailError?: string

  password: string
  onPasswordChange: (value: string) => void
  passwordError?: string
  passwordAutoComplete: 'current-password' | 'new-password'

  /** Ошибка, которая не привязана к одному полю (например, «неверный пароль») */
  formError?: string

  loading: boolean
  onSubmit: () => void
}

// Presentational-часть: вся логика (валидация, мутации, редирект) живёт
// в LoginForm/RegisterForm. Здесь — только вёрстка и контролируемые поля.
export function AuthForm({
  title,
  submitLabel,
  footerPrompt,
  footerLink,
  onFlip,
  email,
  onEmailChange,
  emailError,
  password,
  onPasswordChange,
  passwordError,
  passwordAutoComplete,
  formError,
  loading,
  onSubmit,
}: AuthFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      // noValidate отключает браузерные пузыри-подсказки. Проверяем сами
      // и показываем через наш TextField error — единый вид во всех браузерах.
      noValidate
      className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-8 shadow-card"
    >
      <h1 className="text-xl font-medium">{title}</h1>

      <div className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
          error={emailError}
        />
        <TextField
          label="Пароль"
          type="password"
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
          error={passwordError}
        />
      </div>

      {/* Ошибка формы целиком (не привязана к полю) — например, неверная пара
          email/пароль: непонятно, какое из полей винить, поэтому баннер. */}
      {formError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" loading={loading}>
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
