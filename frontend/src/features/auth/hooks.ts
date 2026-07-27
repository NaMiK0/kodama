import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api/client'

import { fetchMe, login, logout, register, type LoginPayload, type RegisterPayload } from './api'

// Единый ключ для «текущий пользователь» — по нему весь интерфейс узнаёт,
// вошли мы или нет. Инвалидация этого запроса после login/register/logout —
// единственное, что нужно, чтобы всё приложение пересчитало состояние.
export const ME_QUERY_KEY = ['auth', 'me'] as const

export function useMe() {
  return useQuery({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  })
}
