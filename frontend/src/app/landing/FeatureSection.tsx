import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { LandingImage } from './LandingImage'

type FeatureSectionProps = {
  icon: ReactNode
  eyebrow: string
  heading: string
  body: string
  /** Картинка слева, текст справа — для чередования ритма между секциями. */
  reverse?: boolean
} & (
  // Либо статичная иллюстрация, либо живой виджет (visual) — не оба сразу.
  | { imageSrc: string; imageAlt: string; imagePlaceholder: string; visual?: never }
  | { visual: ReactNode; imageSrc?: never; imageAlt?: never; imagePlaceholder?: never }
)

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Одна иллюстрированная секция фичи: картинка (или живой виджет) + текст,
 * чередуются местами между секциями (reverse). Появление — один раз при
 * попадании во вьюпорт, не на каждый скролл туда-обратно (viewport once).
 */
export function FeatureSection(props: FeatureSectionProps) {
  const { icon, eyebrow, heading, body, reverse = false } = props
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={`flex flex-col items-center gap-10 lg:gap-16 ${
        reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      }`}
    >
      <motion.div
        className="w-full max-w-md lg:max-w-none lg:flex-1"
        initial={reduceMotion ? undefined : 'hidden'}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {props.imageSrc !== undefined ? (
          <LandingImage
            src={props.imageSrc}
            alt={props.imageAlt}
            placeholderLabel={props.imagePlaceholder}
            className="aspect-[4/3] w-full"
          />
        ) : (
          // Та же плита, что у иллюстраций, — ритм секций не ломается. На узких
          // экранах без aspect: контент виджета выше, чем 3/4 ширины телефона,
          // а overflow-hidden у плиты его бы обрезал.
          <div className="landing-plate flex w-full items-center justify-center rounded-2xl px-6 py-8 sm:aspect-[4/3] sm:py-6">
            {props.visual}
          </div>
        )}
      </motion.div>

      <motion.div
        className="w-full max-w-lg lg:flex-1"
        initial={reduceMotion ? undefined : 'hidden'}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      >
        <div className="mb-3 flex items-center gap-2 text-accent">
          {icon}
          <span className="text-sm font-medium tracking-wide uppercase">{eyebrow}</span>
        </div>
        <h2 className="mb-4 text-2xl font-medium text-ink sm:text-3xl">{heading}</h2>
        <p className="text-base text-ink-muted">{body}</p>
      </motion.div>
    </div>
  )
}
