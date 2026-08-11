import { Outlet, Route, Routes } from 'react-router'

import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AuthLayout } from '@/features/auth/ui/AuthLayout'
import { GoogleCallback } from '@/features/auth/ui/GoogleCallback'
import { RequireAuth } from '@/features/auth/ui/RequireAuth'
import { RequireGuest } from '@/features/auth/ui/RequireGuest'
import { SettingsPage } from '@/features/auth/ui/SettingsPage'
import { CollectionPage } from '@/features/decks/ui/CollectionPage'
import { DeckDetailPage } from '@/features/decks/ui/DeckDetailPage'
import { DecksPage } from '@/features/decks/ui/DecksPage'
import { StudySessionPage } from '@/features/study/ui/StudySessionPage'
import { TriagePage } from '@/features/study/ui/TriagePage'
import { TokensPreview } from '@/shared/ui/TokensPreview'

import { AppShell } from './AppShell'
import { ComingSoonPage } from './ComingSoonPage'

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
          (шапка, язык, тема, выход) для ВСЕХ вложенных приватных маршрутов. */}
      <Route element={<RequireAuth />}>
        <Route
          element={
            <AppShell>
              <Outlet />
            </AppShell>
          }
        >
          <Route path="/" element={<DecksPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/decks/:deckId" element={<DeckDetailPage />} />
          <Route path="/decks/:deckId/triage" element={<TriagePage />} />
          <Route path="/study" element={<StudySessionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Разделы сайдбара, которые ещё не начаты — известная секция или
              нет, решает ComingSoonPage сама (см. isComingSoonSection). */}
          <Route path="/soon/:section" element={<ComingSoonPage />} />
        </Route>
      </Route>

      {/* Служебная страница проверки токенов — вне auth-контура */}
      <Route path="/tokens" element={<TokensPreview />} />

      <Route path="*" element={<Placeholder title="Страница не найдена" />} />
    </Routes>
  )
}
