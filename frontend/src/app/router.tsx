import { Route, Routes } from 'react-router'

import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AuthLayout } from '@/features/auth/ui/AuthLayout'
import { GoogleCallback } from '@/features/auth/ui/GoogleCallback'
import { RequireAuth } from '@/features/auth/ui/RequireAuth'
import { RequireGuest } from '@/features/auth/ui/RequireGuest'
import { TokensPreview } from '@/shared/ui/TokensPreview'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-lg text-ink-muted">{title}</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      {/* Публичные: уже вошедшего уводим на приватную часть */}
      <Route element={<RequireGuest />}>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <AuthCard />
            </AuthLayout>
          }
        />
      </Route>

      {/* Сюда редиректит бэкенд после успешного входа через Google */}
      <Route path="/auth/callback" element={<GoogleCallback />} />

      {/* Приватные: без сессии уводим на /login */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Placeholder title="Kodama — здесь будет главная" />} />
      </Route>

      {/* Служебная страница проверки токенов — вне auth-контура */}
      <Route path="/tokens" element={<TokensPreview />} />

      <Route path="*" element={<Placeholder title="Страница не найдена" />} />
    </Routes>
  )
}
