import { useEffect, useState } from 'react'

import { Button } from '@/shared/ui/Button'

import { isPronunciationSupported, usePronunciationAttempt } from '../hooks'
import { loadDeclined, saveDeclined } from '../storage'

// Те же пороги, что в backend/app/modules/study/grading.py (composite_quality) —
// словесная оценка здесь и будущее влияние score на SM-2 должны говорить одно и то же.
const GOOD_PRONUNCIATION = 0.8
const POOR_PRONUNCIATION = 0.5

function verdictLabel(score: number): { text: string; className: string } {
  if (score >= GOOD_PRONUNCIATION) return { text: 'Хорошо', className: 'text-accent-strong' }
  if (score >= POOR_PRONUNCIATION) return { text: 'Похоже', className: 'text-ink' }
  return { text: 'Не расслышал', className: 'text-danger' }
}

function DetailPanel({ transcript, detail }: { transcript: string | null; detail: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false)

  const mismatches = Array.isArray(detail?.mismatches)
    ? (detail.mismatches as { expected: string; heard: string }[])
    : null
  const matched = typeof detail?.matched === 'string' ? detail.matched : null

  return (
    <div className="mt-2 text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="text-xs text-ink-subtle underline decoration-dotted hover:text-ink-muted"
      >
        {open ? 'Скрыть' : 'Подробнее'}
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-surface-soft p-3 text-xs text-ink-muted">
          {transcript && <p className="mb-1">Услышано: {transcript}</p>}
          {matched && <p>Распознано как: {matched}</p>}
          {mismatches && mismatches.length > 0 && (
            <ul className="flex flex-col gap-1">
              {mismatches.map((m, i) => (
                <li key={i}>
                  ожидалось «{m.expected}» — услышано «{m.heard}»
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function PronunciationBlock({ cardId }: { cardId: number }) {
  const [declined, setDeclined] = useState(loadDeclined)
  const { state, result, errorMessage, start, stop, reset } = usePronunciationAttempt(cardId)

  // Отказ в доступе запоминаем сразу — это и есть дешёвый "режим метро"
  // до появления полноценного экрана настроек.
  useEffect(() => {
    if (state === 'permission-denied') saveDeclined(true)
  }, [state])

  if (state === 'unsupported' || !isPronunciationSupported()) return null

  if (declined && state === 'idle') {
    return (
      <p className="mt-4 text-xs text-ink-subtle">
        Проверка произношения отключена ·{' '}
        <button
          type="button"
          onClick={() => {
            saveDeclined(false)
            setDeclined(false)
          }}
          className="underline decoration-dotted hover:text-ink-muted"
        >
          Включить
        </button>
      </p>
    )
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      {state === 'idle' && (
        <Button type="button" variant="secondary" onClick={() => void start()}>
          🎤 Произнести
        </Button>
      )}

      {state === 'requesting-permission' && (
        <Button type="button" variant="secondary" loading>
          Запрашиваем доступ к микрофону…
        </Button>
      )}

      {state === 'recording' && (
        <Button type="button" variant="secondary" onClick={stop}>
          ● Идёт запись — нажмите, чтобы остановить
        </Button>
      )}

      {(state === 'uploading' || state === 'processing') && (
        <Button type="button" variant="secondary" loading>
          {state === 'uploading' ? 'Отправка…' : 'Проверяем…'}
        </Button>
      )}

      {state === 'permission-denied' && (
        <p className="text-sm text-ink-muted">
          Доступ к микрофону не разрешён.{' '}
          <button
            type="button"
            onClick={() => {
              saveDeclined(false)
              setDeclined(false)
              reset()
            }}
            className="underline decoration-dotted hover:text-ink"
          >
            Включить
          </button>
        </p>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-danger">{errorMessage}</p>
          <Button type="button" variant="secondary" onClick={reset}>
            Попробовать снова
          </Button>
        </div>
      )}

      {state === 'result' && result && result.score !== null && (
        <div className="text-left">
          <p className={`text-sm font-medium ${verdictLabel(result.score).className}`}>
            {verdictLabel(result.score).text}
          </p>
          <DetailPanel transcript={result.transcript} detail={result.detail} />
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs text-ink-subtle underline decoration-dotted hover:text-ink-muted"
          >
            Ещё раз
          </button>
        </div>
      )}
    </div>
  )
}
