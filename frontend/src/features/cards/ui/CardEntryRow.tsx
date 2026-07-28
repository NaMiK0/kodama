import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

export type CardEntryRowValue = {
  key: string
  word: string
  translation: string
  reference: string
  exampleSentence: string
  showExample: boolean
  error?: string
}

export function emptyCardEntryRow(): CardEntryRowValue {
  return {
    key: crypto.randomUUID(),
    word: '',
    translation: '',
    reference: '',
    exampleSentence: '',
    showExample: false,
  }
}

const inputClass =
  'h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle hover:border-ink-subtle focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15'

type Props = {
  row: CardEntryRowValue
  language: StudyLanguage
  onChange: (patch: Partial<CardEntryRowValue>) => void
  onRemove: () => void
  canRemove: boolean
  autoFocus?: boolean
}

export function CardEntryRow({ row, language, onChange, onRemove, canRemove, autoFocus }: Props) {
  return (
    <div className={`rounded-lg border p-2 ${row.error ? 'border-danger' : 'border-line'}`}>
      <div className="flex items-center gap-2">
        <input
          value={row.word}
          onChange={(event) => onChange({ word: event.target.value })}
          placeholder="Слово"
          aria-label="Слово"
          autoFocus={autoFocus}
          className={inputClass}
        />
        {language === 'ja' && (
          <input
            value={row.reference}
            onChange={(event) => onChange({ reference: event.target.value })}
            placeholder="Чтение"
            aria-label="Чтение"
            className={inputClass}
          />
        )}
        <input
          value={row.translation}
          onChange={(event) => onChange({ translation: event.target.value })}
          placeholder="Перевод"
          aria-label="Перевод"
          className={inputClass}
        />

        <button
          type="button"
          onClick={() => onChange({ showExample: !row.showExample })}
          aria-label="Пример предложения"
          aria-pressed={row.showExample}
          className={`shrink-0 rounded-md p-2 text-sm transition-colors duration-150 ${
            row.showExample
              ? 'bg-accent-soft text-accent-strong'
              : 'text-ink-subtle hover:bg-surface-soft hover:text-ink'
          }`}
        >
          Aa
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Удалить строку"
          className="shrink-0 rounded-md p-2 text-ink-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-subtle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {row.showExample && (
        <input
          value={row.exampleSentence}
          onChange={(event) => onChange({ exampleSentence: event.target.value })}
          placeholder="Пример предложения (необязательно)"
          aria-label="Пример предложения"
          className={`${inputClass} mt-2 w-full`}
        />
      )}

      {row.error && <p className="mt-1.5 text-xs text-danger">{row.error}</p>}
    </div>
  )
}
