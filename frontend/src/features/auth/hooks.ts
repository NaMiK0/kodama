import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api/client'

import {
  fetchMe,
  login,
  logout,
  register,
  type LoginPayload,
  type RegisterPayload,
  type User,
} from './api'

// Единый ключ для «текущий пользователь» — по нему весь интерфейс узнаёт,
// вошли мы или нет. Инвалидация этого запроса после login/register —
// единственное, что нужно, чтобы всё приложение пересчитало состояние.
export const ME_QUERY_KEY = ['auth', 'me'] as const

export function useMe() {
  // Тип расширен до User | null: после logout кладём в кеш null синхронно
  // (см. useLogout) — без этого TS не разрешит setQueryData(key, null).
  return useQuery<User | null>({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    // 401 значит «не вошли» — это не сбой сети, повторять запрос бессмысленно
    retry: (count, error) => {
      if (error instanceof ApiError && error.status === 401) return false
      return count < 2
    },
    staleTime: 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    // setQueryData(null), а НЕ invalidateQueries и НЕ removeQueries:
    // - invalidateQueries ждёт сетевой /auth/me, оставляя окно гонки — на
    //   этот момент RequireAuth (на /) и RequireGuest (на /login) читают
    //   кеш одновременно и могут увидеть РАЗНЫЕ снимки (один ещё старые
    //   данные, другой уже ошибку) и начать перенаправлять друг друга,
    //   из-за чего React бросает рендер вникуда — реально наблюдали этот баг;
    // - removeQueries просто стирает запись и НЕ запускает новый фетч для
    //   уже смонтированных наблюдателей — компонент так и остался бы висеть
    //   без данных навсегда;
    // setQueryData обновляет кеш СИНХРОННО: мы и так точно знаем результат
    // (пользователя больше нет), сетевой поход не нужен вообще.
    onSuccess: () => queryClient.setQueryData<User | null>(ME_QUERY_KEY, null),
  })
}
