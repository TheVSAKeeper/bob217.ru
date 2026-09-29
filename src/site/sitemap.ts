import { SITE_PAGES } from './pages'

const DEFAULT_PRIORITY = 0.5

export const buildSitemap = (origin: string): string => {
  const urls = SITE_PAGES.filter((page) => !page.noindex).map((page) => {
    const loc = page.path === '/' ? `${origin}/` : origin + page.path
    const priority = (page.priority ?? DEFAULT_PRIORITY).toFixed(1)
    return ['  <url>', `    <loc>${loc}</loc>`, `    <priority>${priority}</priority>`, '  </url>']
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.flat(),
    '</urlset>',
    '',
  ].join('\n')
}

export const buildRobots = (origin: string): string =>
  [
    'User-agent: *',
    'Allow: /',
    ...SITE_PAGES.filter((page) => page.noindex).map((page) => `Disallow: ${page.path}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
