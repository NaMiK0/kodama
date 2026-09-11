import { useState } from 'react'

type LandingImageProps = {
  src: string
  alt: string
  /** Показывается в плейсхолдере, пока файла нет — имя, которое ждём в public/landing/. */
  placeholderLabel: string
  className?: string
}

/**
 * Картинка лендинга с явным плейсхолдером вместо битого <img>, пока файл
 * не подложен в public/landing/ (иллюстрации рисует Никита во внешнем ИИ —
 * см. LANDING_IMAGE_PROMPTS.md рядом с этим файлом).
 *
 * И картинка, и плейсхолдер лежат на .landing-plate — светлой «плите» на
 * токенах: маскирует белое гало по контуру, которое AI-генерация оставляет
 * на альфа-канале (см. комментарий у .landing-plate в index.css), и держит
 * одинаковый вид независимо от того, загрузился файл или нет.
 */
export function LandingImage({ src, alt, placeholderLabel, className = '' }: LandingImageProps) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className={`landing-plate flex items-center justify-center rounded-2xl border-dashed p-8 text-center text-sm text-ink-subtle ${className}`}
      >
        Сюда ляжет: <span className="ml-1 font-medium text-ink-muted">{placeholderLabel}</span>
      </div>
    )
  }

  return (
    <div className={`landing-plate rounded-2xl p-6 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className="size-full object-contain"
      />
    </div>
  )
}

/**
 * Декоративный фон (не структурная иллюстрация): без картинки просто ничего
 * не показываем — плейсхолдер-рамка здесь выглядела бы отвлекающим пятном
 * позади демо-карточки, а не полезной подсказкой. Вместо .landing-plate —
 * только .landing-glow (без рамки/тени), чтобы не спорить визуально с
 * бордер-карточкой EchoHeroDemo, которая лежит поверх.
 */
export function LandingBackdrop({ src, className = '' }: { src: string; className?: string }) {
  const [errored, setErrored] = useState(false)

  if (errored) return null

  return (
    <div className={`landing-glow ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setErrored(true)}
        className="size-full object-contain"
      />
    </div>
  )
}
