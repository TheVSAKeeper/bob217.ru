const HEADERS = { Accept: 'application/vnd.github+json' }

const TIMEOUT_MS = 15_000

export const githubResponse = (url: string): Promise<Response | null> =>
  fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null)

const limitResetAt = (res: Response): number | null => {
  const reset = Number(res.headers.get('X-RateLimit-Reset'))
  if (res.headers.get('X-RateLimit-Remaining') === '0' && Number.isFinite(reset) && reset > 0)
    return reset * 1000
  const retry = Number(res.headers.get('Retry-After'))
  return Number.isFinite(retry) && retry > 0 ? Date.now() + retry * 1000 : null
}

const limitMessage = (res: Response): string => {
  const at = limitResetAt(res)
  if (at === null) return 'лимит GitHub исчерпан'
  const time = new Date(at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `лимит GitHub исчерпан, сброс в ${time}`
}

export const fetchGitHub = async <T>(url: string): Promise<T> => {
  const res = await githubResponse(url)
  if (!res) throw new Error('GitHub недоступен')
  if (!res.ok)
    throw new Error(
      res.status === 403 || res.status === 429 ? limitMessage(res) : `GitHub ${res.status}`,
    )
  return (await res.json()) as T
}
