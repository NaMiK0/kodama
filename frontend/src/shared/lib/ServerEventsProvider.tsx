import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import { apiUrl } from '@/shared/api/client'

export type ServerEvent =
  | { type: 'generation'; job_id: number; status: string; deck_id: number | null }
  | {
      type: 'pronunciation'
      attempt_id: number
      status: string
      score: number | null
      transcript: string | null
    }

type ServerEventsContextValue = {
  subscribe: (handler: (event: ServerEvent) => void) => () => void
  isConnected: boolean
}

const ServerEventsContext = createContext<ServerEventsContextValue | null>(null)

const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 15_000
const WS_POLICY_VIOLATION = 1008

function wsUrl(): string {
  return `${apiUrl.replace(/^http/, 'ws')}/ws`
}

/**
 * Одно WS-соединение на всё приложение. Логика конкретных фич (генерация,
 * произношение) не живёт здесь — они сами фильтруют события по `type`
 * через subscribe.
 */
export function ServerEventsProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const handlersRef = useRef(new Set<(event: ServerEvent) => void>())
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectDelayRef = useRef(RECONNECT_BASE_MS)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const stoppedRef = useRef(false)

  useEffect(() => {
    stoppedRef.current = false

    function connect() {
      if (stoppedRef.current) return

      const socket = new WebSocket(wsUrl())
      socketRef.current = socket

      socket.onopen = () => {
        reconnectDelayRef.current = RECONNECT_BASE_MS
        setIsConnected(true)
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as ServerEvent
          if (parsed.type !== 'generation' && parsed.type !== 'pronunciation') return
          for (const handler of handlersRef.current) handler(parsed)
        } catch {
          // сообщение не JSON или неизвестной формы — молча игнорируем
        }
      }

      socket.onclose = (event: CloseEvent) => {
        setIsConnected(false)
        socketRef.current = null
        // 1008 — нет сессии, это не сетевой сбой, переподключение не поможет
        if (stoppedRef.current || event.code === WS_POLICY_VIOLATION) return

        reconnectTimerRef.current = setTimeout(connect, reconnectDelayRef.current)
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, RECONNECT_MAX_MS)
      }
    }

    connect()

    return () => {
      stoppedRef.current = true
      clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  function subscribe(handler: (event: ServerEvent) => void) {
    handlersRef.current.add(handler)
    return () => {
      handlersRef.current.delete(handler)
    }
  }

  return (
    <ServerEventsContext value={{ subscribe, isConnected }}>{children}</ServerEventsContext>
  )
}

export function useServerEvents(): ServerEventsContextValue {
  const value = useContext(ServerEventsContext)
  if (value === null) throw new Error('useServerEvents используется вне ServerEventsProvider')
  return value
}
