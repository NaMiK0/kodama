import { Navigate, Outlet, useLocation } from 'react-router'

import { Splash } from '@/shared/ui/Splash'

import { useMe } from '../hooks'

type LocationState = { from?: { pathname: string } }

/**
 * Оборачивает публичные маршруты (/login): уже вошедшего пользователя
 * незачем держать на форме входа — уводим его туда, откуда он попал сюда
 * (RequireAuth кладёт исходный путь в location.state), иначе на «/».
 */
export function RequireGuest() {
  const location = useLocation()
  const { data, isPending } = useMe()

  if (isPending) return <Splash />
  if (data) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  return <Outlet />
}
