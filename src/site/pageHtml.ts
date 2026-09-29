import { SITE_DESCRIPTION, SITE_PAGES, SITE_TITLE, type SitePage } from './pages'

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const fillPageHtml = (
  template: string,
  meta: { title: string; description: string; path: string },
  origin: string,
): string =>
  template
    .replace(/%SITE_ORIGIN%/g, () => origin)
    .replace(/%PAGE_TITLE%/g, () => escapeAttr(meta.title))
    .replace(/%PAGE_DESCRIPTION%/g, () => escapeAttr(meta.description))
    .replace(/%PAGE_URL%/g, () => origin + meta.path)

export const fillHomeHtml = (template: string, origin: string): string =>
  fillPageHtml(template, { title: SITE_TITLE, description: SITE_DESCRIPTION, path: '/' }, origin)

export const PRERENDERED_PAGES: readonly SitePage[] = SITE_PAGES.filter(
  (page) => !page.noindex && page.path !== '/',
)

export const pageHtmlFile = (page: SitePage): string => `${page.path.slice(1)}.html`
