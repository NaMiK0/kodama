import { apiFetch, apiUrl } from '@/shared/api/client'
import type { AvatarId } from '@/shared/ui/avatarRegistry'

export type User = {
  id: number
  email: string
  created_at: string
  offer_pronunciation: boolean
  new_cards_daily_limit: number
  avatar_id: AvatarId
}

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string }
export type UserSettingsUpdate = {
  offer_pronunciation?: boolean
  new_cards_daily_limit?: number
  avatar_id?: AvatarId
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/auth/me')
}

export function updateSettings(payload: UserSettingsUpdate): Promise<User> {
  return apiFetch<User>('/auth/me/settings', { method: 'PATCH', json: payload })
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
