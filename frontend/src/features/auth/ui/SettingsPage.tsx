import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useMe, useUpdateSettings } from '@/features/auth/hooks'
import { Avatar } from '@/shared/ui/Avatar'
import { AVATARS, AVATAR_IDS } from '@/shared/ui/avatarRegistry'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'

const MIN_NEW_CARDS_LIMIT = 1
const MAX_NEW_CARDS_LIMIT = 50

export function SettingsPage() {
  const navigate = useNavigate()
  const { data: user } = useMe()
  const updateSettings = useUpdateSettings()

  // Локальный черновик лимита: число редактируется посимвольно, отправлять
  // запрос на каждое нажатие клавиши (в том числе на промежуточное пустое
  // поле) не нужно — только когда пользователь закончил ввод.
  const [limitDraft, setLimitDraft] = useState<string | null>(null)

  if (!user) return null

  const limitValue = limitDraft ?? String(user.new_cards_daily_limit)

  function commitLimit() {
    const parsed = Number(limitDraft)
    setLimitDraft(null)
    if (
      limitDraft === null ||
      !Number.isInteger(parsed) ||
      parsed < MIN_NEW_CARDS_LIMIT ||
      parsed > MAX_NEW_CARDS_LIMIT ||
      parsed === user?.new_cards_daily_limit
    ) {
      return
    }
    updateSettings.mutate({ new_cards_daily_limit: parsed })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 px-0">
        ← Назад
      </Button>
      <h1 className="mb-6 text-xl font-medium text-ink">Настройки</h1>

      <div className="mb-6 rounded-xl border border-line bg-surface p-5">
        <p className="font-medium text-ink">Аватар</p>
        <p className="mb-4 text-sm text-ink-muted">Как вас видят в шапке приложения</p>
        <div role="radiogroup" aria-label="Аватар" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {AVATAR_IDS.map((id) => {
            const selected = user.avatar_id === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={AVATARS[id].label}
                title={AVATARS[id].label}
                disabled={updateSettings.isPending}
                onClick={() => updateSettings.mutate({ avatar_id: id })}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-surface-soft'
                }`}
              >
                <Avatar id={id} size="lg" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-ink">Предлагать произношение</p>
            <p className="text-sm text-ink-muted">
              Запись голоса после ответа на вопрос в сессии изучения
            </p>
          </div>
          <Toggle
            checked={user.offer_pronunciation}
            disabled={updateSettings.isPending}
            onChange={(checked) => updateSettings.mutate({ offer_pronunciation: checked })}
            label="Предлагать произношение"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-ink">Новых слов в день</p>
            <p className="text-sm text-ink-muted">
              Сколько новых карточек добавлять в сессию за раз (от {MIN_NEW_CARDS_LIMIT} до{' '}
              {MAX_NEW_CARDS_LIMIT})
            </p>
          </div>
          <input
            type="number"
            min={MIN_NEW_CARDS_LIMIT}
            max={MAX_NEW_CARDS_LIMIT}
            value={limitValue}
            disabled={updateSettings.isPending}
            onChange={(event) => setLimitDraft(event.target.value)}
            onBlur={commitLimit}
            className="h-11 w-20 rounded-lg border border-line bg-surface px-3 text-center text-ink outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
          />
        </div>
      </div>
    </div>
  )
}
