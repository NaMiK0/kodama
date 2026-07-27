const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Введите email'
  if (!EMAIL_RE.test(value)) return 'Проверьте формат email'
  return undefined
}

export function validatePassword(value: string, minLength = 1): string | undefined {
  if (!value) return 'Введите пароль'
  if (value.length < minLength) return `Не короче ${minLength} символов`
  return undefined
}
