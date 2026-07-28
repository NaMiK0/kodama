import { useNavigate } from 'react-router'

import { useLanguage } from '@/shared/lib/LanguageProvider'
import { Button } from '@/shared/ui/Button'

import { useDueCards, useNewCards } from '../hooks'

export function StudyEntry() {
  const { language } = useLanguage()
  const navigate = useNavigate()

  const { data: due, isPending: duePending } = useDueCards(language)
  const { data: fresh, isPending: freshPending } = useNewCards(language)

  if (duePending || freshPending) return null

  const total = (due?.length ?? 0) + (fresh?.length ?? 0)

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* «Повторений», а не «карточек»: одно слово может дать два задания —
            узнавание и воспроизведение живут в расписании порознь. */}
        <p className="font-medium text-ink">
          {total > 0 ? `${total} ${repetitionsWord(total)} на сегодня` : 'На сегодня всё'}
        </p>
        {total === 0 && <p className="text-sm text-ink-muted">Новые карточки появятся здесь</p>}
      </div>

      {total > 0 && <Button onClick={() => navigate('/study')}>Учить</Button>}
    </div>
  )
}

function repetitionsWord(count: number): string {
  const lastTwo = count % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'повторений'
  const last = count % 10
  if (last === 1) return 'повторение'
  if (last >= 2 && last <= 4) return 'повторения'
  return 'повторений'
}
