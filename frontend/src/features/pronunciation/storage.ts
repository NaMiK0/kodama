const STORAGE_KEY = 'kodama-pronunciation-declined'

// Дешёвый "режим метро" до появления полноценного экрана настроек: после
// отказа в доступе к микрофону блок больше не лезет с запросом сам,
// но остаётся видимой ссылка "Включить" — отказ не должен быть необратимым.
export function loadDeclined(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveDeclined(declined: boolean): void {
  try {
    if (declined) {
      localStorage.setItem(STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — не критично
  }
}
