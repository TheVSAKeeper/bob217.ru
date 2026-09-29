import type { RouteLocationNormalized } from 'vue-router'
import { SITE_DESCRIPTION, SITE_TITLE, siteOrigin } from '@/site/pages'

export const SITE_ORIGIN = siteOrigin(import.meta.env.VITE_SITE_ORIGIN)

const upsertMeta = (attr: 'name' | 'property', key: string, content: string): void => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertCanonical = (href: string): void => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

export const applyRouteMeta = (to: RouteLocationNormalized): void => {
  const title = to.meta.title ?? SITE_TITLE
  const description = to.meta.description ?? SITE_DESCRIPTION
  const url = SITE_ORIGIN + to.path

  document.title = title
  upsertMeta('name', 'title', title)
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'robots', to.meta.noindex ? 'noindex, follow' : 'index, follow')
  upsertCanonical(url)
}
