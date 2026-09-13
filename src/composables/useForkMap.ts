import { computed, ref } from 'vue'
import { readCache, readStale, writeCache } from '@/utils/cache'
import { fetchGitHub, githubResponse } from '@/utils/github'

export interface Contributor {
  login: string
  merged: number
  last: string
}

export interface MergedPull {
  login: string
  repo: string
  at: string
}

export interface Repo {
  name: string
  stars: number
  lang: string
  forks: number
  url: string
  desc: string
  sizeKb: number
  pushed: string
  merged: number
  contributors: Contributor[]
  commits: number | null
  domain: string
  domainLabel: string
}

export interface Domain {
  key: string
  label: string
  width: number
  bisector: number
}

export interface MapStats {
  total: number
  forked: number
  merged: number
  stars: number
  contributors: number
  languages: number
}

export const OWNER = 'MaxNagibator'

export type SizeBy = 'stars' | 'forks' | 'merged' | 'size' | 'commits'

export const SIZE_OPTIONS: { key: SizeBy; label: string }[] = [
  { key: 'stars', label: 'звёзды' },
  { key: 'forks', label: 'форки' },
  { key: 'merged', label: 'PR' },
  { key: 'size', label: 'вес' },
  { key: 'commits', label: 'коммиты' },
]

const LANG_ORDER = [
  'C#',
  'Vue',
  'JavaScript',
  'HTML',
  'Go',
  'Python',
  'SCSS',
  'PowerShell',
  'прочее',
]

export const DOMAINS: Domain[] = [
  { key: 'apps', label: 'приложения', width: 66, bisector: -90 },
  { key: 'games', label: 'игры', width: 74, bisector: -20 },
  { key: 'bots', label: 'боты и api', width: 32, bisector: 33 },
  { key: 'study', label: 'учёба', width: 90, bisector: 94 },
  { key: 'misc', label: 'прочее', width: 24, bisector: 151 },
  { key: 'tools', label: 'инструменты', width: 74, bisector: 200 },
]

const DOMAIN_OF: Record<string, string> = {
  Money: 'apps',
  MediaOrcestrator: 'apps',
  auth: 'apps',
  'bob217.ru': 'apps',
  bob217downloader: 'apps',
  JuniorFactory: 'apps',
  'pulsar-server': 'apps',
  CoreWebApi: 'apps',
  Labirintiki: 'games',
  ElementaryGame: 'games',
  PlayingCards: 'games',
  Miner: 'games',
  chess: 'games',
  domiki: 'games',
  Sapper: 'games',
  Minesweeper: 'games',
  PoproshaykaBot: 'bots',
  PomogatorBot: 'bots',
  TwitchApi: 'bots',
  vkapi: 'bots',
  gusev: 'study',
  gorich: 'study',
  GeneticAlgorithm: 'study',
  TechDevelopSoft: 'study',
  DatabasePlodder: 'study',
  RustEducation: 'study',
  PythonEducation: 'study',
  GolangEducation: 'study',
  LeetCode: 'study',
  canny: 'study',
  'git-branch-test': 'study',
  Solyanka: 'misc',
  SpiderNetwork: 'misc',
  TestHistory: 'misc',
  SpaceSnoop: 'tools',
  MacrosApp: 'tools',
  SolutionIconSwitcher: 'tools',
  videoConverter: 'tools',
  IisBackuper: 'tools',
  IisHelperService: 'tools',
  MssqlToPostgresTransporter: 'tools',
  SaveStatusWorker: 'tools',
  'calc-energy': 'tools',
  OilHistory: 'tools',
}

interface RepoResponse {
  name: string
  stargazers_count: number
  language: string | null
  forks_count: number
  html_url: string
  description: string | null
  size: number
  pushed_at: string
}

interface SearchItem {
  repository_url: string
  closed_at: string | null
  user: { login: string }
  pull_request?: { merged_at: string | null }
}

interface SearchResponse {
  total_count: number
  items: SearchItem[]
}

const REPOS_URL = `https://api.github.com/users/${OWNER}/repos?per_page=100&sort=updated`
const mergedUrl = (page: number): string =>
  `https://api.github.com/search/issues?q=is:pr+is:merged+user:${OWNER}&per_page=100&page=${page}`
const commitsUrl = (name: string): string =>
  `https://api.github.com/repos/${OWNER}/${name}/commits?per_page=1`

const COMMITS_KEY = 'repo-map-commits'
const COMMITS_TTL = 24 * 60 * 60 * 1000
const REPOS_KEY = 'repo-map-list'
const REPOS_TTL = 30 * 60 * 1000
const MERGED_KEY = 'merged-pulls'
const MERGED_TTL = 30 * 60 * 1000
// TODO: потолок – 500 принятых PR (5 страниц по 100), сегодня 222; когда total_count превысит 500,
// поднять число страниц или перейти на инкрементальную подгрузку
const MERGED_PAGES = 5
const COMMITS_LANES = 5

export type CommitsState = 'idle' | 'loading' | 'ready' | 'partial'

export type LoadStage = 'idle' | 'repos' | 'pulls' | 'ready' | 'error'

const domainLabel = (key: string): string => DOMAINS.find((d) => d.key === key)?.label ?? 'прочее'

const repoName = (apiUrl: string): string => apiUrl.slice(apiUrl.lastIndexOf('/') + 1)

let repoListPromise: Promise<RepoResponse[]> | null = null
let repoListAt = 0

const writeReposCache = (list: RepoResponse[]): void => {
  writeCache(
    REPOS_KEY,
    list.map((r) => ({
      name: r.name,
      stargazers_count: r.stargazers_count,
      language: r.language,
      forks_count: r.forks_count,
      html_url: r.html_url,
      description: r.description,
      size: r.size,
      pushed_at: r.pushed_at,
    })),
  )
}

const fetchRepoList = (): Promise<RepoResponse[]> => {
  if (repoListPromise && Date.now() - repoListAt >= REPOS_TTL) repoListPromise = null
  if (!repoListPromise) {
    repoListAt = Date.now()
    repoListPromise = (async () => {
      const cached = readCache<RepoResponse[]>(REPOS_KEY, REPOS_TTL)
      if (cached) return cached
      const list = await fetchGitHub<RepoResponse[]>(REPOS_URL)
      writeReposCache(list)
      return list
    })().catch((e: unknown) => {
      repoListPromise = null
      throw e
    })
  }
  return repoListPromise
}

const toRepo = (r: RepoResponse, contributors: Contributor[], commits: number | null): Repo => {
  const domain = DOMAIN_OF[r.name] ?? 'misc'
  return {
    name: r.name,
    stars: r.stargazers_count,
    lang: r.language ?? 'прочее',
    forks: r.forks_count,
    url: r.html_url,
    desc: r.description ?? '',
    sizeKb: r.size,
    pushed: r.pushed_at,
    merged: contributors.reduce((sum, c) => sum + c.merged, 0),
    contributors,
    commits,
    domain,
    domainLabel: domainLabel(domain),
  }
}

export const loadRepos = async (): Promise<Repo[]> =>
  (await fetchRepoList()).map((r) => toRepo(r, [], null))

const toPulls = (items: SearchItem[]): MergedPull[] =>
  items.map((it) => ({
    login: it.user.login,
    repo: repoName(it.repository_url),
    at: it.pull_request?.merged_at ?? it.closed_at ?? '',
  }))

const pageCount = (total: number): number =>
  Number.isFinite(total) && total > 100 ? Math.min(Math.ceil(total / 100), MERGED_PAGES) : 1

let mergedPromise: Promise<MergedPull[]> | null = null
let mergedAt = 0

export const loadMergedPulls = (onPage?: (found: number) => void): Promise<MergedPull[]> => {
  if (mergedPromise && Date.now() - mergedAt >= MERGED_TTL) mergedPromise = null
  if (!mergedPromise) {
    mergedAt = Date.now()
    mergedPromise = (async () => {
      const cached = readCache<MergedPull[]>(MERGED_KEY, MERGED_TTL)
      if (cached) return cached
      const first = await fetchGitHub<SearchResponse>(mergedUrl(1))
      const pages: MergedPull[][] = [toPulls(first.items)]
      let found = pages[0]?.length ?? 0
      onPage?.(found)
      const rest = pageCount(first.total_count) - 1
      await Promise.all(
        Array.from({ length: rest }, async (_, i) => {
          const data = await fetchGitHub<SearchResponse>(mergedUrl(i + 2))
          const items = toPulls(data.items)
          pages[i + 1] = items
          found += items.length
          onPage?.(found)
        }),
      )
      const all = pages.flat()
      writeCache(MERGED_KEY, all)
      return all
    })().catch((e: unknown) => {
      mergedPromise = null
      throw e
    })
  }
  return mergedPromise
}

const contributorsOf = (
  pulls: MergedPull[],
  onFound?: (found: number) => void,
): Map<string, Contributor[]> => {
  const byRepo = new Map<string, Map<string, Contributor>>()
  let found = 0
  for (const { login, repo, at } of pulls) {
    if (login === OWNER) continue
    const people = byRepo.get(repo) ?? new Map<string, Contributor>()
    const c = people.get(login) ?? { login, merged: 0, last: '' }
    c.merged++
    if (at > c.last) c.last = at
    people.set(login, c)
    byRepo.set(repo, people)
    found++
  }
  onFound?.(found)
  return new Map(
    [...byRepo].map(([repo, people]) => [
      repo,
      [...people.values()].sort((a, b) => b.merged - a.merged),
    ]),
  )
}

const readCommitsCache = (): Record<string, number> =>
  readCache<Record<string, number>>(COMMITS_KEY, COMMITS_TTL) ?? {}

const buildRepos = (list: RepoResponse[], contributors: Map<string, Contributor[]>): Repo[] => {
  const commits = readCommitsCache()
  return list.map((r) => toRepo(r, contributors.get(r.name) ?? [], commits[r.name] ?? null))
}

const lastPage = (link: string | null): number | null => {
  const m = link?.match(/[?&]page=(\d+)>;\s*rel="last"/)
  return m?.[1] ? Number(m[1]) : null
}

const commitCount = async (name: string): Promise<number | null> => {
  const res = await githubResponse(commitsUrl(name))
  if (!res?.ok) return null
  const page = lastPage(res.headers.get('Link'))
  if (page !== null) return page
  const data = (await res.json().catch(() => null)) as unknown[] | null
  return Array.isArray(data) ? data.length : null
}

export function useForkMap() {
  const repos = ref<Repo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const commitsState = ref<CommitsState>('idle')
  const commitsDone = ref(0)
  const stage = ref<LoadStage>('idle')
  const foundRepos = ref(0)
  const foundPulls = ref(0)
  const staleAt = ref<number | null>(null)

  const showStale = (): boolean => {
    const list = readStale<RepoResponse[]>(REPOS_KEY)
    const pulls = readStale<MergedPull[]>(MERGED_KEY)
    if (!list || !pulls || !Array.isArray(list.data) || !Array.isArray(pulls.data)) return false
    try {
      repos.value = buildRepos(list.data, contributorsOf(pulls.data))
    } catch {
      return false
    }
    foundRepos.value = list.data.length
    staleAt.value = Math.min(list.ts, pulls.ts)
    stage.value = 'ready'
    return true
  }

  const load = async (): Promise<void> => {
    loading.value = true
    error.value = null
    staleAt.value = null
    stage.value = 'repos'
    try {
      const [list, pulls] = await Promise.all([
        fetchRepoList().then((l) => {
          foundRepos.value = l.length
          if (stage.value === 'repos') stage.value = 'pulls'
          return l
        }),
        loadMergedPulls((n) => (foundPulls.value = n)),
      ])
      repos.value = buildRepos(
        list,
        contributorsOf(pulls, (n) => (foundPulls.value = n)),
      )
      stage.value = 'ready'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить карту'
      if (!showStale()) stage.value = 'error'
    } finally {
      loading.value = false
    }
  }

  const loadCommits = async (): Promise<void> => {
    if (commitsState.value === 'loading' || commitsState.value === 'ready') return
    if (!repos.value.length) return
    commitsState.value = 'loading'
    const cache = readCommitsCache()
    const queue: Repo[] = []
    for (const r of repos.value) {
      const hit = cache[r.name]
      if (typeof hit === 'number') r.commits = hit
      else if (r.commits === null) queue.push(r)
    }
    commitsDone.value = repos.value.length - queue.length
    let failed = 0
    const lane = async (): Promise<void> => {
      for (;;) {
        const repo = queue.shift()
        if (!repo) return
        const n = await commitCount(repo.name)
        if (n === null) failed++
        else {
          repo.commits = n
          cache[repo.name] = n
        }
        commitsDone.value++
      }
    }
    await Promise.all(Array.from({ length: COMMITS_LANES }, lane))
    writeCache(COMMITS_KEY, cache)
    commitsState.value = failed ? 'partial' : 'ready'
  }

  const stats = computed<MapStats>(() => {
    const list = repos.value
    const contributors = new Set(list.flatMap((r) => r.contributors.map((c) => c.login)))
    return {
      total: list.length,
      forked: list.filter((r) => r.forks > 0).length,
      merged: list.reduce((sum, r) => sum + r.merged, 0),
      stars: list.reduce((sum, r) => sum + r.stars, 0),
      contributors: contributors.size,
      languages: new Set(list.map((r) => r.lang)).size,
    }
  })

  const langCounts = computed<{ lang: string; count: number }[]>(() => {
    const counts = new Map<string, number>()
    for (const r of repos.value) counts.set(r.lang, (counts.get(r.lang) ?? 0) + 1)
    return [...counts.entries()]
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => LANG_ORDER.indexOf(a.lang) - LANG_ORDER.indexOf(b.lang))
  })

  return {
    repos,
    stats,
    langCounts,
    loading,
    error,
    load,
    loadCommits,
    commitsState,
    commitsDone,
    stage,
    foundRepos,
    foundPulls,
    staleAt,
  }
}
