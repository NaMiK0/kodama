import { Navigate, Outlet, useLocation } from 'react-router'

import { Splash } from '@/shared/ui/Splash'

import { useMe } from '../hooks'

/**
 * Оборачивает приватные маршруты. Пока идёт запрос /auth/me — сплэш,
 * не форма входа: иначе на каждой перезагрузке залогиненный человек
 * на миг увидел бы экран входа.
 */
export function RequireAuth() {
  const location = useLocation()
  const { data, isPending, isError } = useMe()

  if (isPending) return <Splash />
  if (isError || !data) {
    // Запоминаем, откуда пришли — после входа вернёмся сюда же
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
