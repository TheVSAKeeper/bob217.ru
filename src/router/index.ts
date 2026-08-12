import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteRecordSingleView } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { SITE_PAGES, type SitePageName } from '@/site/pages'
import { applyRouteMeta } from '@/utils/meta'
import { pageScroll } from '@/utils/scroll'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    noindex?: boolean
  }
}

const VIEWS: Record<SitePageName, RouteRecordSingleView['component']> = {
  home: HomeView,
  donate: () => import('../views/DonateView.vue'),
  resume: () => import('../views/ResumeView.vue'),
  works: () => import('../views/WorksView.vue'),
  about: () => import('../views/AboutView.vue'),
  log: () => import('../views/LogView.vue'),
  pulls: () => import('../views/PullRequestsView.vue'),
  issues: () => import('../views/IssuesView.vue'),
  releases: () => import('../views/ReleasesView.vue'),
  repos: () => import('../views/RepoMapView.vue'),
  tarkov: () => import('../views/TarkovView.vue'),
  'not-found': () => import('../views/NotFoundView.vue'),
  error: () => import('../views/ErrorView.vue'),
}

const routes: RouteRecordRaw[] = SITE_PAGES.map((page) => ({
  path: page.path,
  name: page.name,
  component: VIEWS[page.name],
  meta: {
    title: page.title,
    description: page.description,
    noindex: page.noindex,
  },
}))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: pageScroll,
  routes: [...routes, { path: '/:pathMatch(.*)*', redirect: '/404' }],
})

router.afterEach(applyRouteMeta)

export default router
