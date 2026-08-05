import { useNavigate } from 'react-router'

import { Button } from '@/shared/ui/Button'

type Props = { total: number; correctCount: number; backTo?: string; backLabel?: string }

export function StudySummary({ total, correctCount, backTo = '/', backLabel = 'К колодам' }: Props) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 text-center">
      <p className="mb-2 text-2xl font-medium text-ink">Готово</p>
      <p className="mb-8 text-ink-muted">
        {correctCount} из {total} правильно
      </p>
      <Button onClick={() => navigate(backTo)}>{backLabel}</Button>
    </div>
  )
}
