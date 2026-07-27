import { Outlet, Route, Routes } from 'react-router'

import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AuthLayout } from '@/features/auth/ui/AuthLayout'
import { GoogleCallback } from '@/features/auth/ui/GoogleCallback'
import { Home } from '@/features/auth/ui/Home'
import { RequireAuth } from '@/features/auth/ui/RequireAuth'
import { RequireGuest } from '@/features/auth/ui/RequireGuest'
import { TokensPreview } from '@/shared/ui/TokensPreview'

import { AppShell } from './AppShell'

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

      {/* Приватные: без сессии уводим на /login. AppShell — общий каркас
          (шапка, язык, тема, выход) для ВСЕХ вложенных приватных маршрутов —
          сюда же позже встанут /decks и остальные разделы. */}
      <Route element={<RequireAuth />}>
        <Route
          element={
            <AppShell>
              <Outlet />
            </AppShell>
          }
        >
          <Route path="/" element={<Home />} />
        </Route>
      </Route>

      {/* Служебная страница проверки токенов — вне auth-контура */}
      <Route path="/tokens" element={<TokensPreview />} />

      <Route path="*" element={<Placeholder title="Страница не найдена" />} />
    </Routes>
  )
}
