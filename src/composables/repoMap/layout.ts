import { DOMAINS, type Domain, type Repo } from '@/composables/useForkMap'
import { monthIndex, nowMonthIndex } from '@/utils/format'
import { langColor } from '@/utils/lang'
import { clamp01, convexHull, D2R, expandHull, type Point } from './math'
import type { Anchor, Node } from './types'

export const INTRO_CORE = 240
export const INTRO_SPAN = 1450
export const SAT_INTRO = 2150
export const FLARE_MS = 420
export const Z_MAX = 0.55
export const MONTHS_FAR = 84

const HULL_PAD = 30
const FAR_LOG = Math.log(1 + MONTHS_FAR)

const staleMonths = (pushed: string, nowM: number): number => {
  const m = nowM - monthIndex(pushed)
  return Number.isFinite(m) ? Math.max(0, m) : MONTHS_FAR
}

const freshHeight = (pushed: string, R: number, nowM: number): number =>
  Z_MAX * R * clamp01(1 - Math.log(1 + staleMonths(pushed, nowM)) / FAR_LOG)

const frontDelay = (dist: number, R: number): number =>
  INTRO_CORE + INTRO_SPAN * (1 - Math.cbrt(1 - Math.min(0.99, dist / (R * 1.15))))

const dominantColor = (list: Repo[]): string => {
  const counts = new Map<string, number>()
  for (const r of list) counts.set(r.lang, (counts.get(r.lang) ?? 0) + 1)
  let best = 'прочее'
  let top = -1
  for (const [lang, n] of counts) {
    if (n > top) {
      top = n
      best = lang
    }
  }
  return langColor(best)
}

const placeRow = (
  list: Repo[],
  dom: Domain,
  anchor: Anchor,
  nodes: Node[],
  rnd: () => number,
  radBase: number,
  rowShift: number,
): void => {
  const k = list.length
  const spread = 0.8 * dom.width
  const stepHalf = k > 1 ? (spread / (k - 1)) * 0.5 : 0
  list.forEach((r, i) => {
    const frac = k === 1 ? 0.5 : i / (k - 1)
    let angDeg = dom.bisector - spread / 2 + spread * frac + rowShift * stepHalf
    angDeg += (rnd() * 2 - 1) * 4
    const radFrac = radBase * (1 + (rnd() * 2 - 1) * 0.04)
    nodes.push({
      repo: r,
      anchor,
      ang: angDeg * D2R,
      radFrac,
      bx: 0,
      by: 0,
      bz: 0,
      ox: 0,
      oy: 0,
      ovx: 0,
      ovy: 0,
      col: langColor(r.lang),
      satPhase: rnd() * Math.PI * 2,
      satPer: 30 + (rnd() * 2 - 1) * 10,
      twPhase: rnd() * Math.PI * 2,
      twSpeed: 1.1 + rnd() * 1.4,
      introDelay: 0,
      dist: 0,
    })
  })
}

export const buildScene = (
  repos: Repo[],
  rnd: () => number,
): { nodes: Node[]; anchors: Anchor[] } => {
  const nodes: Node[] = []
  const anchors: Anchor[] = []
  const byDomain = new Map<string, Repo[]>()
  for (const r of repos) {
    const list = byDomain.get(r.domain) ?? []
    list.push(r)
    byDomain.set(r.domain, list)
  }

  for (const dom of DOMAINS) {
    const list = (byDomain.get(dom.key) ?? []).slice().sort((a, b) => b.stars - a.stars)
    const anchor: Anchor = {
      key: dom.key,
      label: dom.label,
      ang: dom.bisector * D2R,
      radFrac: 0.4,
      bx: 0,
      by: 0,
      bz: 0,
      sx: 0,
      sy: 0,
      dist: 0,
      introDelay: 0,
      calloutStart: -1e9,
      color: dominantColor(list),
      count: list.length,
      hull: [],
      chain: [],
    }
    anchors.push(anchor)
    const head = Math.min(5, list.length)
    placeRow(list.slice(0, head), dom, anchor, nodes, rnd, 0.56, 0)
    placeRow(list.slice(head), dom, anchor, nodes, rnd, 0.76, 1)
  }

  return { nodes, anchors }
}

export const layoutScene = (nodes: Node[], anchors: Anchor[], R: number, kx = 1): void => {
  const nowM = nowMonthIndex()
  for (const a of anchors) {
    const rad = a.radFrac * R
    a.bx = Math.cos(a.ang) * rad * kx
    a.by = Math.sin(a.ang) * rad
    a.bz = 0
    a.dist = rad
    a.introDelay = frontDelay(rad, R)
    a.chain = []
    a.hull = []
  }

  nodes.forEach((n, i) => {
    const rad = n.radFrac * R
    n.bx = Math.cos(n.ang) * rad * kx
    n.by = Math.sin(n.ang) * rad
    n.bz = freshHeight(n.repo.pushed, R, nowM)
    n.dist = rad
    n.introDelay = frontDelay(rad, R) + (i % 5) * 14
    n.anchor.chain.push(n)
  })

  for (const a of anchors) {
    const inner = a.chain.filter((n) => n.radFrac < 0.66).sort((p, q) => p.ang - q.ang)
    const outer = a.chain.filter((n) => n.radFrac >= 0.66).sort((p, q) => q.ang - p.ang)
    a.chain = inner.concat(outer)
    const pts: Point[] = a.chain.map((n) => [n.bx, n.by])
    pts.push([a.bx, a.by])
    a.hull = expandHull(convexHull(pts), HULL_PAD)
  }
}
