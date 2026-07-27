import { useMe } from '../hooks'

/**
 * Временная домашняя страница — заготовка для настоящего дашборда.
 * Обёртка (шапка, тема, выход) теперь в AppShell — здесь только содержимое.
 */
export function Home() {
  const { data: user } = useMe()

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-24">
      <p className="font-jp text-3xl text-ink-subtle select-none">木霊</p>
      <p className="text-lg text-ink">
        Вы вошли как <span className="font-medium">{user?.email}</span>
      </p>
    </div>
  )
}
