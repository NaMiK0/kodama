import type { ReactNode } from 'react'

import {
  CollectionIcon,
  HomeIcon,
  LibraryIcon,
  PronunciationIcon,
  StatsIcon,
} from './navIcons'

/**
 * Единое место для пунктов сайдбара и текстов страниц «в разработке» —
 * чтобы подпись пункта меню и заголовок/обещание на самой странице
 * (см. `ComingSoonPage`) никогда не разъезжались.
 */

export type ComingSoonSection = 'library' | 'stats' | 'pronunciation'

export const COMING_SOON_SECTIONS = ['library', 'stats', 'pronunciation'] as const

type ComingSoonCopy = {
  /** Название раздела — совпадает с подписью пункта в сайдбаре. */
  title: string
  /** Что здесь появится — конкретно для раздела, не общая фраза. */
  promise: string
}

export const COMING_SOON_COPY = {
  library: {
    title: 'Библиотека',
    promise: 'Здесь колоды можно будет собирать в папки — по учебнику, по курсу, по цели.',
  },
  stats: {
    title: 'Статистика',
    promise:
      'Здесь появится картина прогресса: сколько слов в обороте, какие даются тяжело, как меняется нагрузка по дням.',
  },
  pronunciation: {
    title: 'Произношение',
    promise: 'Здесь произношение станет отдельным тренажёром — без карточек и перевода, только звук.',
  },
} as const satisfies Record<ComingSoonSection, ComingSoonCopy>

export function isComingSoonSection(value: string): value is ComingSoonSection {
  return (COMING_SOON_SECTIONS as readonly string[]).includes(value)
}

export type NavItem = {
  key: string
  to: string
  label: string
  Icon: () => ReactNode
  /** Помечает пункт бледной меткой «скоро» — клик не должен быть сюрпризом. */
  comingSoon?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', to: '/', label: 'Главная', Icon: HomeIcon },
  { key: 'collection', to: '/collection', label: 'Коллекция', Icon: CollectionIcon },
]

export const NAV_ITEMS_COMING_SOON: NavItem[] = [
  {
    key: 'library',
    to: '/soon/library',
    label: COMING_SOON_COPY.library.title,
    Icon: LibraryIcon,
    comingSoon: true,
  },
  {
    key: 'stats',
    to: '/soon/stats',
    label: COMING_SOON_COPY.stats.title,
    Icon: StatsIcon,
    comingSoon: true,
  },
  {
    key: 'pronunciation',
    to: '/soon/pronunciation',
    label: COMING_SOON_COPY.pronunciation.title,
    Icon: PronunciationIcon,
    comingSoon: true,
  },
]
