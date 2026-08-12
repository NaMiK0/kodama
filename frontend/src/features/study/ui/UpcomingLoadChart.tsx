import { useState } from 'react'

import type { UpcomingDay } from '../api'

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const

const COL_WIDTH = 40
const GAP = 4
const BAR_WIDTH = COL_WIDTH - GAP
const CHART_HEIGHT = 180
const TOP_MARGIN = 22 // место под подпись пика
const BOTTOM_MARGIN = 24 // место под подписи оси X
const BAR_AREA_HEIGHT = CHART_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
const BASELINE_Y = CHART_HEIGHT - BOTTOM_MARGIN
const RADIUS = 4
// День без нагрузки — не «ничего не рисуем» (иначе 13 из 14 колонок молча
// пропадают и график читается как сломанный), а видимый, но приглушённый
// столбик-огрызок: "измерили — действительно ноль", другим цветом, чем
// столбики с реальными данными.
const ZERO_STUB_HEIGHT = 3

function formatDayLabel(date: string, index: number): string {
  if (index === 0) return 'Сегодня'
  const [, month, day] = date.split('-')
  const monthIndex = Number(month) - 1
  const monthName = MONTHS_SHORT[monthIndex] ?? ''
  return `${Number(day)} ${monthName}`
}

// Верхушка столбика скруглена, низ — нет: рисуем путём, а не rect+rx
// (rx скруглил бы все четыре угла).
function roundedTopBarPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0) return ''
  const r = Math.min(RADIUS, height, width / 2)
  return `
    M ${x} ${y + height}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height}
    Z
  `
}

/**
 * Единственный настоящий график на экране статистики — рукописный inline
 * SVG, без библиотек: тащить зависимость с чужой палитрой ради одной
 * диаграммы неоправданно. Один ряд данных — легенда не нужна, заголовок
 * блока сам называет данные.
 */
export function UpcomingLoadChart({ upcoming }: { upcoming: UpcomingDay[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const allZero = upcoming.every((day) => day.count === 0)
  const maxCount = Math.max(...upcoming.map((day) => day.count), 1)
  const peakIndex = upcoming.reduce((best, day, index) => {
    const bestDay = upcoming[best]
    return bestDay && day.count > bestDay.count ? index : best
  }, 0)

  // Не каждый из 14 дней — иначе подписи налезут друг на друга.
  const labelIndices = new Set([0, 4, 9, upcoming.length - 1])
  const hoveredDay = hoveredIndex !== null ? upcoming[hoveredIndex] : undefined

  const viewBoxWidth = upcoming.length * COL_WIDTH

  if (allZero) {
    return (
      <p className="text-ink-muted">
        Ближайшие 14 дней без повторений — сейчас в расписании ничего не запланировано
      </p>
    )
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${CHART_HEIGHT}`}
        // preserveAspectRatio="none" + фиксированная CSS-высота: без этого
        // SVG растягивает ВЫСОТУ вслед за шириной контейнера (сохраняя
        // соотношение сторон viewBox), и на широком экране 14 узких колонок
        // превращаются в непропорционально вытянутые столбцы — визуальный
        // баг, который и был на скриншоте. Ширина по-прежнему тянется
        // свободно (колонки шире на широком экране), высота — всегда ровно
        // CHART_HEIGHT.
        preserveAspectRatio="none"
        style={{ height: CHART_HEIGHT }}
        className="w-full"
        role="img"
        aria-label="Нагрузка на ближайшие 14 дней"
      >
        {upcoming.map((day, index) => {
          const x = index * COL_WIDTH + GAP / 2
          const isZero = day.count === 0
          const height = isZero ? ZERO_STUB_HEIGHT : (day.count / maxCount) * BAR_AREA_HEIGHT
          const y = BASELINE_Y - height
          const isHovered = hoveredIndex === index
          const isPeak = index === peakIndex && !isZero

          return (
            <g key={day.date}>
              {/* Мягкая подсветка всей колонки при наведении/фокусе —
                  замена нативной рамки браузера на хит-зоне (см. .chart-col-hit
                  в index.css): выделение без грубой обводки. */}
              <rect
                x={index * COL_WIDTH}
                y={0}
                width={COL_WIDTH}
                height={CHART_HEIGHT}
                className="fill-accent-soft transition-[opacity] duration-150 ease-out"
                style={{ opacity: isHovered ? 1 : 0 }}
              />

              <path
                d={roundedTopBarPath(x, y, BAR_WIDTH, height)}
                // Нулевой день — приглушённый огрызок (line), а не акцентный
                // столбик: иначе визуально читалось бы как реальная нагрузка.
                className={`transition-[opacity] duration-150 ease-out ${isZero ? 'fill-line' : 'fill-accent'}`}
                style={{ opacity: isHovered && !isZero ? 0.75 : 1 }}
              />

              {isPeak && (
                <text
                  x={x + BAR_WIDTH / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-ink text-[11px] font-medium tabular-nums"
                >
                  {day.count}
                </text>
              )}

              {labelIndices.has(index) && (
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-ink-subtle text-[10px]"
                >
                  {formatDayLabel(day.date, index)}
                </text>
              )}

              {/* Хит-зона шире самого столбика — в тонкий столбик тяжело
                  попасть курсором. outline гасится/переопределяется классом
                  .chart-col-hit (см. index.css) — без него клик показывал бы
                  нативную чёрную рамку браузера на весь столбик. */}
              <rect
                x={index * COL_WIDTH}
                y={0}
                width={COL_WIDTH}
                height={CHART_HEIGHT}
                fill="transparent"
                className="chart-col-hit"
                tabIndex={0}
                role="button"
                aria-label={`${formatDayLabel(day.date, index)}: ${day.count} ${day.count === 1 ? 'слово' : 'слов'}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              />
            </g>
          )
        })}
      </svg>

      {hoveredIndex !== null && hoveredDay && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-2 py-1 text-xs whitespace-nowrap text-ink shadow-card"
          style={{ left: `${((hoveredIndex + 0.5) / upcoming.length) * 100}%` }}
        >
          {formatDayLabel(hoveredDay.date, hoveredIndex)} · {hoveredDay.count}{' '}
          {hoveredDay.count === 1 ? 'слово' : 'слов'}
        </div>
      )}
    </div>
  )
}
