import { useCallback, useEffect, useRef, useState } from 'react'

import { useServerEvents } from '@/shared/lib/ServerEventsProvider'

import { createAttempt, fetchAttempt, type AttemptRead } from './api'

export type RecorderState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'uploading'
  | 'processing'
  | 'result'
  | 'permission-denied'
  | 'unsupported'
  | 'error'

const RECORD_MAX_MS = 5_000
const POLL_INTERVAL_MS = 1_500
const RESULT_TIMEOUT_MS = 30_000

// Порядок важен: сначала предпочтительный кодек Chrome/Firefox, затем то,
// что реально отдаёт Safari (audio/webm там не поддерживается вовсе).
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

export function isPronunciationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  )
}

/**
 * Оркестрирует весь цикл проверки произношения: запись -> отправка -> ожидание
 * результата (WS-уведомление + опрос как резерв, с общим таймаутом). Не
 * react-query — это одноразовое действие, а не список для кэширования.
 */
export function usePronunciationAttempt(cardId: number) {
  const { subscribe, isConnected } = useServerEvents()

  const [state, setState] = useState<RecorderState>('idle')
  const [result, setResult] = useState<AttemptRead | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const attemptIdRef = useRef<number | null>(null)
  // Отдельно от setInterval эффекта — иначе переподключение WS (isConnected
  // меняется) пересоздаёт эффект и обнулило бы отсчёт таймаута.
  const processingStartedAtRef = useRef(0)

  const cleanupStream = useCallback(() => {
    clearTimeout(autoStopTimerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  useEffect(() => cleanupStream, [cleanupStream])

  const reset = useCallback(() => {
    cleanupStream()
    attemptIdRef.current = null
    setResult(null)
    setErrorMessage(null)
    setState('idle')
  }, [cleanupStream])

  function stop() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  async function upload(mimeType: string) {
    cleanupStream()
    setState('uploading')

    const blob = new Blob(chunksRef.current, { type: mimeType })
    chunksRef.current = []

    try {
      const attempt = await createAttempt(cardId, blob, mimeType)
      attemptIdRef.current = attempt.id
      processingStartedAtRef.current = Date.now()
      setState('processing')
    } catch {
      setErrorMessage('Не удалось отправить запись')
      setState('error')
    }
  }

  async function start() {
    if (!isPronunciationSupported()) {
      setState('unsupported')
      return
    }

    setState('requesting-permission')
    setErrorMessage(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('permission-denied')
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    const mimeType = pickMimeType()
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      void upload(mimeType || recorder.mimeType)
    }

    recorder.start()
    setState('recording')
    autoStopTimerRef.current = setTimeout(stop, RECORD_MAX_MS)
  }

  // WS-уведомление несёт только статус/score/transcript — за полной записью
  // (detail с разбором фонем) всё равно идём на сервер отдельно, поэтому и
  // WS-путь, и опрос сходятся в один и тот же fetchAttempt.
  const finishWith = useCallback(async (id: number) => {
    try {
      const attempt = await fetchAttempt(id)
      if (attemptIdRef.current !== id) return
      if (attempt.status === 'pending' || attempt.status === 'processing') return
      setResult(attempt)
      setState(attempt.status === 'failed' ? 'error' : 'result')
      if (attempt.status === 'failed') setErrorMessage('Не удалось распознать запись')
    } catch {
      if (attemptIdRef.current !== id) return
      setErrorMessage('Не удалось получить результат')
      setState('error')
    }
  }, [])

  useEffect(() => {
    return subscribe((event) => {
      if (event.type !== 'pronunciation') return
      if (event.attempt_id !== attemptIdRef.current) return
      if (event.status === 'done' || event.status === 'failed') void finishWith(event.attempt_id)
    })
  }, [subscribe, finishWith])

  useEffect(() => {
    if (state !== 'processing') return
    const attemptId = attemptIdRef.current
    if (attemptId === null) return

    const timer = setInterval(() => {
      if (Date.now() - processingStartedAtRef.current > RESULT_TIMEOUT_MS) {
        clearInterval(timer)
        setErrorMessage('Не дождались результата, попробуйте снова')
        setState('error')
        return
      }
      if (isConnected) return // сокет жив — ждём событие, опрос не нужен
      void finishWith(attemptId)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [state, isConnected, finishWith])

  return { state, result, errorMessage, start, stop, reset }
}
