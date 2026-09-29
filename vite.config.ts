import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { constants } from 'zlib'
import { compression, defineAlgorithm } from 'vite-plugin-compression2'
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

const siteOriginHtml = (origin: string): Plugin => ({
  name: 'bob217-site-origin',
  transformIndexHtml: (html) => html.replaceAll('%SITE_ORIGIN%', origin),
})

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
      siteOriginHtml(origin),
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
