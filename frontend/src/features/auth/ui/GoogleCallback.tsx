import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { Splash } from '@/shared/ui/Splash'

import { ME_QUERY_KEY } from '../hooks'

/**
 * Сюда бэкенд редиректит браузер ПОСЛЕ успешного входа через Google —
 * кука уже установлена (см. app/modules/auth/router.py: google_callback
 * ставит куку и только потом делает redirect на фронтенд). Если вход
 * не удался, бэкенд вернёт ошибку прямо на своём домене, и на этот
 * маршрут браузер не попадёт вовсе — отдельной обработки неудачи не нужно.
 */
export function GoogleCallback() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }).then(() => {
      navigate('/', { replace: true })
    })
  }, [navigate, queryClient])

  return <Splash />
}
