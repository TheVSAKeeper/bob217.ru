interface Entry<T> {
  ts: number
  data: T
}

export const readCache = <T>(key: string, ttl: number): T | null => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Entry<T> | null
    if (typeof parsed?.ts !== 'number') return null
    return Date.now() - parsed.ts < ttl ? (parsed.data ?? null) : null
  } catch {
    return null
  }
}

export const readStale = <T>(key: string): { data: T; ts: number } | null => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Entry<T> | null
    if (typeof parsed?.ts !== 'number') return null
    const data = parsed.data ?? null
    return data === null ? null : { data, ts: parsed.ts }
  } catch {
    return null
  }
}

export const writeCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    return
  }
}
