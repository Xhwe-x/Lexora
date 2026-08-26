type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function loadJson<T>(key: string, fallback: T, storage: StorageLike = localStorage): T {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadMigratedJson<T>(key: string, legacyKey: string, fallback: T, storage: StorageLike = localStorage): T {
  try {
    const current = storage.getItem(key)
    if (current) return JSON.parse(current) as T
    const legacy = storage.getItem(legacyKey)
    if (!legacy) return fallback
    const parsed = JSON.parse(legacy) as T
    storage.setItem(key, JSON.stringify(parsed))
    return parsed
  } catch {
    return fallback
  }
}

export function saveJson<T>(key: string, value: T, storage: StorageLike = localStorage) {
  storage.setItem(key, JSON.stringify(value))
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
