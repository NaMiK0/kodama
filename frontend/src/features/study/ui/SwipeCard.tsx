import {
  animate,
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'motion/react'
import { forwardRef, useImperativeHandle } from 'react'

import type { Card } from '@/features/cards/api'
import type { StudyLanguage } from '@/shared/lib/LanguageProvider'

export const SWIPE_THRESHOLD = 100
const FLY_OUT_DISTANCE = 600

export type SwipeCardHandle = {
  decide: (direction: 'known' | 'unknown') => Promise<void>
}

type Props = {
  card: Card
  language: StudyLanguage
  flipped: boolean
  onFlip: () => void
  onDecide: (direction: 'known' | 'unknown') => void
  /** Смещение карточки. Владеет им родитель: по этому же значению он
   *  подсвечивает края ЭКРАНА, а они не могут лежать внутри перетаскиваемого
   *  элемента — уехали бы вместе с карточкой. */
  x: MotionValue<number>
}

// Карточка разбора: тап переворачивает, перетаскивание решает «знаю/не знаю».
// Оформление (рамка, фон, тень) лежит на КАЖДОЙ стороне внутри вращающегося
// слоя, а не снаружи — иначе крутился бы только текст, а прямоугольник
// карточки оставался неподвижным. Тот же приём, что в AuthCard.
export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { card, language, flipped, onFlip, onDecide, x },
  ref,
) {
  const reduceMotion = useReducedMotion()
  const rotate = useTransform(x, [-300, 300], [-14, 14])

  useImperativeHandle(ref, () => ({
    async decide(direction) {
      if (reduceMotion) return
      const target = direction === 'known' ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE
      await animate(x, target, { duration: 0.25, ease: 'easeIn' })
      x.set(0)
    },
  }))

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onDecide('known')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDecide('unknown')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  const showReference = card.reference !== card.word

  return (
    <motion.div
      style={{ x, rotate }}
      drag={flipped && !reduceMotion ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (!flipped) onFlip()
      }}
      className={`relative aspect-[3/4] w-full ${
        flipped ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
    >
      {reduceMotion ? (
        flipped ? (
          <CardBack card={card} />
        ) : (
          <CardFront card={card} language={language} showReference={showReference} />
        )
      ) : (
        <div className="h-full" style={{ perspective: 1600 }}>
          <motion.div
            className="relative h-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden' }}
              inert={flipped}
            >
              <CardFront card={card} language={language} showReference={showReference} />
            </div>
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              inert={!flipped}
            >
              <CardBack card={card} />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
})

function CardFront({
  card,
  language,
  showReference,
}: {
  card: Card
  language: StudyLanguage
  showReference: boolean
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <p className={`text-3xl font-medium text-ink ${language === 'ja' ? 'font-jp' : ''}`}>
        {card.word}
      </p>
      {showReference && <p className="font-jp text-ink-subtle">{card.reference}</p>}
      <p className="mt-6 text-xs text-ink-subtle">Нажмите, чтобы увидеть перевод</p>
    </div>
  )
}

function CardBack({ card }: { card: Card }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <p className="text-3xl font-medium text-ink">{card.translation}</p>
      {card.example_sentence && (
        <p className="mt-2 text-sm text-ink-subtle italic">{card.example_sentence}</p>
      )}
    </div>
  )
}
