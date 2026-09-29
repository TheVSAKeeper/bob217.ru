export const DEFAULT_SITE_ORIGIN = 'https://bob217.ru'
export const siteOrigin = (value: string | undefined): string =>
  value?.trim() ? new URL(value.trim()).origin : DEFAULT_SITE_ORIGIN
export const SITE_TITLE = 'bob217 – Дот нет помойка и другие проекты'
export const SITE_DESCRIPTION =
  'Стримы про программирование, пет-проекты на C# и .NET, игры и всякая дрисня от bobito217'

interface PageMeta {
  path: string
  title: string
  description: string
  navLabel?: string
  sectionSummary?: string
  priority?: number
  noindex?: boolean
}

const PAGES = {
  home: {
    path: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    navLabel: 'Главная',
    priority: 1,
  },
  donate: {
    path: '/donate',
    title: 'Поддержка проектов – bob217',
    description:
      'Как поддержать проекты bob217: donate.stream, USDT BEP20 и QR-коды для перевода без лишних шагов.',
    navLabel: 'Донат',
    sectionSummary: 'поддержать проекты',
    priority: 0.8,
  },
  resume: {
    path: '/resume',
    title: 'Резюме – bob217',
    description:
      'Трудовой путь bobito217 как git log по веткам: места работы, роли, стек на C# и .NET, образование и навыки.',
    navLabel: 'Резюме',
    sectionSummary: 'трудовой путь как git log по веткам',
    priority: 0.8,
  },
  works: {
    path: '/works',
    title: 'Заказы и поделки – bob217',
    description:
      'Заказы, подработки и проекты для души от bobito217 как вывод git reflog: гексапод, фармацевтическая ИС, браузерная игра и шахматы с плагинами.',
    navLabel: 'Заказы',
    sectionSummary: 'заказы и поделки как вывод git reflog',
    priority: 0.7,
  },
  about: {
    path: '/about',
    title: 'О нас – bob217',
    description:
      'Кто пишет код в проектах bob217: вывод git shortlog по контрибьюторам с числом коммитов.',
    navLabel: 'О нас',
    sectionSummary: 'кто пишет код – git shortlog',
    priority: 0.7,
  },
  log: {
    path: '/log',
    title: 'Лента коммитов – bob217',
    description:
      'Лента коммитов по репозиториям bob217 как git log --graph: что и когда менялось в каждом проекте.',
    navLabel: 'Лента',
    sectionSummary: 'лента коммитов по всем репозиториям',
    priority: 0.6,
  },
  pulls: {
    path: '/pulls',
    title: 'Открытые Pull Request – bob217',
    description:
      'Открытые pull request по репозиториям bob217 с графом веток: что сейчас в работе и ждёт ревью.',
    navLabel: 'PR',
    sectionSummary: 'что сейчас на ревью',
    priority: 0.6,
  },
  issues: {
    path: '/issues',
    title: 'Открытые задачи – bob217',
    description:
      'Открытые issue по репозиториям bob217: что ждёт работы, где идёт обсуждение и сколько задача висит.',
    navLabel: 'Задачи',
    sectionSummary: 'что ждёт работы',
    priority: 0.6,
  },
  releases: {
    path: '/releases',
    title: 'Релизы – bob217',
    description:
      'Релизы проектов bob217 как вывод gh release list: версии, файлы сборок и сколько их скачали.',
    navLabel: 'Релизы',
    sectionSummary: 'готовые сборки и что скачивают',
    priority: 0.6,
  },
  repos: {
    path: '/repos',
    title: 'Карта репозиториев – bob217',
    description:
      'Карта репозиториев и форков bob217: языки, вклад контрибьюторов и связи между проектами.',
    navLabel: 'Карта',
    sectionSummary: 'карта репозиториев',
    priority: 0.6,
  },
  tarkov: {
    path: '/tarkov',
    title: 'Время Таркова – bob217',
    description:
      'Игровое время Escape from Tarkov и таймеры крафтов: когда выходить в рейд и когда забирать выхлоп.',
    navLabel: 'Тарков',
    sectionSummary: 'игровое время и таймеры крафтов',
    priority: 0.5,
  },
  'not-found': {
    path: '/404',
    title: 'Страница не найдена – bob217',
    description: 'fatal: pathspec не найден. Такой страницы на bob217.ru нет.',
    noindex: true,
  },
  error: {
    path: '/500',
    title: 'Ошибка – bob217',
    description: 'fatal: что-то сломалось на стороне bob217.ru.',
    noindex: true,
  },
} satisfies Record<string, PageMeta>

export type SitePageName = keyof typeof PAGES

export interface SitePage extends PageMeta {
  name: SitePageName
}

export const SITE_PAGES: readonly SitePage[] = (Object.keys(PAGES) as SitePageName[]).map(
  (name) => ({ name, ...PAGES[name] }),
)

export type NavPageName = {
  [Name in SitePageName]: (typeof PAGES)[Name] extends { navLabel: string } ? Name : never
}[SitePageName]

export interface NavPage {
  name: NavPageName
  path: string
  label: string
}

export const NAV_PAGES: readonly NavPage[] = SITE_PAGES.flatMap((page) =>
  page.navLabel ? [{ name: page.name as NavPageName, path: page.path, label: page.navLabel }] : [],
)

const SECTION_ORDER: readonly SitePageName[] = [
  'log',
  'issues',
  'pulls',
  'releases',
  'repos',
  'resume',
  'works',
  'about',
  'donate',
  'tarkov',
]

export interface SectionPage {
  path: string
  dir: string
  summary: string
}

const PAGE_BY_NAME = new Map(SITE_PAGES.map((page) => [page.name, page]))

export const SECTION_PAGES: readonly SectionPage[] = SECTION_ORDER.flatMap((name) => {
  const page = PAGE_BY_NAME.get(name)
  return page?.sectionSummary
    ? [{ path: page.path, dir: `${page.path.slice(1)}/`, summary: page.sectionSummary }]
    : []
})
