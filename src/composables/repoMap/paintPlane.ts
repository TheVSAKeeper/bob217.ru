import { DOMAINS } from '@/composables/useForkMap'
import { D2R, depthAlpha, TAU, withAlpha, type Point } from './math'
import type { Frame } from './types'

const GRID = '#00bcd4'
const ACCENT = '#ffcc00'
const RINGS = [0.28, 0.4, 0.56, 0.76, 1]
const RING_STEPS = 56
const RING_ALPHA = 0.2
const RAY_ALPHA = 0.13
const RAY_FROM = 0.18
const WEDGE_ALPHA = 0.055
const WEDGE_MID = 0.6
const WEDGE_STEPS = 12
const POOL_ALPHA = 0.1
const POOL_FRAC = 0.5
const FADE_MS = 900

const HALF_ARC = new Map(DOMAINS.map((d) => [d.key, (d.width / 2) * D2R]))

interface Depth {
  yLo: number
  yHi: number
  dzLo: number
  dzHi: number
}

const depthGrad = (
  ctx: CanvasRenderingContext2D,
  d: Depth,
  color: string,
  alpha: number,
): CanvasGradient => {
  const grad = ctx.createLinearGradient(0, d.yLo, 0, d.yHi)
  grad.addColorStop(0, withAlpha(color, alpha * depthAlpha(d.dzLo)))
  grad.addColorStop(1, withAlpha(color, alpha * depthAlpha(d.dzHi)))
  return grad
}

const ringPoints = (f: Frame, d: Depth): Point[][] => {
  const { vp } = f
  return RINGS.map((frac) => {
    const rad = frac * vp.R
    const pts: Point[] = []
    for (let i = 0; i <= RING_STEPS; i++) {
      const t = (i / RING_STEPS) * TAU
      const [x, y, dz] = vp.w2s(Math.cos(t) * rad * vp.kx, Math.sin(t) * rad)
      pts.push([x, y])
      if (y < d.yLo) {
        d.yLo = y
        d.dzLo = dz
      }
      if (y > d.yHi) {
        d.yHi = y
        d.dzHi = dz
      }
    }
    return pts
  })
}

const strokeRings = (f: Frame, rings: Point[][], d: Depth, fade: number): void => {
  const { ctx, vp } = f
  ctx.save()
  ctx.lineWidth = 1
  ctx.strokeStyle = depthGrad(ctx, d, GRID, RING_ALPHA * fade)
  for (const pts of rings) {
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  ctx.strokeStyle = depthGrad(ctx, d, GRID, RAY_ALPHA * fade)
  ctx.beginPath()
  for (const dom of DOMAINS) {
    const ang = (dom.bisector - dom.width / 2) * D2R
    const cx = Math.cos(ang) * vp.kx
    const sy = Math.sin(ang)
    const [ix, iy] = vp.w2s(cx * RAY_FROM * vp.R, sy * RAY_FROM * vp.R)
    const [ox, oy] = vp.w2s(cx * vp.R, sy * vp.R)
    ctx.moveTo(ix, iy)
    ctx.lineTo(ox, oy)
  }
  ctx.stroke()
  ctx.restore()
}

type PlaneMat = [number, number, number, number, number, number]

const planeMat = (f: Frame): PlaneMat | null => {
  const { vp } = f
  const L = vp.R
  const [ox, oy] = vp.w2s(0, 0)
  const [xx, xy] = vp.w2s(L, 0)
  const [yx, yy] = vp.w2s(0, L)
  const m: PlaneMat = [(xx - ox) / L, (xy - oy) / L, (yx - ox) / L, (yy - oy) / L, ox, oy]
  return m.every(Number.isFinite) ? m : null
}

const usePlane = (ctx: CanvasRenderingContext2D, m: PlaneMat, kx: number): void => {
  ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
  ctx.scale(kx, 1)
}

const paintWedges = (f: Frame, fade: number): void => {
  const { ctx, vp } = f
  const rim = (ang: number, rad: number): Point => {
    const [x, y] = vp.w2s(Math.cos(ang) * rad * vp.kx, Math.sin(ang) * rad)
    return [x, y]
  }
  const [cx, cy] = rim(0, 0)
  for (const a of f.anchors) {
    const half = HALF_ARC.get(a.key)
    if (!a.count || !half) continue
    const mid = WEDGE_MID * vp.R
    const dz = vp.w2s(Math.cos(a.ang) * mid * vp.kx, Math.sin(a.ang) * mid)[2]
    const alpha = WEDGE_ALPHA * fade * depthAlpha(dz) * (1 + 1.4 * f.domGlow(a.key))
    const [mx, my] = rim(a.ang, vp.R)
    const grad = ctx.createLinearGradient(cx, cy, mx, my)
    grad.addColorStop(0, withAlpha(a.color, alpha))
    grad.addColorStop(0.6, withAlpha(a.color, alpha * 0.6))
    grad.addColorStop(1, withAlpha(a.color, 0))
    ctx.save()
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    for (let i = 0; i <= WEDGE_STEPS; i++) {
      const [x, y] = rim(a.ang - half + (2 * half * i) / WEDGE_STEPS, vp.R)
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

const paintPool = (f: Frame, m: PlaneMat, fade: number): void => {
  const { ctx, vp } = f
  const rad = POOL_FRAC * vp.R
  const alpha = POOL_ALPHA * fade * (f.hoverCore ? 1.6 : 1)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  usePlane(ctx, m, vp.kx)
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad)
  grad.addColorStop(0, withAlpha(ACCENT, alpha))
  grad.addColorStop(0.45, withAlpha(ACCENT, alpha * 0.45))
  grad.addColorStop(1, withAlpha(ACCENT, 0))
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, rad, 0, TAU)
  ctx.fill()
  ctx.restore()
}

export const paintPlane = (f: Frame): void => {
  const { vp } = f
  if (vp.flat() || vp.R <= 1) return
  const fade = f.intro(0, FADE_MS)
  if (fade <= 0) return
  const m = planeMat(f)
  if (!m) return
  const d: Depth = { yLo: Infinity, yHi: -Infinity, dzLo: 1, dzHi: 1 }
  const rings = ringPoints(f, d)
  paintWedges(f, fade)
  paintPool(f, m, fade)
  if (d.yHi - d.yLo > 1) strokeRings(f, rings, d, fade)
}
