import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/shared/api/client'

import { useLogin, useRegister } from '../hooks'
import { validateEmail, validatePassword } from '../validation'
import { AuthForm } from './AuthForm'

type LocationState = { from?: { pathname: string } }

const PASSWORD_MIN_LENGTH = 8 // совпадает с ограничением на бэкенде

export function RegisterForm({ onFlip }: { onFlip: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  // Отдельный флаг: между «аккаунт создан» и «вход выполнен» идёт вторая
  // мутация, и кнопка должна оставаться в состоянии загрузки всё это время.
  const [signingIn, setSigningIn] = useState(false)

  const registerMutation = useRegister()
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  // async/await через mutateAsync — рекомендованный паттерн TanStack Query
  // именно для ПОСЛЕДОВАТЕЛЬНЫХ зависимых мутаций (вторая зависит от первой).
  // Вложенные .mutate(vars, { onSuccess }) друг в друге для такого случая
  // не подходят: колбэк внутренней мутации может не сработать так, как
  // ожидается, когда его сам вызывает колбэк внешней.
  async function handleSubmit() {
    const eErr = validateEmail(email)
    const pErr = validatePassword(password, PASSWORD_MIN_LENGTH)
    setEmailError(eErr)
    setPasswordError(pErr)
    setFormError(undefined)
    if (eErr || pErr) return

    try {
      await registerMutation.mutateAsync({ email, password })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // «Email уже занят» — это про конкретное поле, не про форму целиком
        setEmailError(error.detail)
      } else {
        setFormError(error instanceof ApiError ? error.detail : 'Не удалось создать аккаунт')
      }
      return
    }

    // По решению продукта: не отправляем только что зарегистрированного
    // человека на форму входа — логиним его сразу теми же данными.
    setSigningIn(true)
    try {
      await loginMutation.mutateAsync({ email, password })
      const from = (location.state as LocationState | null)?.from?.pathname
      navigate(from ?? '/', { replace: true })
    } catch {
      // Редкий случай: аккаунт создан, а автовход не удался
      setSigningIn(false)
      setFormError('Аккаунт создан. Войдите с указанным паролем')
    }
  }

  return (
    <AuthForm
      title="Регистрация"
      submitLabel="Создать аккаунт"
      footerPrompt="Уже есть аккаунт?"
      footerLink="Войти"
      onFlip={onFlip}
      email={email}
      onEmailChange={setEmail}
      emailError={emailError}
      password={password}
      onPasswordChange={setPassword}
      passwordError={passwordError}
      passwordAutoComplete="new-password"
      formError={formError}
      loading={registerMutation.isPending || signingIn}
      onSubmit={handleSubmit}
    />
  )
}
