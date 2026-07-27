import { Button } from '@/shared/ui/Button'

import { useLogout, useMe } from '../hooks'

/**
 * Временная домашняя страница — заготовка для настоящего дашборда.
 * Задача сейчас: замкнуть цикл авторизации end-to-end на реальном UI
 * (не только в консоли) и оставить рабочую точку для выхода из аккаунта.
 */
export function Home() {
  // К этому моменту RequireAuth уже гарантировал, что сессия есть —
  // данные почти наверняка в кеше и придут без повторного похода в сеть.
  const { data: user } = useMe()
  const logout = useLogout()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6">
      <div className="text-center">
        <p className="font-jp text-3xl text-ink-subtle select-none">木霊</p>
        <p className="mt-4 text-lg text-ink">
          Вы вошли как <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      <Button
        variant="secondary"
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Выйти
      </Button>
    </div>
  )
}
