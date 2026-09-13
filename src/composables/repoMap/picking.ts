import { CORE_BASE } from './paintCore'
import { satScreen } from './satellites'
import type { Viewport } from './camera'
import type { Anchor, Node, SatHit } from './types'

export interface PickCtx {
  vp: Viewport
  nodes: Node[]
  anchors: Anchor[]
  now: number
  hardOut: (n: Node) => boolean
  nodeRadius: (n: Node) => number
}

const DEPTH_EPS = 1e-6

export const pickNode = (c: PickCtx, sx: number, sy: number): Node | null => {
  let best: Node | null = null
  let bd = 1e9
  let bz = -1
  for (const n of c.nodes) {
    if (c.hardOut(n)) continue
    const [nx, ny, dz] = c.vp.w2s(n.bx + n.ox, n.by + n.oy, n.bz)
    const rr = Math.max(6, c.nodeRadius(n) * c.vp.cam.s * dz) + 4
    const d = Math.hypot(sx - nx, sy - ny)
    if (d >= rr) continue
    const nearer = dz > bz + DEPTH_EPS
    const closer = Math.abs(dz - bz) <= DEPTH_EPS && d < bd
    if (!best || nearer || closer) {
      bd = d
      bz = dz
      best = n
    }
  }
  return best
}

export const pickSat = (c: PickCtx, sx: number, sy: number): SatHit | null => {
  let best: SatHit | null = null
  let bd = 1e9
  for (const n of c.nodes) {
    if (!n.repo.contributors.length || c.hardOut(n)) continue
    const [nx, ny, dz] = c.vp.w2s(n.bx + n.ox, n.by + n.oy, n.bz)
    const nr = c.nodeRadius(n) * c.vp.cam.s * dz
    n.repo.contributors.forEach((p, i) => {
      const [fx, fy] = satScreen(c.vp, n, i, nx, ny, nr, c.now)
      const d = Math.hypot(sx - fx, sy - fy)
      if (d < 9 && d < bd) {
        bd = d
        best = { node: n, i, login: p.login, merged: p.merged, last: p.last, x: fx, y: fy }
      }
    })
  }
  return best
}

export const pickCore = (c: PickCtx, sx: number, sy: number): boolean => {
  const [hx, hy, hdz] = c.vp.w2s(0, 0)
  return Math.hypot(sx - hx, sy - hy) < CORE_BASE * c.vp.cam.s * hdz + 10
}

export const pickDomain = (c: PickCtx, sx: number, sy: number): string | null => {
  for (const a of c.anchors) {
    if (Math.abs(sx - a.sx) < 48 && Math.abs(sy - a.sy) < 16) return a.key
  }
  return null
}
