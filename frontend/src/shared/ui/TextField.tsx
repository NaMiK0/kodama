import { useEffect, useId, useState, type InputHTMLAttributes } from 'react'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  // Текст держим и на время сворачивания: иначе при исчезновении сначала
  // пропадёт надпись, а потом схлопнется пустое место — два рывка вместо нуля.
  const [lastError, setLastError] = useState(error)
  useEffect(() => {
    if (error) setLastError(error)
  }, [error])

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>

      <input
        id={id}
        // Читалка объявит поле ошибочным и прочитает саму ошибку,
        // а не только увидит красную рамку — цвет ей недоступен.
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`h-11 rounded-lg border bg-surface px-3.5 text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle ${
          error ? 'border-danger' : 'border-line hover:border-ink-subtle'
        } focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15 ${className}`}
        {...props}
      />

      {/* Плавно едет max-height, а не height: высоту не нужно измерять, поэтому
          нет ни рывка при сворачивании, ни риска обрезать перенесённый текст.
          Запас 5rem — это 4 строки; держим его близким к реальной высоте,
          иначе при сворачивании часть времени анимации проходит впустую.
          (Красивее был бы переход grid-template-rows 0fr->1fr, но Chrome
          не интерполирует доли при неопределённой высоте — застревает на нуле.) */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
          error ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p id={errorId} role="alert" className="overflow-hidden text-sm text-danger">
          {lastError}
        </p>
      </div>

      {!error && hint && (
        <p id={hintId} className="text-sm text-ink-subtle">
          {hint}
        </p>
      )}
    </div>
  )
}
