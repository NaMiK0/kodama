import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/shared/api/client'

import { useLogin } from '../hooks'
import { validateEmail, validatePassword } from '../validation'
import { AuthForm } from './AuthForm'

type LocationState = { from?: { pathname: string } }

export function LoginForm({ onFlip }: { onFlip: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [formError, setFormError] = useState<string>()

  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSubmit() {
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailError(eErr)
    setPasswordError(pErr)
    setFormError(undefined)
    if (eErr || pErr) return

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          // Вернёмся туда, откуда RequireAuth нас увёл, иначе — на главную
          const from = (location.state as LocationState | null)?.from?.pathname
          navigate(from ?? '/', { replace: true })
        },
        onError: (error) => {
          // Бэкенд намеренно не уточняет, что именно неверно (email или пароль) —
          // чтобы не подсказывать, какие адреса зарегистрированы. Показываем как есть.
          setFormError(
            error instanceof ApiError ? error.detail : 'Не удалось войти. Попробуйте ещё раз',
          )
        },
      },
    )
  }

  return (
    <AuthForm
      title="Вход"
      submitLabel="Войти"
      footerPrompt="Нет аккаунта?"
      footerLink="Создать"
      onFlip={onFlip}
      email={email}
      onEmailChange={setEmail}
      emailError={emailError}
      password={password}
      onPasswordChange={setPassword}
      passwordError={passwordError}
      passwordAutoComplete="current-password"
      formError={formError}
      loading={login.isPending}
      onSubmit={handleSubmit}
    />
  )
}
