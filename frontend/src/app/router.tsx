import { Route, Routes } from 'react-router'

/**
 * Пока — заглушки. Настоящие экраны появятся после того,
 * как договоримся о палитре и визуальном стиле.
 */
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-lg text-neutral-500">{title}</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder title="Kodama — каркас готов" />} />
      <Route path="/login" element={<Placeholder title="Вход" />} />
      <Route path="/auth/callback" element={<Placeholder title="Возврат из Google" />} />
      <Route path="*" element={<Placeholder title="Страница не найдена" />} />
    </Routes>
  )
}
