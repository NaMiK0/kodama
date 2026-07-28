import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Ширина карточки модалки (Tailwind max-w-*). По умолчанию — узкая форма. */
  widthClassName?: string
}

/**
 * Плавность через обычный CSS-переход, не Motion/AnimatePresence: на практике
 * AnimatePresence вокруг формы с async-мутацией (mutateAsync) ломала
 * дальнейшие обновления состояния этой формы — submit подвисал навсегда,
 * без единой ошибки в консоли. Воспроизведено стабильно, независимо от
 * StrictMode; без AnimatePresence (тот же портал) всё работает штатно.
 * Правило на будущее: не оборачивать в AnimatePresence поддерево,
 * где есть await-цепочки, меняющие состояние после паузы.
 */
export function Modal({ open, onClose, title, children, widthClassName = 'max-w-sm' }: ModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return createPortal(
    <div
      // Держим смонтированным всегда: переключаем только видимость.
      // inert — вне фокуса и дерева читалки, пока закрыто.
      inert={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-150 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${widthClassName} rounded-2xl border border-line bg-surface p-6 shadow-card transition-[opacity,transform] duration-150 ease-out ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <h2 id="modal-title" className="mb-4 text-lg font-medium text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}
