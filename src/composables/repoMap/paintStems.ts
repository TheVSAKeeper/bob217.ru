import { depthAlpha, TAU, withAlpha } from './math'
import type { Frame } from './types'

const GROW_MS = 420
const TRACE_R = 2.2
const TRACE_ALPHA = 0.45
const STEM_W = 1
const STEM_TOP = 0.55
const STEM_TOP_HOVER = 0.9
const STEM_FOOT = 0.08

export const paintStems = (f: Frame): void => {
  const { ctx, vp } = f
  if (vp.flat()) return

  ctx.save()
  ctx.lineCap = 'round'
  for (const n of f.nodes) {
    if (n.bz <= 0 || f.hardOut(n)) continue
    const grow = f.reduce ? 1 : f.intro(n.introDelay, GROW_MS)
    if (grow <= 0) continue
    const wx = n.bx + n.ox
    const wy = n.by + n.oy
    const [tx, ty, tdz] = vp.w2s(wx, wy)
    const [sx, sy, dz] = vp.w2s(wx, wy, n.bz)
    const [fx, fy] = grow >= 1 ? [tx, ty] : vp.w2s(wx, wy, n.bz * (1 - grow))
    const dim = f.hover && f.hover !== n ? 0.4 : 1
    const haze = depthAlpha(dz)

    const grad = ctx.createLinearGradient(sx, sy, fx, fy)
    grad.addColorStop(0, withAlpha(n.col, (f.hover === n ? STEM_TOP_HOVER : STEM_TOP) * dim * haze))
    grad.addColorStop(1, withAlpha(n.col, STEM_FOOT * dim * haze))
    ctx.strokeStyle = grad
    ctx.lineWidth = Math.max(0.4, STEM_W * vp.cam.s * dz)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(fx, fy)
    ctx.stroke()

    ctx.globalAlpha = TRACE_ALPHA * depthAlpha(tdz) * dim * grow
    ctx.fillStyle = n.col
    ctx.beginPath()
    ctx.arc(tx, ty, Math.max(0.5, TRACE_R * vp.cam.s * tdz), 0, TAU)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  ctx.restore()
}
