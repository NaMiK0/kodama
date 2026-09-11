import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Link } from 'react-router'

import { LibraryIcon, PronunciationIcon, StatsIcon } from '@/app/navIcons'
import { Logomark } from '@/shared/ui/Logomark'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

import { AiGenerationDemo } from './AiGenerationDemo'
import { EchoHeroDemo } from './EchoHeroDemo'
import { FeatureSection } from './FeatureSection'
import { LandingBackdrop } from './LandingImage'
import { LockIcon, SparkleIcon, ThemeIcon, TwoLanguagesIcon } from './landingIcons'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

// Button.tsx рендерит настоящий <button> (без полиморфного asChild) — а CTA
// здесь обязаны быть <Link> (переход по маршруту, не обработчик клика).
// Вместо вложения <Link> в <Button> (два интерактивных элемента друг в
// друге, невалидный HTML) переносим классы primary-варианта прямо на Link.
const CTA_PRIMARY =
  'inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm text-accent-ink outline-none transition-[background-color,color,transform,box-shadow] duration-150 hover:bg-accent-strong focus-visible:ring-4 focus-visible:ring-accent/25 active:scale-[0.985]'

const GRID_ITEMS = [
  {
    Icon: LibraryIcon,
    title: 'Библиотека папок',
    body: 'Раскладывайте колоды по учебникам, курсам или целям — вложенные папки, как в файловом менеджере.',
  },
  {
    Icon: StatsIcon,
    title: 'Прогноз на 14 дней',
    body: 'Статистика показывает, сколько слов потребует внимания на неделю вперёд — без сюрпризов в понедельник утром.',
  },
  {
    Icon: ThemeIcon,
    title: 'Светлая и тёмная тема',
    body: 'Палитра продумана для каждой темы отдельно — не инверсия цветов, а два самостоятельных состояния.',
  },
  {
    Icon: LockIcon,
    title: 'Надёжный вход',
    body: 'Email с восстановлением пароля или вход через Google в один клик.',
  },
] as const

/**
 * Публичная маркетинговая страница — то, что видит гость на "/" (см.
 * HomeRoute). Своя минимальная шапка, без AppShell: это витрина, а не
 * рабочий экран, поэтому здесь можно то, что в приложении сознательно
 * убрали из чрома — крупный 木霊 как атмосферный, не функциональный текст.
 */
export function LandingPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-2 text-ink">
          <Logomark className="size-8 text-accent" />
          <span className="font-jp text-lg">木霊</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="text-ink-subtle hover:text-ink" />
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Войти
          </Link>
          <Link to="/login" className={`${CTA_PRIMARY} h-9 px-4`}>
            Начать бесплатно
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 pt-10 pb-24 text-center lg:flex-row lg:gap-8 lg:pt-16 lg:text-left">
        <motion.div
          className="max-w-xl"
          initial={reduceMotion ? undefined : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase">
            Kodama · 木霊
          </p>
          <h1 className="mb-5 text-4xl font-medium text-ink sm:text-5xl">
            Слово возвращается ровно тогда, когда вот-вот забудется
          </h1>
          <p className="mb-8 text-lg text-ink-muted">
            Kodama — сервис для изучения английского и японского с адаптивным расписанием
            повторений: каждое слово всплывает не по календарю, а по кривой вашей собственной
            памяти.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link to="/login" className={`${CTA_PRIMARY} h-12 px-6 text-base`}>
              Начать бесплатно
            </Link>
            <Link to="/login" className="text-sm text-ink-muted hover:text-ink">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </motion.div>

        <div className="relative w-full max-w-md lg:max-w-none lg:flex-1">
          {/* Задник за демо-карточкой: чисто атмосферный, не структурный —
              если файла ещё нет, просто ничего не показываем (см. LandingBackdrop). */}
          <LandingBackdrop
            src="/landing/hero.jpg"
            // opacity-40 подобран под тёмную тему (светлое изображение на тёмном
            // canvas — контраст сам по себе); на светлой тот же процент почти
            // не виден (светлое на светлом), поэтому там поднимаем сильнее.
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full scale-125 object-contain opacity-70 dark:opacity-40"
          />
          <EchoHeroDemo />
        </div>
      </section>

      {/* Иллюстрированные фичи */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-16 lg:gap-32">
        <FeatureSection
          icon={<SparkleIcon />}
          eyebrow="ИИ-генерация"
          heading="Тема и уровень — карточки за секунды"
          body="Не нужно вручную искать слова и переводы. Укажите тему («IT-лексика», «еда и напитки») и уровень — Kodama сгенерирует колоду карточек с примерами, пока вы наливаете чай."
          visual={<AiGenerationDemo />}
        />
        <FeatureSection
          icon={<PronunciationIcon />}
          eyebrow="Произношение"
          heading="Слышит, что сказали — не просто ставит галочку"
          body="Отдельная проверка произношения на речевых моделях: Whisper для японского, wav2vec2 для английского. Kodama сравнивает звучание с эталоном и честно показывает, где именно разошлось."
          imageSrc="/landing/pronunciation.png"
          imageAlt="Иллюстрация: кодама слушает и говорит"
          imagePlaceholder="landing/pronunciation.png"
          reverse
        />
        <FeatureSection
          icon={<TwoLanguagesIcon />}
          eyebrow="Два языка"
          heading="Английский и японский — с независимым прогрессом"
          body="Каждый язык ведёт свою собственную кривую забывания и своё расписание повторений — переключение между ними не путает уже выученное с тем, что вы только начали."
          imageSrc="/landing/bilingual.png"
          imageAlt="Иллюстрация: два языка растут рядом, каждый своим ростком"
          imagePlaceholder="landing/bilingual.png"
        />
      </section>

      {/* Компактная сетка второстепенных фич */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GRID_ITEMS.map(({ Icon, title, body }, index) => (
            <motion.div
              key={title}
              className="rounded-2xl border border-line bg-surface p-6"
              initial={reduceMotion ? undefined : 'hidden'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.06 }}
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon />
              </div>
              <h3 className="mb-1.5 font-medium text-ink">{title}</h3>
              <p className="text-sm text-ink-muted">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Финальный призыв */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-medium text-ink">Начните с одной колоды</h2>
        <p className="mb-8 text-ink-muted">Бесплатно, без карты — просто аккаунт и первое слово.</p>
        <Link to="/login" className={`${CTA_PRIMARY} h-12 px-6 text-base`}>
          Создать аккаунт
        </Link>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 border-t border-line px-6 py-8 text-sm text-ink-subtle sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Kodama · 木霊</span>
        <a
          href="https://github.com/NaMiK0/kodama"
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink"
        >
          Исходный код на GitHub
        </a>
      </footer>
    </div>
  )
}
