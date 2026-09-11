import { Splash } from '@/shared/ui/Splash'
import { DecksPage } from '@/features/decks/ui/DecksPage'
import { useMe } from '@/features/auth/hooks'

import { AppShell } from './AppShell'
import { LandingPage } from './landing/LandingPage'

/**
 * "/" — единственный маршрут с разным смыслом в зависимости от того, вошли
 * мы или нет: гость видит маркетинговый лендинг (без AppShell — своя
 * публичная шапка внутри LandingPage), а вошедший — как раньше, DecksPage
 * внутри AppShell. Раньше "/" жил внутри RequireAuth и гостя безусловно
 * уводило на /login — лендинга не было в принципе.
 */
export function HomeRoute() {
  const { data, isPending } = useMe()

  if (isPending) return <Splash />

  if (!data) return <LandingPage />

  return (
    <AppShell>
      <DecksPage />
    </AppShell>
  )
}
