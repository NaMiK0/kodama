import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

import { AuthForm } from './AuthForm'

// Переключение вход <-> регистрация как переворот флеш-карты — приём выведен
// из самого продукта (учебная карточка), а не взят из шаблона.
export function AuthCard() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const reduceMotion = useReducedMotion()
  const flipped = mode === 'register'

  const login = (
    <AuthForm
      title="Вход"
      submitLabel="Войти"
      footerPrompt="Нет аккаунта?"
      footerLink="Создать"
      passwordAutoComplete="current-password"
      onFlip={() => setMode('register')}
    />
  )

  const register = (
    <AuthForm
      title="Регистрация"
      submitLabel="Создать аккаунт"
      footerPrompt="Уже есть аккаунт?"
      footerLink="Войти"
      passwordAutoComplete="new-password"
      onFlip={() => setMode('login')}
    />
  )

  // Кому анимации мешают — просто показываем нужную сторону без переворота
  if (reduceMotion) return flipped ? register : login

  return (
    <div style={{ perspective: 1600 }}>
      <motion.div
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* inert убирает скрытую сторону из фокуса и из дерева читалки:
            иначе Tab уводил бы курсор на невидимую форму. */}
        <div style={{ backfaceVisibility: 'hidden' }} inert={flipped}>
          {login}
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          inert={!flipped}
        >
          {register}
        </div>
      </motion.div>
    </div>
  )
}
