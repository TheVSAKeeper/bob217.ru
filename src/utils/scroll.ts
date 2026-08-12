import type { RouterScrollBehavior } from 'vue-router'

const PAGE_TRANSITION_MS = 300
const HEIGHT_WAIT_MS = 2000
const HASH_POLL_MS = 100
const HASH_TRIES = 10

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitForHeight = (top: number): Promise<void> =>
  new Promise((resolve) => {
    const fits = (): boolean =>
      document.documentElement.scrollHeight - window.innerHeight >= Math.floor(top)

    if (fits()) {
      resolve()
      return
    }

    const stop = (): void => {
      observer.disconnect()
      clearTimeout(timer)
      resolve()
    }

    const observer = new ResizeObserver(() => {
      if (fits()) stop()
    })
    const timer = setTimeout(stop, HEIGHT_WAIT_MS)

    observer.observe(document.body)
  })

const waitForHash = async (hash: string): Promise<HTMLElement | null> => {
  const id = hash.slice(1)

  for (let attempt = 0; attempt < HASH_TRIES; attempt += 1) {
    const target = document.getElementById(id)
    if (target) return target
    await delay(HASH_POLL_MS)
  }

  return null
}

export const pageScroll: RouterScrollBehavior = async (to, from, saved) => {
  await delay(PAGE_TRANSITION_MS)

  if (to.hash) {
    const target = await waitForHash(to.hash)
    if (target) {
      target.scrollIntoView({ block: 'start' })
      return false
    }
    if (to.path === from.path) return false
  }

  if (!saved) return { top: 0, behavior: 'instant' }
  await waitForHeight(saved.top)
  return { ...saved, behavior: 'instant' }
}
