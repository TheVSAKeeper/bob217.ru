import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin, type Rollup } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { constants } from 'zlib'
import { compression, defineAlgorithm } from 'vite-plugin-compression2'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fillHomeHtml, fillPageHtml, pageHtmlFile, PRERENDERED_PAGES } from './src/site/pageHtml'
import { buildRobots, buildSitemap } from './src/site/sitemap'
import { siteOrigin } from './src/site/pages'

const sitemap = (origin: string): Plugin => ({
  name: 'bob217-sitemap',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(origin) })
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(origin) })
  },
})

const ROUTER_FILE = fileURLToPath(new URL('./src/router/index.ts', import.meta.url))

const readViewFiles = (): Map<string, string> => {
  const source = readFileSync(ROUTER_FILE, 'utf8')
  const views = new Map<string, string>()
  for (const [, name, view] of source.matchAll(
    /^\s*['"]?([\w-]+)['"]?\s*:\s*\(\)\s*=>\s*import\(\s*['"]\.\.\/views\/([\w/-]+\.vue)['"]\s*\)/gm,
  )) {
    if (name && view) views.set(name, `/src/views/${view}`)
  }
  return views
}

const collectImports = (bundle: Rollup.OutputBundle, fileName: string, seen: Set<string>): void => {
  const chunk = bundle[fileName]
  if (!chunk || chunk.type !== 'chunk' || seen.has(fileName)) return
  seen.add(fileName)
  for (const dep of chunk.imports) collectImports(bundle, dep, seen)
}

const pagePreloads = (bundle: Rollup.OutputBundle, base: string): Map<string, string> => {
  const chunks = Object.values(bundle).filter((item): item is Rollup.OutputChunk => item.type === 'chunk')
  const entry = chunks.find((chunk) => chunk.isEntry)
  const inEntry = new Set<string>()
  if (entry) collectImports(bundle, entry.fileName, inEntry)
  const views = readViewFiles()
  const links = new Map<string, string>()
  for (const page of PRERENDERED_PAGES) {
    const view = views.get(page.name)
    if (!view)
      throw new Error(
        `bob217-page-html: в VIEWS (${ROUTER_FILE}) не найден ленивый import для страницы ${page.name}`,
      )
    const chunk = chunks.find((item) => item.facadeModuleId?.replace(/\\/g, '/').endsWith(view))
    if (!chunk) throw new Error(`bob217-page-html: в сборке нет чанка ${view} для страницы ${page.name}`)
    const files = new Set<string>()
    collectImports(bundle, chunk.fileName, files)
    const js = [...files].filter((file) => !inEntry.has(file))
    const css = js.flatMap((file) => [...((bundle[file] as Rollup.OutputChunk).viteMetadata?.importedCss ?? [])])
    links.set(
      page.name,
      [
        ...js.map((file) => `<link rel="modulepreload" crossorigin href="${base}${file}">`),
        ...css.map((file) => `<link rel="preload" as="style" crossorigin href="${base}${file}">`),
      ].join('\n    '),
    )
  }
  return links
}

const pageHtml = (origin: string): Plugin => {
  let template = ''
  let base = '/'
  return {
    name: 'bob217-page-html',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler: (html) => {
        template = html
        return fillHomeHtml(html, origin)
      },
    },
    writeBundle(options, bundle) {
      if (!options.dir) return
      const preloads = pagePreloads(bundle, base)
      for (const page of PRERENDERED_PAGES) {
        const file = join(options.dir, pageHtmlFile(page))
        mkdirSync(dirname(file), { recursive: true })
        const html = fillPageHtml(template, page, origin).replace(
          '</head>',
          `    ${preloads.get(page.name)}\n  </head>`,
        )
        writeFileSync(file, html)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const origin = siteOrigin(env.VITE_SITE_ORIGIN)
  return {
    plugins: [
      vue(),
      vueDevTools({
        launchEditor: env.LAUNCH_EDITOR || 'code',
      }),
      sitemap(origin),
      pageHtml(origin),
      compression({
        algorithms: [
          defineAlgorithm('gzip', { level: 9 }),
          defineAlgorithm('brotliCompress', {
            params: {
              [constants.BROTLI_PARAM_QUALITY]: 11,
            },
          }),
        ],
        threshold: 1024,
        skipIfLargerOrEqual: true,
      }),
    ],
    server: {
      host: '127.0.0.1',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
