const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export class ApiError extends Error {
  // Поля объявлены явно: erasableSyntaxOnly запрещает параметры-свойства
  // (`constructor(readonly x)`) — их нельзя убрать простым стиранием типов.
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** Тело в JSON. Для загрузки файлов используй `formData`. */
  json?: unknown
  /** Тело как FormData — для multipart (аудио) и form-encoded логина. */
  body?: BodyInit
  headers?: Record<string, string>
}

/**
 * Обёртка над fetch для нашего API.
 *
 * credentials: 'include' — обязательно: без него браузер не отправит
 * httpOnly-куку с токеном и не сохранит новую из ответа.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', json, body, headers = {} }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response))
  }

  // 204 No Content — тела нет, парсить нечего
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown }
    if (typeof data.detail === 'string') return data.detail
    // Ошибки валидации FastAPI приходят массивом объектов
    if (Array.isArray(data.detail)) return 'Проверьте правильность заполнения полей'
  } catch {
    // тело не JSON — вернём общее сообщение ниже
  }
  return `Ошибка запроса (${response.status})`
}

export const apiUrl = API_URL
