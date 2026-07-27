import { apiFetch, apiUrl } from '@/shared/api/client'

export type User = {
  id: number
  email: string
  created_at: string
}

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string }

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/auth/me')
}

export function login({ email, password }: LoginPayload): Promise<void> {
  // Бэкенд ждёт OAuth2PasswordRequestForm — form-encoded, поле логина
  // называется username (это email), не JSON.
  const body = new URLSearchParams({ username: email, password })
  return apiFetch('/auth/login', { method: 'POST', body })
}

export function register({ email, password }: RegisterPayload): Promise<User> {
  return apiFetch<User>('/auth/register', { method: 'POST', json: { email, password } })
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' })
}

export function googleLoginUrl(): string {
  return `${apiUrl}/auth/google/login`
}
