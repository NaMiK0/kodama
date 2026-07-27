import { Route, Routes } from 'react-router'

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
      {/* Временная страница: проверка палитры и типографики.
          Уберём, когда появятся настоящие экраны. */}
      <Route path="/" element={<TokensPreview />} />
      <Route path="/login" element={<Placeholder title="Вход" />} />
      <Route path="/auth/callback" element={<Placeholder title="Возврат из Google" />} />
      <Route path="*" element={<Placeholder title="Страница не найдена" />} />
    </Routes>
  )
}
